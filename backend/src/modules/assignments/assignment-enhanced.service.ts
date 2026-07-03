// src/modules/assignments/assignment-enhanced.service.ts
//
// Enhanced Assignment operations — Phase 2 of the Assignment module
// enhancement. These functions ADD to the existing assignment.service.ts
// without modifying it. New operations:
//   - Workflow: publish, schedule, close, reopen, archive, restore, duplicate
//   - Bulk grading
//   - Grade distribution
//   - Rubric templates (reusable rubrics)
//   - Resources (CRUD)
//   - Audit logging
//   - Submission stats
//
import { Prisma, Role } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError, ForbiddenError, ValidationError, ConflictError } from '../../common/errors';

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;
function assertValidObjectId(id: string, what = 'Resource'): void {
  if (!OBJECT_ID_RE.test(id)) throw new NotFoundError(`${what} not found`);
}

async function assertCanManage(assignmentId: string, viewer: { id: string; role: Role }) {
  assertValidObjectId(assignmentId, 'Assignment');
  const a = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { id: true, createdBy: true, title: true, status: true },
  });
  if (!a) throw new NotFoundError('Assignment not found');
  if (viewer.role === 'ADMIN') return a;
  if (viewer.role === 'TEACHER' && a.createdBy === viewer.id) return a;
  throw new ForbiddenError('You can only manage assignments you own');
}

// ---------------------------------------------------------------------------
// Audit log helper
// ---------------------------------------------------------------------------
async function writeAuditLog(entry: {
  assignmentId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  previousValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}) {
  try {
    await prisma.assignmentAuditLog.create({
      data: {
        assignmentId: entry.assignmentId,
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        previousValue: entry.previousValue ?? undefined,
        newValue: entry.newValue ?? undefined,
        ipAddress: entry.ipAddress ?? null,
        userAgent: entry.userAgent ?? null,
        metadata: entry.metadata ?? undefined,
      },
    });
  } catch {
    // Audit log failures should never break the main operation.
  }
}

// ---------------------------------------------------------------------------
// Workflow operations
// ---------------------------------------------------------------------------

