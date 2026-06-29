// src/modules/assignments/submission.service.ts
import { Prisma, Role, SubmissionStatus, GradingStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError, ForbiddenError, ValidationError, ConflictError } from '../../common/errors';
import { validateGrade, applyLatePenalty } from './grading-engine.service';
import { recalculateOverallProgress } from '../enrollments/progress-calculator.service';
import { cacheDelete } from '../../common/services/cache.service';
import { CACHE_KEYS } from '../enrollments/enrollment.types';
import type {
  SubmissionResponse,
  SubmissionListResponse,
  SubmissionFilters,
  CreatorSummary,
  GradeHistoryResponse,
} from './assignment.types';
import type {
  CreateSubmissionInput,
  UpdateSubmissionInput,
  GradeSubmissionInput,
  SubmitRevisionInput,
} from './assignment.schemas';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

function assertValidObjectId(id: string, what = 'Resource'): void {
  if (!OBJECT_ID_RE.test(id)) {
    throw new NotFoundError(`${what} not found`);
  }
}

function toCreatorSummary(u: { id: string; email: string; firstName: string; lastName: string; role: Role }): CreatorSummary {
  return { id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName, role: u.role };
}

async function assertCanManageAssignment(
  assignmentId: string,
  viewer: { id: string; role: Role },
): Promise<{ id: string; createdBy: string; title: string; maxPoints: number }> {
  assertValidObjectId(assignmentId, 'Assignment');
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { id: true, createdBy: true, title: true, maxPoints: true },
  });
  if (!assignment) throw new NotFoundError('Assignment not found');
  if (viewer.role === 'ADMIN') return assignment;
  if (viewer.role === 'TEACHER' && assignment.createdBy === viewer.id) return assignment;
  throw new ForbiddenError('You can only manage assignments you own');
}

// ---------------------------------------------------------------------------
// Create / update submissions
// ---------------------------------------------------------------------------

