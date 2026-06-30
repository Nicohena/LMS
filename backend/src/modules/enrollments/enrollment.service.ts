// src/modules/enrollments/enrollment.service.ts
import { Prisma, Role } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError, ForbiddenError, ConflictError, ValidationError } from '../../common/errors';
import { cacheDelete, cacheDeleteByPrefix, cacheGet, cacheSet } from '../../common/services/cache.service';
import { enqueue } from '../../common/services/queue.service';
import { logAction } from '../../common/services/audit.service';
import { gamificationEvents } from '../gamification/event-listener.service';
import {
  recalculateOverallProgress,
  getNextContentId,
} from './progress-calculator.service';
import type {
  AtRiskStudent,
  BulkEnrollResult,
  EnrollmentDetailResponse,
  EnrollmentFilters,
  EnrollmentListResponse,
  EnrollmentResponse,
  EnrolledCourseStat,
  ProgressResponse,
  StudentDashboardResponse,
  TeacherDashboardResponse,
} from './enrollment.types';
import { CACHE_KEYS, CACHE_TTL } from './enrollment.types';
import type { ProgressUpdateInput } from './enrollment.schemas';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

function assertValidObjectId(id: string, what = 'Resource'): void {
  if (!OBJECT_ID_RE.test(id)) {
    throw new NotFoundError(`${what} not found`);
  }
}

function toUserSummary(u: { id: string; email: string; firstName: string; lastName: string; role: Role }) {
  return { id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName, role: u.role };
}

function toCourseSummary(c: { id: string; title: string; thumbnail: string | null; category: string | null; difficulty: any }) {
  return { id: c.id, title: c.title, thumbnail: c.thumbnail, category: c.category, difficulty: c.difficulty };
}

function toEnrollmentResponse(
  e: any,
): EnrollmentResponse {
  return {
    ...e,
    user: toUserSummary(e.user),
    course: toCourseSummary(e.course),
  };
}

/**
 * Ensure the viewer can manage enrollments for the given course:
 * - ADMIN: always
 * - TEACHER: only their own courses
 * - otherwise: ForbiddenError
 */
async function assertCanManageCourse(courseId: string, viewer: { id: string; role: Role }): Promise<void> {
  assertValidObjectId(courseId, 'Course');
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, createdBy: true, status: true },
  });
  if (!course) {
    throw new NotFoundError('Course not found');
  }
  if (viewer.role === 'ADMIN') return;
  if (viewer.role === 'TEACHER' && course.createdBy === viewer.id) return;
  throw new ForbiddenError('You can only manage enrollments for courses you own');
}

// ---------------------------------------------------------------------------
// Enrollment CRUD
// ---------------------------------------------------------------------------

export async function enrollUser(
  userId: string,
  courseId: string,
  enrollerId: string,
  enrollerRole: Role,
): Promise<EnrollmentResponse> {
  assertValidObjectId(userId, 'User');
  assertValidObjectId(courseId, 'Course');

  // Permission: admin or course owner
  await assertCanManageCourse(courseId, { id: enrollerId, role: enrollerRole });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, isActive: true, role: true } });
  if (!user) throw new NotFoundError('User not found');
  if (!user.isActive) throw new ValidationError('Cannot enroll an inactive user');

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, status: true },
  });
  if (!course) throw new NotFoundError('Course not found');
  if (course.status !== 'PUBLISHED') {
    throw new ValidationError('Can only enroll in PUBLISHED courses');
  }

  // Check for existing enrollment (unique constraint on [userId, courseId])
  const existing = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (existing && existing.status === 'ACTIVE') {
    throw new ConflictError('User is already actively enrolled in this course');
  }
  if (existing && existing.status === 'COMPLETED') {
    throw new ConflictError('User has already completed this course');
  }
  // If DROPPED, re-enroll (reactivate)
  if (existing && existing.status === 'DROPPED') {
    const updated = await prisma.enrollment.update({
      where: { id: existing.id },
      data: {
        status: 'ACTIVE',
        droppedAt: null,
        progressPercentage: existing.progressPercentage,
        lastAccessedAt: new Date(),
      },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true, role: true } }, course: { select: { id: true, title: true, thumbnail: true, category: true, difficulty: true } } },
    });
    return toEnrollmentResponse(updated);
  }

  const enrollment = await prisma.enrollment.create({
    data: { userId, courseId, status: 'ACTIVE' },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
      course: { select: { id: true, title: true, thumbnail: true, category: true, difficulty: true } },
    },
  });

  // Invalidate caches
  await cacheDelete(CACHE_KEYS.studentDashboard(userId));
  await cacheDeleteByPrefix('teacher:dashboard:');

  return toEnrollmentResponse(enrollment);
}

