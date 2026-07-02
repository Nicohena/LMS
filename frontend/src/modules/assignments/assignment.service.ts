// src/modules/assignments/assignment.service.ts
import { Prisma, Role } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError, ForbiddenError, ValidationError, ConflictError } from '../../common/errors';
import type {
  AssignmentFilters,
  AssignmentListResponse,
  AssignmentResponse,
  AssignmentDetailResponse,
  AssignmentAnalyticsResponse,
  CreatorSummary,
} from './assignment.types';
import type {
  CreateAssignmentInput,
  CreateRubricInput,
  UpdateAssignmentInput,
  UpdateRubricInput,
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

function toAssignmentResponse(a: any): AssignmentResponse {
  const { creator, _count, rubric, ...rest } = a;
  return {
    ...rest,
    createdBy: toCreatorSummary(creator),
    submissionCount: _count?.submissions ?? 0,
    hasRubric: rubric ? true : false,
  };
}

async function assertCanManageAssignment(
  assignmentId: string,
  viewer: { id: string; role: Role },
): Promise<{ id: string; createdBy: string; title: string }> {
  assertValidObjectId(assignmentId, 'Assignment');
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { id: true, createdBy: true, title: true },
  });
  if (!assignment) throw new NotFoundError('Assignment not found');
  if (viewer.role === 'ADMIN') return assignment;
  if (viewer.role === 'TEACHER' && assignment.createdBy === viewer.id) return assignment;
  throw new ForbiddenError('You can only manage assignments you own');
}

async function assertCanManageContent(
  contentId: string,
  viewer: { id: string; role: Role },
): Promise<void> {
  assertValidObjectId(contentId, 'Content');
  const content = await prisma.content.findUnique({
    where: { id: contentId },
    select: { id: true, module: { select: { course: { select: { createdBy: true } } } } },
  });
  if (!content) throw new NotFoundError('Content not found');
  if (viewer.role === 'ADMIN') return;
  if (viewer.role === 'TEACHER' && content.module.course.createdBy === viewer.id) return;
  throw new ForbiddenError('You can only link assignments to content in courses you own');
}

function buildWhere(
  filters: AssignmentFilters,
  viewer?: { id: string; role: Role },
): Prisma.AssignmentWhereInput {
  const where: Prisma.AssignmentWhereInput = {};

  const isAuthor = viewer && (viewer.role === 'ADMIN' || viewer.role === 'TEACHER');
  if (filters.status) {
    where.status = filters.status;
  } else if (isAuthor) {
    where.OR = [{ status: 'PUBLISHED' }, { createdBy: viewer!.id }];
  } else {
    where.status = 'PUBLISHED';
  }

  if (filters.contentId) where.contentId = filters.contentId;
  if (filters.createdBy) where.createdBy = filters.createdBy;
  if (filters.search) {
    where.AND = [
      ...(where.AND ? (Array.isArray(where.AND) ? where.AND : [where.AND]) : []),
      {
        OR: [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ],
      },
    ];
  }
  return where;
}

// ---------------------------------------------------------------------------
// Assignment CRUD
// ---------------------------------------------------------------------------

export async function createAssignment(
  userId: string,
  role: Role,
  data: CreateAssignmentInput,
): Promise<AssignmentResponse> {
  if (role !== 'ADMIN' && role !== 'TEACHER') {
    throw new ForbiddenError('Only admins and teachers can create assignments');
  }

  if (data.contentId) {
    await assertCanManageContent(data.contentId, { id: userId, role });
  }

  // Validate due date / late submission deadline ordering
  if (data.dueDate && data.lateSubmissionDeadline && data.lateSubmissionDeadline <= data.dueDate) {
    throw new ValidationError('Late submission deadline must be after the due date');
  }

  const assignment = await prisma.assignment.create({
    data: {
      contentId: data.contentId,
      title: data.title,
      description: data.description,
      instructions: data.instructions,
      dueDate: data.dueDate,
      lateSubmissionDeadline: data.lateSubmissionDeadline,
      latePenaltyPercentage: data.latePenaltyPercentage,
      maxPoints: data.maxPoints,
      allowResubmissions: data.allowResubmissions,
      maxResubmissions: data.maxResubmissions,
      allowPeerReview: data.allowPeerReview,
      peerReviewDeadline: data.peerReviewDeadline,
      peerReviewCount: data.peerReviewCount,
      requiresFileUpload: data.requiresFileUpload,
      allowedFileTypes: data.allowedFileTypes,
      maxFileSizeMB: data.maxFileSizeMB,
      status: data.status,
      createdBy: userId,
    },
    include: {
      creator: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
      _count: { select: { submissions: true } },
    },
  });

  return toAssignmentResponse(assignment);
}