export async function publishAssignment(
  assignmentId: string,
  viewer: { id: string; role: Role },
) {
  const a = await assertCanManage(assignmentId, viewer);
  if (a.status === 'PUBLISHED' || a.status === 'OPEN') {
    throw new ConflictError('Assignment is already published');
  }
  const updated = await prisma.assignment.update({
    where: { id: assignmentId },
    data: {
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });
  await writeAuditLog({
    assignmentId, userId: viewer.id, action: 'PUBLISH',
    entityType: 'Assignment', entityId: assignmentId,
    previousValue: { status: a.status }, newValue: { status: 'PUBLISHED' },
  });
  return updated;
}

export async function scheduleAssignment(
  assignmentId: string,
  viewer: { id: string; role: Role },
  publishDate: Date,
) {
  const a = await assertCanManage(assignmentId, viewer);
  if (publishDate <= new Date()) {
    throw new ValidationError('Schedule date must be in the future');
  }
  const updated = await prisma.assignment.update({
    where: { id: assignmentId },
    data: { status: 'SCHEDULED', publishDate },
  });
  await writeAuditLog({
    assignmentId, userId: viewer.id, action: 'SCHEDULE',
    entityType: 'Assignment', entityId: assignmentId,
    newValue: { status: 'SCHEDULED', publishDate },
  });
  return updated;
}

export async function closeAssignment(
  assignmentId: string,
  viewer: { id: string; role: Role },
) {
  const a = await assertCanManage(assignmentId, viewer);
  const updated = await prisma.assignment.update({
    where: { id: assignmentId },
    data: { status: 'CLOSED', closedAt: new Date() },
  });
  await writeAuditLog({
    assignmentId, userId: viewer.id, action: 'CLOSE',
    entityType: 'Assignment', entityId: assignmentId,
    previousValue: { status: a.status }, newValue: { status: 'CLOSED' },
  });
  return updated;
}

export async function reopenAssignment(
  assignmentId: string,
  viewer: { id: string; role: Role },
) {
  const a = await assertCanManage(assignmentId, viewer);
  const updated = await prisma.assignment.update({
    where: { id: assignmentId },
    data: { status: 'OPEN', closedAt: null },
  });
  await writeAuditLog({
    assignmentId, userId: viewer.id, action: 'REOPEN',
    entityType: 'Assignment', entityId: assignmentId,
    previousValue: { status: a.status }, newValue: { status: 'OPEN' },
  });
  return updated;
}

export async function archiveAssignment(
  assignmentId: string,
  viewer: { id: string; role: Role },
) {
  const a = await assertCanManage(assignmentId, viewer);
  const updated = await prisma.assignment.update({
    where: { id: assignmentId },
    data: { status: 'ARCHIVED', archivedAt: new Date() },
  });
  await writeAuditLog({
    assignmentId, userId: viewer.id, action: 'ARCHIVE',
    entityType: 'Assignment', entityId: assignmentId,
    previousValue: { status: a.status }, newValue: { status: 'ARCHIVED' },
  });
  return updated;
}

export async function restoreAssignment(
  assignmentId: string,
  viewer: { id: string; role: Role },
) {
  const a = await assertCanManage(assignmentId, viewer);
  if (a.status !== 'ARCHIVED') {
    throw new ConflictError('Only archived assignments can be restored');
  }
  const updated = await prisma.assignment.update({
    where: { id: assignmentId },
    data: { status: 'DRAFT', archivedAt: null },
  });
  await writeAuditLog({
    assignmentId, userId: viewer.id, action: 'RESTORE',
    entityType: 'Assignment', entityId: assignmentId,
    previousValue: { status: 'ARCHIVED' }, newValue: { status: 'DRAFT' },
  });
  return updated;
}

export async function duplicateAssignment(
  assignmentId: string,
  viewer: { id: string; role: Role },
  _options?: { includeSubmissions?: boolean },
) {
  await assertCanManage(assignmentId, viewer);
  const original = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { rubric: true, resources: true },
  });
  if (!original) throw new NotFoundError('Assignment not found');

  // Strip ids and relation objects, keep all configurable fields.
  const { id: _id, createdAt: _ca, updatedAt: _ua, rubric, resources: _res, submissions: _sub, peerReviews: _pr, auditLogs: _al, creator: _c, content: _con, ...fields } = original as any;

  const clone = await prisma.assignment.create({
    data: {
      ...fields,
      title: `${original.title} (Copy)`,
      status: 'DRAFT',
      publishedAt: null,
      closedAt: null,
      archivedAt: null,
      createdBy: viewer.id,
    },
  });

  // Copy rubric if present
  if (rubric) {
    await prisma.rubric.create({
      data: {
        assignmentId: clone.id,
        name: rubric.name,
        description: rubric.description,
        criteria: rubric.criteria as any,
        totalPoints: rubric.totalPoints,
      },
    });
  }

  // Copy resources
  if (original.resources && original.resources.length > 0) {
    await prisma.assignmentResource.createMany({
      data: original.resources.map((r: any) => ({
        assignmentId: clone.id,
        title: r.title,
        description: r.description,
        fileUrl: r.fileUrl,
        fileType: r.fileType,
        fileSize: r.fileSize,
        originalFilename: r.originalFilename,
        publicId: r.publicId,
        order: r.order,
      })),
    });
  }

  await writeAuditLog({
    assignmentId: clone.id, userId: viewer.id, action: 'DUPLICATE',
    entityType: 'Assignment', entityId: clone.id,
    newValue: { duplicatedFrom: assignmentId },
  });

  return clone;
}

// ---------------------------------------------------------------------------
// Bulk grading
// ---------------------------------------------------------------------------