export async function bulkEnroll(
  courseId: string,
  userIds: string[],
  enrollerId: string,
  enrollerRole: Role,
): Promise<BulkEnrollResult> {
  assertValidObjectId(courseId, 'Course');
  await assertCanManageCourse(courseId, { id: enrollerId, role: enrollerRole });

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, status: true },
  });
  if (!course) throw new NotFoundError('Course not found');
  if (course.status !== 'PUBLISHED') {
    throw new ValidationError('Can only enroll in PUBLISHED courses');
  }

  const result: BulkEnrollResult = {
    total: userIds.length,
    enrolled: 0,
    failed: 0,
    errors: [],
  };

  if (userIds.length === 0) return result;

  // Validate all userIds are ObjectIds
  for (const uid of userIds) {
    if (!OBJECT_ID_RE.test(uid)) {
      result.failed += 1;
      result.errors.push({ userId: uid, reason: 'Invalid userId format' });
    }
  }
  const validIds = userIds.filter((id) => OBJECT_ID_RE.test(id));
  if (validIds.length === 0) return result;

  // Fetch all users in one query
  const users = await prisma.user.findMany({
    where: { id: { in: validIds } },
    select: { id: true, isActive: true, role: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  // Fetch existing enrollments in one query
  const existing = await prisma.enrollment.findMany({
    where: { courseId, userId: { in: validIds } },
    select: { userId: true, status: true, id: true },
  });
  const existingMap = new Map(existing.map((e) => [e.userId, e]));

  const toCreate: Prisma.EnrollmentCreateManyInput[] = [];
  const toReactivate: string[] = []; // enrollment IDs

  for (const uid of validIds) {
    const user = userMap.get(uid);
    if (!user) {
      result.failed += 1;
      result.errors.push({ userId: uid, reason: 'User not found' });
      continue;
    }
    if (!user.isActive) {
      result.failed += 1;
      result.errors.push({ userId: uid, reason: 'User is inactive' });
      continue;
    }
    const ex = existingMap.get(uid);
    if (ex) {
      if (ex.status === 'ACTIVE' || ex.status === 'COMPLETED') {
        result.failed += 1;
        result.errors.push({ userId: uid, reason: `Already ${ex.status.toLowerCase()}` });
        continue;
      }
      // DROPPED — reactivate
      toReactivate.push(ex.id);
      continue;
    }
    toCreate.push({ userId: uid, courseId, status: 'ACTIVE' });
  }

  // Batch insert + update
  if (toCreate.length > 0) {
    try {
      const insertResult = await prisma.enrollment.createMany({ data: toCreate });
      result.enrolled += insertResult.count;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[enrollments] Bulk insert failed:', err);
      result.failed += toCreate.length;
      result.errors.push({ reason: `Batch insert failed: ${(err as Error).message}` });
    }
  }
  for (const eid of toReactivate) {
    try {
      await prisma.enrollment.update({
        where: { id: eid },
        data: { status: 'ACTIVE', droppedAt: null, lastAccessedAt: new Date() },
      });
      result.enrolled += 1;
    } catch (err) {
      result.failed += 1;
      result.errors.push({ reason: `Reactivation failed for enrollment ${eid}` });
    }
  }

  // Invalidate caches
  await cacheDeleteByPrefix('student:dashboard:');
  await cacheDeleteByPrefix('teacher:dashboard:');

  // Queue background job to initialize progress for new enrollments (optional,
  // since we lazy-init progress on first access — but doing it now is fine
  // for small courses; for large courses, the queue is the right approach).
  await enqueue('enrollmentQueue', { type: 'bulkEnrollComplete', courseId, count: result.enrolled });

  // eslint-disable-next-line no-console
  console.log(`[enrollments] Bulk enroll: ${result.enrolled} enrolled, ${result.failed} failed (of ${result.total} users)`);

  return result;
}

export async function cancelEnrollment(
  enrollmentId: string,
  reason: string | undefined,
  viewer: { id: string; role: Role },
): Promise<{ id: string; status: string }> {
  assertValidObjectId(enrollmentId, 'Enrollment');
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: { id: true, userId: true, courseId: true, status: true, course: { select: { createdBy: true } } },
  });
  if (!enrollment) throw new NotFoundError('Enrollment not found');

  // Permission: admin, course owner, OR the student themselves
  const isOwner = enrollment.userId === viewer.id;
  const isCourseOwner = enrollment.course.createdBy === viewer.id;
  if (viewer.role !== 'ADMIN' && !isOwner && !isCourseOwner) {
    throw new ForbiddenError('You can only cancel your own enrollments or those for courses you own');
  }

  if (enrollment.status === 'DROPPED') {
    return { id: enrollment.id, status: 'DROPPED' };
  }

  const updated = await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { status: 'DROPPED', droppedAt: new Date() },
    select: { id: true, status: true },
  });

  // Invalidate caches
  await cacheDelete(CACHE_KEYS.studentDashboard(enrollment.userId));
  await cacheDeleteByPrefix('teacher:dashboard:');

  return updated;
}