export async function createSubmission(
  assignmentId: string,
  userId: string,
  data: CreateSubmissionInput,
): Promise<SubmissionResponse> {
  assertValidObjectId(assignmentId, 'Assignment');
  assertValidObjectId(data.enrollmentId, 'Enrollment');

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true, status: true, dueDate: true, lateSubmissionDeadline: true,
      allowResubmissions: true, maxResubmissions: true, requiresFileUpload: true,
      allowedFileTypes: true, maxFileSizeMB: true, contentId: true,
    },
  });
  if (!assignment) throw new NotFoundError('Assignment not found');
  if (assignment.status !== 'PUBLISHED') {
    throw new ValidationError('Can only submit to PUBLISHED assignments');
  }

  // Verify enrollment belongs to this user and is ACTIVE
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: data.enrollmentId },
    select: { id: true, userId: true, status: true, courseId: true },
  });
  if (!enrollment) throw new NotFoundError('Enrollment not found');
  if (enrollment.userId !== userId) {
    throw new ForbiddenError('You can only submit for your own enrollments');
  }
  if (enrollment.status !== 'ACTIVE') {
    throw new ValidationError('Cannot submit on a non-active enrollment');
  }

  // If assignment is linked to content, verify content belongs to enrolled course
  if (assignment.contentId) {
    const content = await prisma.content.findUnique({
      where: { id: assignment.contentId },
      select: { module: { select: { course: { select: { id: true } } } } },
    });
    if (content && content.module.course.id !== enrollment.courseId) {
      throw new ForbiddenError('Assignment does not belong to your enrolled course');
    }
  }

  // Check for existing submissions (resubmission logic)
  const existingSubmissions = await prisma.submission.findMany({
    where: { assignmentId, userId },
    orderBy: { version: 'desc' },
  });

  const now = new Date();

  // Determine submission status (on-time vs late)
  let status: SubmissionStatus = SubmissionStatus.SUBMITTED;
  if (assignment.dueDate && now > assignment.dueDate) {
    // Check if within late submission window
    if (assignment.lateSubmissionDeadline && now > assignment.lateSubmissionDeadline) {
      throw new ValidationError('Submission deadline has passed (including late window)');
    }
    status = SubmissionStatus.LATE;
  }

  // Validate file requirements
  if (assignment.requiresFileUpload) {
    const files = data.content.files ?? [];
    if (files.length === 0) {
      throw new ValidationError('This assignment requires at least one file upload');
    }
    // Validate file types
    for (const file of files) {
      const ext = (file.format || file.original_filename.split('.').pop() || '').toLowerCase();
      if (assignment.allowedFileTypes.length > 0 && !assignment.allowedFileTypes.includes(ext)) {
        throw new ValidationError(
          `File "${file.original_filename}" has unsupported type "${ext}". Allowed: ${assignment.allowedFileTypes.join(', ')}`,
        );
      }
      // Validate file size
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > assignment.maxFileSizeMB) {
        throw new ValidationError(
          `File "${file.original_filename}" exceeds max size of ${assignment.maxFileSizeMB}MB`,
        );
      }
    }
  }

  let version = 1;
  let previousId: string | null = null;

  if (existingSubmissions.length > 0) {
    const latest = existingSubmissions[0];
    // Check resubmission limits
    if (!assignment.allowResubmissions) {
      throw new ConflictError('Resubmissions are not allowed for this assignment');
    }
    // Count non-draft versions
    const submittedCount = existingSubmissions.filter(
      (s) => s.status !== SubmissionStatus.NOT_SUBMITTED,
    ).length;
    if (submittedCount >= assignment.maxResubmissions + 1) {
      throw new ConflictError(
        `Maximum submissions (${assignment.maxResubmissions + 1}) reached for this assignment`,
      );
    }
    version = latest.version + 1;
    previousId = latest.id;
  }

  const submission = await prisma.submission.create({
    data: {
      assignmentId,
      userId,
      enrollmentId: data.enrollmentId,
      status,
      submittedAt: now,
      version,
      content: data.content as Prisma.InputJsonValue,
      gradingStatus: GradingStatus.NOT_GRADED,
    },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
    },
  });

  // If this is a resubmission, mark the previous one as RESUBMITTED
  if (previousId) {
    await prisma.submission.update({
      where: { id: previousId },
      data: { status: SubmissionStatus.RESUBMITTED },
    });
  }

  // Update progress on the linked content
  if (assignment.contentId) {
    await updateProgressForSubmission(data.enrollmentId, assignment.contentId, userId);
  }

  return {
    ...submission,
    user: submission.user ? toCreatorSummary(submission.user) : undefined,
    grader: null,
  };
}

export async function updateSubmission(
  submissionId: string,
  userId: string,
  data: UpdateSubmissionInput,
): Promise<SubmissionResponse> {
  assertValidObjectId(submissionId, 'Submission');
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: { id: true, userId: true, status: true, assignmentId: true },
  });
  if (!submission) throw new NotFoundError('Submission not found');
  if (submission.userId !== userId) {
    throw new ForbiddenError('You can only update your own submissions');
  }
  if (submission.status === SubmissionStatus.GRADED || submission.status === SubmissionStatus.RETURNED) {
    throw new ValidationError('Cannot update a graded/returned submission');
  }

  const updated = await prisma.submission.update({
    where: { id: submissionId },
    data: { content: data.content as Prisma.InputJsonValue, submittedAt: new Date() },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
    },
  });

  return {
    ...updated,
    user: updated.user ? toCreatorSummary(updated.user) : undefined,
    grader: null,
  };
}

// ---------------------------------------------------------------------------
// Get submissions
// ---------------------------------------------------------------------------

export async function getSubmission(
  submissionId: string,
  viewer: { id: string; role: Role },
): Promise<SubmissionResponse> {
  assertValidObjectId(submissionId, 'Submission');
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
      grader: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
      assignment: { select: { createdBy: true } },
    },
  });
  if (!submission) throw new NotFoundError('Submission not found');

  // Permission: admin, assignment owner, or submission owner
  const isOwner = submission.userId === viewer.id;
  const isAssignmentOwner = submission.assignment.createdBy === viewer.id;
  if (viewer.role !== 'ADMIN' && !isOwner && !isAssignmentOwner) {
    throw new ForbiddenError('You can only view your own submissions or those for assignments you own');
  }

  return {
    ...submission,
    user: submission.user ? toCreatorSummary(submission.user) : undefined,
    grader: submission.grader ? toCreatorSummary(submission.grader) : null,
  };
}