export async function getAssignment(
  assignmentId: string,
  viewer?: { id: string; role: Role },
): Promise<AssignmentDetailResponse> {
  assertValidObjectId(assignmentId, 'Assignment');
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      creator: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
      rubric: true,
      _count: { select: { submissions: true } },
    },
  });
  if (!assignment) throw new NotFoundError('Assignment not found');

  const isAuthor = viewer && (viewer.role === 'ADMIN' || viewer.role === 'TEACHER');
  const isOwner = viewer && assignment.createdBy === viewer.id;
  if (!isAuthor && assignment.status !== 'PUBLISHED' && !isOwner) {
    throw new NotFoundError('Assignment not found');
  }

  return toAssignmentResponse(assignment) as AssignmentDetailResponse;
}

export async function getAssignments(
  filters: AssignmentFilters,
  viewer?: { id: string; role: Role },
): Promise<AssignmentListResponse> {
  const where = buildWhere(filters, viewer);
  const skip = (filters.page - 1) * filters.limit;
  const take = filters.limit;

  const [rows, total] = await Promise.all([
    prisma.assignment.findMany({
      where,
      skip,
      take,
      orderBy: { [filters.sortBy]: filters.sortOrder },
      include: {
        creator: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
        _count: { select: { submissions: true } },
      },
    }),
    prisma.assignment.count({ where }),
  ]);

  return {
    data: rows.map(toAssignmentResponse),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  };
}

export async function updateAssignment(
  assignmentId: string,
  viewer: { id: string; role: Role },
  data: UpdateAssignmentInput,
): Promise<AssignmentResponse> {
  await assertCanManageAssignment(assignmentId, viewer);

  if (data.contentId) {
    await assertCanManageContent(data.contentId, viewer);
  }

  if (data.dueDate && data.lateSubmissionDeadline && data.lateSubmissionDeadline <= data.dueDate) {
    throw new ValidationError('Late submission deadline must be after the due date');
  }

  const updated = await prisma.assignment.update({
    where: { id: assignmentId },
    data,
    include: {
      creator: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
      _count: { select: { submissions: true } },
    },
  });

  return toAssignmentResponse(updated);
}

export async function deleteAssignment(
  assignmentId: string,
  viewer: { id: string; role: Role },
): Promise<{ id: string; status: string }> {
  await assertCanManageAssignment(assignmentId, viewer);

  const updated = await prisma.assignment.update({
    where: { id: assignmentId },
    data: { status: 'ARCHIVED' },
    select: { id: true, status: true },
  });

  return updated;
}

// ---------------------------------------------------------------------------
// Rubric management
// ---------------------------------------------------------------------------

export async function createRubric(
  assignmentId: string,
  viewer: { id: string; role: Role },
  data: CreateRubricInput,
): Promise<{ id: string; assignmentId: string; name: string }> {
  await assertCanManageAssignment(assignmentId, viewer);

  // Check if rubric already exists (one-to-one relation)
  const existing = await prisma.rubric.findUnique({ where: { assignmentId } });
  if (existing) {
    throw new ConflictError('Assignment already has a rubric. Use PATCH to update it.');
  }

  const rubric = await prisma.rubric.create({
    data: {
      assignmentId,
      name: data.name,
      description: data.description,
      criteria: data.criteria as Prisma.InputJsonValue,
      totalPoints: data.totalPoints,
    },
    select: { id: true, assignmentId: true, name: true },
  });

  return rubric;
}

export async function getRubricForAssignment(
  assignmentId: string,
): Promise<{ rubric: any | null }> {
  assertValidObjectId(assignmentId, 'Assignment');
  const rubric = await prisma.rubric.findUnique({ where: { assignmentId } });
  return { rubric };
}