export async function getEnrollments(
  filters: EnrollmentFilters,
  viewer: { id: string; role: Role },
): Promise<EnrollmentListResponse> {
  const where: Prisma.EnrollmentWhereInput = {};

  // Role-based scoping
  if (viewer.role === 'STUDENT') {
    where.userId = viewer.id;
  } else if (viewer.role === 'TEACHER') {
    // Only enrollments for courses they created
    where.course = { createdBy: viewer.id };
  }
  // ADMIN: no scoping

  if (filters.status) where.status = filters.status;
  if (filters.courseId) where.courseId = filters.courseId;
  if (filters.userId) where.userId = filters.userId;
  if (filters.search) {
    const s = filters.search;
    where.OR = [
      { user: { email: { contains: s, mode: 'insensitive' } } },
      { user: { firstName: { contains: s, mode: 'insensitive' } } },
      { user: { lastName: { contains: s, mode: 'insensitive' } } },
      { course: { title: { contains: s, mode: 'insensitive' } } },
    ];
  }

  const skip = (filters.page - 1) * filters.limit;
  const take = filters.limit;

  const [rows, total] = await Promise.all([
    prisma.enrollment.findMany({
      where,
      skip,
      take,
      orderBy: { [filters.sortBy]: filters.sortOrder },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
        course: { select: { id: true, title: true, thumbnail: true, category: true, difficulty: true } },
      },
    }),
    prisma.enrollment.count({ where }),
  ]);

  return {
    data: rows.map(toEnrollmentResponse),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  };
}

export async function getEnrollment(
  enrollmentId: string,
  viewer: { id: string; role: Role },
): Promise<EnrollmentDetailResponse> {
  assertValidObjectId(enrollmentId, 'Enrollment');
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
      course: { select: { id: true, title: true, thumbnail: true, category: true, difficulty: true, createdBy: true } },
      progress: {
        include: {
          content: { select: { id: true, title: true, type: true, moduleId: true, order: true } },
        },
      },
    },
  });
  if (!enrollment) throw new NotFoundError('Enrollment not found');

  // Permission: admin, course owner, OR the student themselves
  const isStudent = enrollment.userId === viewer.id;
  const isCourseOwner = enrollment.course.createdBy === viewer.id;
  if (viewer.role !== 'ADMIN' && !isStudent && !isCourseOwner) {
    throw new ForbiddenError('You can only view your own enrollments or those for courses you own');
  }

  return toEnrollmentResponse(enrollment) as EnrollmentDetailResponse;
}