export async function bulkGrade(
  assignmentId: string,
  viewer: { id: string; role: Role },
  grades: Array<{ submissionId: string; grade: number; feedback?: string }>,
) {
  await assertCanManage(assignmentId, viewer);

  if (!grades || grades.length === 0) {
    throw new ValidationError('At least one grade entry is required');
  }

  const results: Array<{ submissionId: string; success: boolean; error?: string }> = [];

  for (const entry of grades) {
    try {
      const submission = await prisma.submission.findUnique({
        where: { id: entry.submissionId },
        select: { id: true, assignmentId: true, grade: true, feedback: true },
      });
      if (!submission) {
        results.push({ submissionId: entry.submissionId, success: false, error: 'Submission not found' });
        continue;
      }
      if (submission.assignmentId !== assignmentId) {
        results.push({ submissionId: entry.submissionId, success: false, error: 'Submission does not belong to this assignment' });
        continue;
      }

      const previousGrade = submission.grade;
      const previousFeedback = submission.feedback;

      await prisma.submission.update({
        where: { id: entry.submissionId },
        data: {
          grade: entry.grade,
          feedback: entry.feedback ?? submission.feedback,
          gradedAt: new Date(),
          gradedBy: viewer.id,
          gradingStatus: 'GRADED',
          status: 'GRADED',
        },
      });

      // Record grade history
      await prisma.gradeHistory.create({
        data: {
          submissionId: entry.submissionId,
          previousGrade,
          newGrade: entry.grade,
          previousFeedback,
          newFeedback: entry.feedback,
          changedBy: viewer.id,
          reason: 'Bulk grade',
        },
      });

      results.push({ submissionId: entry.submissionId, success: true });
    } catch (err: any) {
      results.push({ submissionId: entry.submissionId, success: false, error: err.message || 'Unknown error' });
    }
  }

  await writeAuditLog({
    assignmentId, userId: viewer.id, action: 'GRADE',
    entityType: 'Submission',
    newValue: { bulkGrade: true, count: grades.length },
  });

  return { results, successCount: results.filter((r) => r.success).length, failureCount: results.filter((r) => !r.success).length };
}

// ---------------------------------------------------------------------------
// Grade distribution
// ---------------------------------------------------------------------------

export async function getGradeDistribution(
  assignmentId: string,
  viewer: { id: string; role: Role },
) {
  await assertCanManage(assignmentId, viewer);

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { id: true, maxPoints: true, passingMarks: true },
  });
  if (!assignment) throw new NotFoundError('Assignment not found');

  const submissions = await prisma.submission.findMany({
    where: { assignmentId, gradingStatus: 'GRADED', grade: { not: null } },
    select: { grade: true },
  });

  const grades = submissions.map((s) => s.grade!).filter((g) => g !== null);
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

  const average = grades.length > 0 ? grades.reduce((s, g) => s + g, 0) / grades.length : 0;
  const sorted = [...grades].sort((a, b) => a - b);
  const median = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 0;
  const highest = sorted.length > 0 ? sorted[sorted.length - 1] : 0;
  const lowest = sorted.length > 0 ? sorted[0] : 0;
  const passingThreshold = assignment.passingMarks ?? 0;
  const passingCount = grades.filter((g) => g >= passingThreshold).length;

  return {
    assignmentId,
    totalGraded: grades.length,
    average: Math.round(average * 100) / 100,
    median,
    highest,
    lowest,
    passingCount,
    failingCount: grades.length - passingCount,
    passRate: grades.length > 0 ? Math.round((passingCount / grades.length) * 10000) / 100 : 0,
    distribution: buckets,
  };
}

// ---------------------------------------------------------------------------
// Rubric templates (reusable rubrics)
// ---------------------------------------------------------------------------