export async function updateRubric(
  rubricId: string,
  viewer: { id: string; role: Role },
  data: UpdateRubricInput,
): Promise<{ id: string; name: string }> {
  assertValidObjectId(rubricId, 'Rubric');
  const rubric = await prisma.rubric.findUnique({
    where: { id: rubricId },
    select: { id: true, assignment: { select: { createdBy: true } } },
  });
  if (!rubric) throw new NotFoundError('Rubric not found');

  if (viewer.role !== 'ADMIN' && rubric.assignment.createdBy !== viewer.id) {
    throw new ForbiddenError('You can only manage rubrics for assignments you own');
  }

  const updated = await prisma.rubric.update({
    where: { id: rubricId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.criteria !== undefined && { criteria: data.criteria as Prisma.InputJsonValue }),
      ...(data.totalPoints !== undefined && { totalPoints: data.totalPoints }),
    },
    select: { id: true, name: true },
  });

  return updated;
}

export async function deleteRubric(
  rubricId: string,
  viewer: { id: string; role: Role },
): Promise<{ id: string; deleted: boolean }> {
  assertValidObjectId(rubricId, 'Rubric');
  const rubric = await prisma.rubric.findUnique({
    where: { id: rubricId },
    select: { id: true, assignment: { select: { createdBy: true } } },
  });
  if (!rubric) throw new NotFoundError('Rubric not found');

  if (viewer.role !== 'ADMIN' && rubric.assignment.createdBy !== viewer.id) {
    throw new ForbiddenError('You can only manage rubrics for assignments you own');
  }

  await prisma.rubric.delete({ where: { id: rubricId } });
  return { id: rubricId, deleted: true };
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export async function getAssignmentAnalytics(
  assignmentId: string,
  viewer: { id: string; role: Role },
): Promise<AssignmentAnalyticsResponse> {
  await assertCanManageAssignment(assignmentId, viewer);

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { id: true, title: true, contentId: true, maxPoints: true },
  });
  if (!assignment) throw new NotFoundError('Assignment not found');

  // Get all submissions for this assignment
  const submissions = await prisma.submission.findMany({
    where: { assignmentId },
    select: {
      id: true,
      status: true,
      gradingStatus: true,
      grade: true,
      submittedAt: true,
      userId: true,
    },
  });

  const totalSubmissions = submissions.length;
  const graded = submissions.filter((s) => s.gradingStatus === 'GRADED' && s.grade !== null);
  const lateSubmissions = submissions.filter((s) => s.status === 'LATE').length;
  const pendingGrading = submissions.filter(
    (s) => s.status === 'SUBMITTED' || s.status === 'LATE' || s.status === 'RESUBMITTED',
  ).length;

  // Compute total enrolled (if assignment is linked to content, count enrollments for that course)
  let totalEnrolled = 0;
  if (assignment.contentId) {
    const content = await prisma.content.findUnique({
      where: { id: assignment.contentId },
      select: { module: { select: { course: { select: { id: true } } } } },
    });
    if (content) {
      totalEnrolled = await prisma.enrollment.count({
        where: { courseId: content.module.course.id, status: 'ACTIVE' },
      });
    }
  }

  const grades = graded.map((s) => s.grade!);
  const averageScore = grades.length > 0
    ? Math.round((grades.reduce((sum, g) => sum + g, 0) / grades.length) * 100) / 100
    : 0;
  const sortedGrades = [...grades].sort((a, b) => a - b);
  const medianScore = sortedGrades.length > 0 ? sortedGrades[Math.floor(sortedGrades.length / 2)] : 0;

  // Grade distribution as percentage of maxPoints
  const maxPts = assignment.maxPoints;
  const buckets = [
    { range: '0-20%', count: 0 },
    { range: '20-40%', count: 0 },
    { range: '40-60%', count: 0 },
    { range: '60-80%', count: 0 },
    { range: '80-100%', count: 0 },
  ];
  for (const g of grades) {
    const pct = maxPts > 0 ? (g / maxPts) * 100 : 0;
    const idx = Math.min(Math.floor(pct / 20), 4);
    buckets[idx].count++;
  }

  return {
    assignmentId: assignment.id,
    assignmentTitle: assignment.title,
    totalEnrolled,
    totalSubmissions,
    submissionRate: totalEnrolled > 0 ? Math.round((totalSubmissions / totalEnrolled) * 10000) / 100 : 0,
    averageScore,
    medianScore,
    gradeDistribution: buckets,
    lateSubmissions,
    pendingGrading,
  };
}