// ---------------------------------------------------------------------------
// Progress updates
// ---------------------------------------------------------------------------

export async function updateProgress(
  enrollmentId: string,
  data: ProgressUpdateInput,
  viewer: { id: string; role: Role },
): Promise<{ progress: ProgressResponse; enrollment: { id: string; progressPercentage: number; status: string } }> {
  assertValidObjectId(enrollmentId, 'Enrollment');
  assertValidObjectId(data.contentId, 'Content');

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: { id: true, userId: true, courseId: true, status: true },
  });
  if (!enrollment) throw new NotFoundError('Enrollment not found');

  // Only the enrolled student can update their own progress (admins/teachers
  // don't need to push progress).
  if (enrollment.userId !== viewer.id) {
    throw new ForbiddenError('You can only update progress for your own enrollments');
  }
  if (enrollment.status === 'DROPPED') {
    throw new ValidationError('Cannot update progress on a dropped enrollment');
  }

  // Verify the content belongs to the enrolled course
  const content = await prisma.content.findUnique({
    where: { id: data.contentId },
    select: { id: true, module: { select: { courseId: true } } },
  });
  if (!content) throw new NotFoundError('Content not found');
  if (content.module.courseId !== enrollment.courseId) {
    throw new ValidationError('Content does not belong to the enrolled course');
  }

  // Auto-calculate status if not provided
  let status = data.status;
  if (!status) {
    if (data.progressPercent >= 100) status = 'COMPLETED';
    else if (data.progressPercent > 0) status = 'IN_PROGRESS';
    else status = 'NOT_STARTED';
  }

  // Upsert progress record (idempotent — no double-counting of timeSpent).
  // We use a "max" approach for progressPercent and accumulate timeSpent only
  // for the delta since last update. For simplicity here, we just take max
  // for progressPercent and set timeSpent to max(existing, new).
  const existing = await prisma.progress.findUnique({
    where: {
      enrollmentId_contentId: { enrollmentId, contentId: data.contentId },
    },
  });

  let progress: ProgressResponse;
  if (existing) {
    // Idempotent: don't go backwards on progressPercent.
    const newPercent = Math.max(existing.progressPercent, data.progressPercent);
    const newTimeSpent = Math.max(existing.timeSpent, data.timeSpent);
    // If already COMPLETED, stay COMPLETED.
    const newStatus = existing.status === 'COMPLETED' ? 'COMPLETED' : status;
    progress = await prisma.progress.update({
      where: { id: existing.id },
      data: {
        progressPercent: newPercent,
        timeSpent: newTimeSpent,
        status: newStatus,
        lastAccessedAt: new Date(),
        completedAt: newStatus === 'COMPLETED' && !existing.completedAt ? new Date() : existing.completedAt,
      },
    });
  } else {
    progress = await prisma.progress.create({
      data: {
        enrollmentId,
        contentId: data.contentId,
        progressPercent: data.progressPercent,
        timeSpent: data.timeSpent,
        status,
        completedAt: status === 'COMPLETED' ? new Date() : null,
      },
    });
  }

  // Update enrollment's lastAccessedAt
  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { lastAccessedAt: new Date() },
  });

  // Recalculate overall progress (also handles COMPLETED transition)
  const updatedEnrollment = await recalculateOverallProgress(enrollmentId);

  // Emit course.completed event if the enrollment just transitioned to COMPLETED
  if (updatedEnrollment.status === 'COMPLETED') {
    // Fetch enrollment details for the event
    const enrollmentDetails = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: { userId: true, courseId: true },
    }).catch(() => null);

    if (enrollmentDetails) {
      const course = await prisma.course.findUnique({
        where: { id: enrollmentDetails.courseId },
        select: { title: true },
      }).catch(() => null);

      gamificationEvents.emit('course.completed', {
        userId: enrollmentDetails.userId,
        courseId: enrollmentDetails.courseId,
        courseTitle: course?.title,
      });
      // eslint-disable-next-line no-console
      console.log(`[enrollment] Course completed: user=${enrollmentDetails.userId}, course=${enrollmentDetails.courseId}`);
    }
  }

  // Invalidate caches
  await cacheDelete(CACHE_KEYS.studentDashboard(enrollment.userId));
  await cacheDelete(CACHE_KEYS.enrollmentProgress(enrollmentId));

  // Queue a job for any side-effects (notifications, etc.)
  await enqueue('progressQueue', {
    type: 'progressUpdated',
    enrollmentId,
    contentId: data.contentId,
    progressPercent: data.progressPercent,
    overallProgress: updatedEnrollment.progressPercentage,
    isCompleted: updatedEnrollment.status === 'COMPLETED',
  });

  return {
    progress,
    enrollment: {
      id: updatedEnrollment.id,
      progressPercentage: updatedEnrollment.progressPercentage,
      status: updatedEnrollment.status,
    },
  };
}