export async function createRubricTemplate(
  viewer: { id: string; role: Role },
  data: { name: string; description?: string; criteria: any; totalPoints?: number },
) {
  if (viewer.role !== 'TEACHER' && viewer.role !== 'ADMIN') {
    throw new ForbiddenError('Only teachers and admins can create rubric templates');
  }
  const template = await prisma.rubricTemplate.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      criteria: data.criteria as any,
      totalPoints: data.totalPoints ?? 100,
      isTemplate: true,
      createdBy: viewer.id,
    },
  });
  return template;
}

export async function getRubricTemplates(
  viewer: { id: string; role: Role },
  filters?: { search?: string },
) {
  const where: Prisma.RubricTemplateWhereInput = {};
  if (viewer.role === 'TEACHER') {
    where.createdBy = viewer.id;
  }
  if (filters?.search) {
    where.name = { contains: filters.search, mode: 'insensitive' };
  }
  return prisma.rubricTemplate.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    include: { _count: { select: { assignments: true } } },
  });
}

export async function getRubricTemplate(id: string, viewer: { id: string; role: Role }) {
  assertValidObjectId(id, 'Rubric template');
  const t = await prisma.rubricTemplate.findUnique({ where: { id } });
  if (!t) throw new NotFoundError('Rubric template not found');
  if (viewer.role === 'TEACHER' && t.createdBy !== viewer.id) {
    throw new ForbiddenError('You can only view your own rubric templates');
  }
  return t;
}

export async function updateRubricTemplate(
  id: string,
  viewer: { id: string; role: Role },
  data: { name?: string; description?: string; criteria?: any; totalPoints?: number },
) {
  const t = await getRubricTemplate(id, viewer);
  return prisma.rubricTemplate.update({
    where: { id: t.id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.criteria !== undefined ? { criteria: data.criteria as any } : {}),
      ...(data.totalPoints !== undefined ? { totalPoints: data.totalPoints } : {}),
    },
  });
}

export async function deleteRubricTemplate(id: string, viewer: { id: string; role: Role }) {
  const t = await getRubricTemplate(id, viewer);
  await prisma.rubricTemplate.delete({ where: { id: t.id } });
  return { id: t.id };
}

export async function applyRubricTemplateToAssignment(
  templateId: string,
  assignmentId: string,
  viewer: { id: string; role: Role },
) {
  const template = await getRubricTemplate(templateId, viewer);
  await assertCanManage(assignmentId, viewer);

  // Upsert the per-assignment Rubric (copy criteria from the template).
  const existing = await prisma.rubric.findUnique({ where: { assignmentId } });
  if (existing) {
    const updated = await prisma.rubric.update({
      where: { assignmentId },
      data: {
        name: template.name,
        description: template.description,
        criteria: template.criteria as any,
        totalPoints: template.totalPoints,
      },
    });
    await prisma.assignment.update({
      where: { id: assignmentId },
      data: { rubricTemplateId: templateId },
    });
    return updated;
  }

  const rubric = await prisma.rubric.create({
    data: {
      assignmentId,
      name: template.name,
      description: template.description,
      criteria: template.criteria as any,
      totalPoints: template.totalPoints,
    },
  });
  await prisma.assignment.update({
    where: { id: assignmentId },
    data: { rubricTemplateId: templateId },
  });
  return rubric;
}

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------

export async function getResources(assignmentId: string) {
  assertValidObjectId(assignmentId, 'Assignment');
  return prisma.assignmentResource.findMany({
    where: { assignmentId },
    orderBy: { order: 'asc' },
  });
}