export async function getSubmissions(
  assignmentId: string,
  filters: SubmissionFilters,
  viewer: { id: string; role: Role },
): Promise<SubmissionListResponse> {
  assertValidObjectId(assignmentId, 'Assignment');
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { id: true, createdBy: true },
  });
  if (!assignment) throw new NotFoundError('Assignment not found');

  const where: Prisma.SubmissionWhereInput = { assignmentId };

  // Students see only their own submissions
  // Teachers see submissions for their own assignments
  // Admins see all
  if (viewer.role === 'STUDENT') {
    where.userId = viewer.id;
  } else if (viewer.role === 'TEACHER' && assignment.createdBy !== viewer.id) {
    // Teacher trying to view submissions for an assignment they don't own — restrict to own
    where.userId = viewer.id;
  }

  if (filters.status) where.status = filters.status as SubmissionStatus;
  if (filters.gradingStatus) where.gradingStatus = filters.gradingStatus as GradingStatus;
  if (filters.userId) where.userId = filters.userId;

  const skip = (filters.page - 1) * filters.limit;
  const take = filters.limit;

  const [rows, total] = await Promise.all([
    prisma.submission.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
        grader: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
      },
    }),
    prisma.submission.count({ where }),
  ]);

  return {
    data: rows.map((s) => ({
      ...s,
      user: s.user ? toCreatorSummary(s.user) : undefined,
      grader: s.grader ? toCreatorSummary(s.grader) : null,
    })),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  };
}

// ---------------------------------------------------------------------------
// Grading
// ---------------------------------------------------------------------------

export async function gradeSubmission(
  submissionId: string,
  viewer: { id: string; role: Role },
  data: GradeSubmissionInput,
): Promise<SubmissionResponse> {
  assertValidObjectId(submissionId, 'Submission');
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      assignment: {
        select: {
          id: true, createdBy: true, maxPoints: true, dueDate: true,
          lateSubmissionDeadline: true, latePenaltyPercentage: true, contentId: true,
        },
      },
      user: { select: { id: true } },
    },
  });
  if (!submission) throw new NotFoundError('Submission not found');

  // Permission: admin or assignment owner
  if (viewer.role !== 'ADMIN' && submission.assignment.createdBy !== viewer.id) {
    throw new ForbiddenError('You can only grade submissions for assignments you own');
  }

  // Validate grade
  validateGrade(data.grade, submission.assignment.maxPoints);

  // Apply late penalty if submission was late
  let finalGrade = data.grade;
  let penaltyInfo: { penaltyPercent: number; daysLate: number } | null = null;
  if (submission.submittedAt && submission.status === SubmissionStatus.LATE) {
    const result = applyLatePenalty(data.grade, submission.submittedAt, {
      dueDate: submission.assignment.dueDate,
      lateSubmissionDeadline: submission.assignment.lateSubmissionDeadline,
      latePenaltyPercentage: submission.assignment.latePenaltyPercentage,
    });
    finalGrade = result.grade;
    if (result.penalty) {
      penaltyInfo = {
        penaltyPercent: result.penalty.penaltyPercent,
        daysLate: result.penalty.daysLate,
      };
    }
  }

  // Save grade history
  await prisma.gradeHistory.create({
    data: {
      submissionId,
      previousGrade: submission.grade,
      newGrade: finalGrade,
      changedBy: viewer.id,
      reason: penaltyInfo
        ? `Late penalty applied: ${penaltyInfo.penaltyPercent}% (${penaltyInfo.daysLate} days late)`
        : undefined,
    },
  });

  const feedbackWithPenalty = penaltyInfo
    ? `${data.feedback ?? ''}\n\n[Auto-applied late penalty: ${penaltyInfo.penaltyPercent}% for ${penaltyInfo.daysLate} day(s) late]`.trim()
    : data.feedback;

  // If revision requested, mark accordingly (don't set grade as final)
  if (data.revisionRequested) {
    const updated = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        revisionRequested: true,
        revisionComments: data.revisionComments,
        feedback: feedbackWithPenalty,
        status: SubmissionStatus.REVISION_REQUESTED,
        gradingStatus: GradingStatus.IN_PROGRESS,
      },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
        grader: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
      },
    });
    return {
      ...updated,
      user: updated.user ? toCreatorSummary(updated.user) : undefined,
      grader: updated.grader ? toCreatorSummary(updated.grader) : null,
    };
  }

  const updated = await prisma.submission.update({
    where: { id: submissionId },
    data: {
      grade: finalGrade,
      feedback: feedbackWithPenalty,
      gradedAt: new Date(),
      gradedBy: viewer.id,
      gradingStatus: GradingStatus.GRADED,
      status: SubmissionStatus.GRADED,
    },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
      grader: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
    },
  });

  // Update progress on linked content
  if (submission.assignment.contentId && submission.user) {
    const passed = finalGrade >= (submission.assignment.maxPoints * 0.6); // 60% = pass threshold
    await updateProgressForGradedSubmission(
      submission.enrollmentId,
      submission.assignment.contentId,
      submission.user.id,
      passed,
    );
  }

  return {
    ...updated,
    user: updated.user ? toCreatorSummary(updated.user) : undefined,
    grader: updated.grader ? toCreatorSummary(updated.grader) : null,
  };
}