// ---------------------------------------------------------------------------
// Dashboards
// ---------------------------------------------------------------------------

export async function getStudentDashboard(userId: string): Promise<StudentDashboardResponse> {
  // Try cache first
  const cached = await cacheGet<StudentDashboardResponse>(CACHE_KEYS.studentDashboard(userId));
  if (cached) return cached;

  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    include: {
      course: { select: { id: true, title: true, thumbnail: true, category: true, difficulty: true } },
    },
    orderBy: { lastAccessedAt: 'desc' },
  });

  const stats = {
    totalEnrollments: enrollments.length,
    active: enrollments.filter((e) => e.status === 'ACTIVE').length,
    completed: enrollments.filter((e) => e.status === 'COMPLETED').length,
    dropped: enrollments.filter((e) => e.status === 'DROPPED').length,
    averageProgress:
      enrollments.length === 0
        ? 0
        : Math.round(
            (enrollments.reduce((sum, e) => sum + e.progressPercentage, 0) / enrollments.length) * 100,
          ) / 100,
  };

  // Build course list with next content IDs (in parallel for speed)
  const courses: EnrolledCourseStat[] = [];
  for (const e of enrollments) {
    if (e.status === 'DROPPED') continue;
    const nextContentId = await getNextContentId(e.id).catch(() => null);
    courses.push({
      enrollmentId: e.id,
      course: {
        id: e.course.id,
        title: e.course.title,
        thumbnail: e.course.thumbnail,
        category: e.course.category,
        difficulty: e.course.difficulty,
      },
      status: e.status,
      progressPercentage: e.progressPercentage,
      lastAccessedAt: e.lastAccessedAt,
      enrolledAt: e.enrolledAt,
      nextContentId,
    });
  }

  // Recent activity: last 7 days of progress updates
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentProgress = await prisma.progress.findMany({
    where: {
      enrollment: { userId },
      lastAccessedAt: { gte: sevenDaysAgo },
    },
    orderBy: { lastAccessedAt: 'desc' },
    take: 20,
    include: {
      content: { select: { id: true, title: true, module: { select: { course: { select: { title: true } } } } } },
    },
  });

  const recentActivity = recentProgress.map((p) => ({
    contentId: p.contentId,
    contentTitle: p.content.title,
    courseTitle: p.content.module.course.title,
    status: p.status,
    progressPercent: p.progressPercent,
    lastAccessedAt: p.lastAccessedAt,
  }));

  const response: StudentDashboardResponse = { stats, courses, recentActivity };

  // Cache it
  await cacheSet(CACHE_KEYS.studentDashboard(userId), response, CACHE_TTL.studentDashboard);

  return response;
}