export async function uploadResource(
  assignmentId: string,
  viewer: { id: string; role: Role },
  data: { title: string; description?: string; fileUrl: string; fileType?: string; fileSize?: number; originalFilename?: string; publicId?: string },
) {
  await assertCanManage(assignmentId, viewer);
  const count = await prisma.assignmentResource.count({ where: { assignmentId } });
  const resource = await prisma.assignmentResource.create({
    data: {
      assignmentId,
      title: data.title,
      description: data.description ?? null,
      fileUrl: data.fileUrl,
      fileType: data.fileType ?? null,
      fileSize: data.fileSize ?? null,
      originalFilename: data.originalFilename ?? null,
      publicId: data.publicId ?? null,
      order: count,
    },
  });
  await writeAuditLog({
    assignmentId, userId: viewer.id, action: 'UPLOAD',
    entityType: 'Resource', entityId: resource.id,
    newValue: { title: data.title },
  });
  return resource;
}

export async function deleteResource(
  resourceId: string,
  viewer: { id: string; role: Role },
) {
  assertValidObjectId(resourceId, 'Resource');
  const resource = await prisma.assignmentResource.findUnique({
    where: { id: resourceId },
    select: { id: true, assignmentId: true },
  });
  if (!resource) throw new NotFoundError('Resource not found');
  await assertCanManage(resource.assignmentId, viewer);
  await prisma.assignmentResource.delete({ where: { id: resourceId } });
  await writeAuditLog({
    assignmentId: resource.assignmentId, userId: viewer.id, action: 'DELETE',
    entityType: 'Resource', entityId: resourceId,
  });
  return { id: resourceId };
}

// ---------------------------------------------------------------------------
// Audit logs
// ---------------------------------------------------------------------------

export async function getAuditLogs(
  assignmentId: string,
  viewer: { id: string; role: Role },
  filters?: { action?: string; userId?: string; limit?: number; page?: number },
) {
  await assertCanManage(assignmentId, viewer);
  const limit = Math.min(100, filters?.limit ?? 50);
  const page = Math.max(1, filters?.page ?? 1);
  const skip = (page - 1) * limit;

  const where: Prisma.AssignmentAuditLogWhereInput = { assignmentId };
  if (filters?.action) where.action = filters.action;
  if (filters?.userId) where.userId = filters.userId;

  const [logs, total] = await Promise.all([
    prisma.assignmentAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    }),
    prisma.assignmentAuditLog.count({ where }),
  ]);

  return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// ---------------------------------------------------------------------------
// Submission stats (for teacher dashboard)
// ---------------------------------------------------------------------------

export async function getSubmissionStats(
  assignmentId: string,
  viewer: { id: string; role: Role },
) {
  await assertCanManage(assignmentId, viewer);

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { id: true, contentId: true, maxPoints: true, dueDate: true },
  });
  if (!assignment) throw new NotFoundError('Assignment not found');

  // Total enrolled students (if linked to content)
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

  const submissions = await prisma.submission.findMany({
    where: { assignmentId },
    select: { id: true, status: true, gradingStatus: true, isLate: true, grade: true, submittedAt: true },
  });

  const submitted = submissions.filter((s) => s.status !== 'NOT_SUBMITTED').length;
  const missing = Math.max(0, totalEnrolled - submitted);
  const late = submissions.filter((s) => s.isLate || s.status === 'LATE').length;
  const pendingGrading = submissions.filter(
    (s) => s.status === 'SUBMITTED' || s.status === 'LATE' || s.status === 'RESUBMITTED',
  ).length;
  const graded = submissions.filter((s) => s.gradingStatus === 'GRADED').length;
  const drafts = submissions.filter((s) => s.status === 'NOT_SUBMITTED').length;

  const grades = submissions.filter((s) => s.grade !== null).map((s) => s.grade!);
  const averageGrade = grades.length > 0
    ? Math.round((grades.reduce((sum, g) => sum + g, 0) / grades.length) * 100) / 100
    : 0;

  return {
    assignmentId,
    totalEnrolled,
    totalSubmissions: submissions.length,
    submitted,
    missing,
    late,
    pendingGrading,
    graded,
    drafts,
    submissionRate: totalEnrolled > 0 ? Math.round((submitted / totalEnrolled) * 10000) / 100 : 0,
    averageGrade,
    dueDate: assignment.dueDate,
  };
}