// ---------------------------------------------------------------------------
// Revision flow
// ---------------------------------------------------------------------------

export async function requestRevision(
  submissionId: string,
  viewer: { id: string; role: Role },
  comments: string,
): Promise<SubmissionResponse> {
  assertValidObjectId(submissionId, 'Submission');
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { assignment: { select: { createdBy: true } } },
  });
  if (!submission) throw new NotFoundError('Submission not found');

  if (viewer.role !== 'ADMIN' && submission.assignment.createdBy !== viewer.id) {
    throw new ForbiddenError('You can only request revisions for assignments you own');
  }

  const updated = await prisma.submission.update({
    where: { id: submissionId },
    data: {
      revisionRequested: true,
      revisionComments: comments,
      status: SubmissionStatus.REVISION_REQUESTED,
      gradingStatus: GradingStatus.IN_PROGRESS,
    },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
      grader: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
    },
  });

  return {
    ...updated,
    user: updated.user ? toCreatorSummary(updated.user) : undefined,
    grader: updated.grader ? toCreatorSummary(updated.grader) : null,
  };
}

export async function submitRevision(
  submissionId: string,
  userId: string,
  data: SubmitRevisionInput,
): Promise<SubmissionResponse> {
  assertValidObjectId(submissionId, 'Submission');
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: {
      id: true, userId: true, assignmentId: true, enrollmentId: true,
      status: true, version: true,
      assignment: {
        select: {
          allowResubmissions: true, maxResubmissions: true,
          requiresFileUpload: true, allowedFileTypes: true, maxFileSizeMB: true,
        },
      },
    },
  });
  if (!submission) throw new NotFoundError('Submission not found');
  if (submission.userId !== userId) {
    throw new ForbiddenError('You can only revise your own submissions');
  }
  if (submission.status !== SubmissionStatus.REVISION_REQUESTED) {
    throw new ValidationError('Can only revise submissions that have a revision requested');
  }

  // Validate file requirements
  if (submission.assignment.requiresFileUpload) {
    const files = data.content.files ?? [];
    if (files.length === 0) {
      throw new ValidationError('This assignment requires at least one file upload');
    }
    for (const file of files) {
      const ext = (file.format || file.original_filename.split('.').pop() || '').toLowerCase();
      if (submission.assignment.allowedFileTypes.length > 0 && !submission.assignment.allowedFileTypes.includes(ext)) {
        throw new ValidationError(`File "${file.original_filename}" has unsupported type "${ext}"`);
      }
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > submission.assignment.maxFileSizeMB) {
        throw new ValidationError(`File "${file.original_filename}" exceeds max size of ${submission.assignment.maxFileSizeMB}MB`);
      }
    }
  }

  // Create a new submission version
  const newVersion = submission.version + 1;
  const newSubmission = await prisma.submission.create({
    data: {
      assignmentId: submission.assignmentId,
      userId,
      enrollmentId: submission.enrollmentId,
      status: SubmissionStatus.RESUBMITTED,
      submittedAt: new Date(),
      version: newVersion,
      content: data.content as Prisma.InputJsonValue,
      gradingStatus: GradingStatus.NOT_GRADED,
    },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
      grader: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
    },
  });

  // Mark the original as RESUBMITTED
  await prisma.submission.update({
    where: { id: submissionId },
    data: { status: SubmissionStatus.RESUBMITTED },
  });

  return {
    ...newSubmission,
    user: newSubmission.user ? toCreatorSummary(newSubmission.user) : undefined,
    grader: null,
  };
}