export async function getTeacherDashboard(teacherId: string): Promise<TeacherDashboardResponse> {
  // Try cache first
  const cached = await cacheGet<TeacherDashboardResponse>(CACHE_KEYS.teacherDashboard(teacherId));
  if (cached) return cached;

  // Fetch all courses created by this teacher
  const courses = await prisma.course.findMany({
    where: { createdBy: teacherId },
    select: { id: true, title: true },
  });

  if (courses.length === 0) {
    const empty: TeacherDashboardResponse = {
      totalCourses: 0,
      totalEnrollments: 0,
      averageCompletionRate: 0,
      courses: [],
      atRiskStudents: [],
    };
    await cacheSet(CACHE_KEYS.teacherDashboard(teacherId), empty, CACHE_TTL.teacherDashboard);
    return empty;
  }

  const courseIds = courses.map((c) => c.id);

  // Fetch all enrollments for these courses
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: { in: courseIds } },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
      course: { select: { id: true, title: true } },
    },
  });

  // Per-course stats
  const courseStats = courses.map((course) => {
    const courseEnrollments = enrollments.filter((e) => e.courseId === course.id);
    const active = courseEnrollments.filter((e) => e.status === 'ACTIVE');
    const completed = courseEnrollments.filter((e) => e.status === 'COMPLETED');
    const avgProgress =
      active.length === 0
        ? 0
        : Math.round(
            (active.reduce((sum, e) => sum + e.progressPercentage, 0) / active.length) * 100,
          ) / 100;
    // At-risk: active, enrolled >14 days ago, progress < 30%
    const atRisk = active.filter((e) => {
      const daysSince = (Date.now() - e.enrolledAt.getTime()) / (24 * 60 * 60 * 1000);
      return daysSince > 14 && e.progressPercentage < 30;
    });
    return {
      courseId: course.id,
      courseTitle: course.title,
      enrolledCount: courseEnrollments.length,
      completedCount: completed.length,
      averageProgress: avgProgress,
      atRiskCount: atRisk.length,
    };
  });

  // All at-risk students across courses
  const atRiskStudents: AtRiskStudent[] = [];
  for (const e of enrollments) {
    if (e.status !== 'ACTIVE') continue;
    const daysSince = (Date.now() - e.enrolledAt.getTime()) / (24 * 60 * 60 * 1000);
    if (daysSince > 14 && e.progressPercentage < 30) {
      atRiskStudents.push({
        userId: e.user.id,
        email: e.user.email,
        firstName: e.user.firstName,
        lastName: e.user.lastName,
        courseId: e.courseId,
        courseTitle: e.course.title,
        progressPercentage: e.progressPercentage,
        enrolledAt: e.enrolledAt,
        daysSinceEnrollment: Math.floor(daysSince),
      });
    }
  }

  const averageCompletionRate =
    courses.length === 0
      ? 0
      : Math.round(
          (courseStats.reduce((sum, c) => sum + (c.enrolledCount > 0 ? (c.completedCount / c.enrolledCount) * 100 : 0), 0) /
            courses.length) *
            100,
        ) / 100;

  const response: TeacherDashboardResponse = {
    totalCourses: courses.length,
    totalEnrollments: enrollments.length,
    averageCompletionRate,
    courses: courseStats,
    atRiskStudents,
  };

  await cacheSet(CACHE_KEYS.teacherDashboard(teacherId), response, CACHE_TTL.teacherDashboard);

  return response;
}

export async function getNextContentForEnrollment(
  enrollmentId: string,
  viewer: { id: string; role: Role },
): Promise<{ contentId: string | null }> {
  assertValidObjectId(enrollmentId, 'Enrollment');
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: { id: true, userId: true },
  });
  if (!enrollment) throw new NotFoundError('Enrollment not found');
  if (enrollment.userId !== viewer.id && viewer.role !== 'ADMIN') {
    throw new ForbiddenError('You can only view next content for your own enrollments');
  }
  const contentId = await getNextContentId(enrollmentId);
  return { contentId };
}