// ---------------------------------------------------------------------------
// Grade history
// ---------------------------------------------------------------------------

export async function getGradeHistory(
  submissionId: string,
  viewer: { id: string; role: Role },
): Promise<GradeHistoryResponse[]> {
  assertValidObjectId(submissionId, 'Submission');
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      assignment: { select: { createdBy: true } },
    },
  });
  if (!submission) throw new NotFoundError('Submission not found');

  // Permission
  const isOwner = submission.userId === viewer.id;
  const isAssignmentOwner = submission.assignment.createdBy === viewer.id;
  if (viewer.role !== 'ADMIN' && !isOwner && !isAssignmentOwner) {
    throw new ForbiddenError('You can only view grade history for your own submissions or those for assignments you own');
  }

  const history = await prisma.gradeHistory.findMany({
    where: { submissionId },
    orderBy: { createdAt: 'desc' },
    include: {
      changer: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
    },
  });

  return history.map((h) => ({
    id: h.id,
    submissionId: h.submissionId,
    previousGrade: h.previousGrade,
    newGrade: h.newGrade,
    changedBy: toCreatorSummary(h.changer),
    reason: h.reason,
    createdAt: h.createdAt,
  }));
}

// ---------------------------------------------------------------------------
// Progress integration (Step 6)
// ---------------------------------------------------------------------------

async function updateProgressForSubmission(
  enrollmentId: string,
  contentId: string,
  userId: string,
): Promise<void> {
  const existing = await prisma.progress.findUnique({
    where: { enrollmentId_contentId: { enrollmentId, contentId } },
  });

  if (existing) {
    await prisma.progress.update({
      where: { id: existing.id },
      data: {
        progressPercent: Math.max(existing.progressPercent, 50), // submitted = 50% until graded
        status: 'IN_PROGRESS',
        lastAccessedAt: new Date(),
      },
    });
  } else {
    await prisma.progress.create({
      data: {
        enrollmentId,
        contentId,
        progressPercent: 50,
        status: 'IN_PROGRESS',
      },
    });
  }

  await recalculateOverallProgress(enrollmentId);
  await cacheDelete(CACHE_KEYS.studentDashboard(userId));
  await cacheDelete(CACHE_KEYS.enrollmentProgress(enrollmentId));
}

async function updateProgressForGradedSubmission(
  enrollmentId: string,
  contentId: string,
  userId: string,
  passed: boolean,
): Promise<void> {
  const existing = await prisma.progress.findUnique({
    where: { enrollmentId_contentId: { enrollmentId, contentId } },
  });

  const progressPercent = passed ? 100 : 50;
  const newStatus = passed ? 'COMPLETED' : 'IN_PROGRESS';

  if (existing) {
    await prisma.progress.update({
      where: { id: existing.id },
      data: {
        progressPercent: Math.max(existing.progressPercent, progressPercent),
        status: newStatus === 'COMPLETED' ? 'COMPLETED' : existing.status,
        completedAt: passed ? (existing.completedAt ?? new Date()) : existing.completedAt,
        lastAccessedAt: new Date(),
      },
    });
  } else {
    await prisma.progress.create({
      data: {
        enrollmentId,
        contentId,
        progressPercent,
        status: newStatus,
        completedAt: passed ? new Date() : null,
      },
    });
  }

  await recalculateOverallProgress(enrollmentId);
  await cacheDelete(CACHE_KEYS.studentDashboard(userId));
  await cacheDelete(CACHE_KEYS.enrollmentProgress(enrollmentId));
}
