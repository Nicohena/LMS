// src/modules/courses/self-service.service.ts
import { prisma } from '../../lib/prisma';
import { NotFoundError, ForbiddenError, ValidationError } from '../../common/errors';
import type { Role } from '@prisma/client';

// ---------------------------------------------------------------------------
// Teacher Permission helpers
// ---------------------------------------------------------------------------

export async function getOrCreateTeacherPermission(userId: string) {
  let perm = await prisma.teacherPermission.findUnique({ where: { userId } });
  if (!perm) {
    perm = await prisma.teacherPermission.create({
      data: { userId, autoPublish: true, maxCourseSlots: 10, canEnrollStudents: true },
    });
  }
  return perm;
}

export async function checkCourseSlotLimit(userId: string): Promise<void> {
  const perm = await getOrCreateTeacherPermission(userId);
  const activeCourses = await prisma.course.count({
    where: { createdBy: userId, status: { not: 'ARCHIVED' } },
  });
  if (activeCourses >= perm.maxCourseSlots) {
    throw new ValidationError(`Course limit reached (${perm.maxCourseSlots}). Archive a course or contact an admin to increase your limit.`);
  }
}

// ---------------------------------------------------------------------------
// Publish / Archive / Override
// ---------------------------------------------------------------------------

export async function publishCourse(courseId: string, userId: string, role: Role) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new NotFoundError('Course not found');

  // Only the course owner (teacher) or admin can publish
  if (role !== 'ADMIN' && course.createdBy !== userId) {
    throw new ForbiddenError('You can only publish your own courses.');
  }

  // Check teacher permission for auto-publish
  if (role === 'TEACHER') {
    const perm = await getOrCreateTeacherPermission(userId);
    if (!perm.autoPublish) {
      throw new ForbiddenError('Auto-publish is disabled for your account. Contact an admin.');
    }
  }

  const updated = await prisma.course.update({
    where: { id: courseId },
    data: { status: 'PUBLISHED' },
  });

  // Calculate quality score asynchronously (fire-and-forget)
  calculateQualityScore(courseId).catch(() => {});

  return { message: 'Course published successfully.', course: updated };
}

export async function archiveCourse(courseId: string, userId: string, role: Role) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new NotFoundError('Course not found');

  // Only the course owner (teacher) or admin can archive
  if (role !== 'ADMIN' && course.createdBy !== userId) {
    throw new ForbiddenError('You can only archive your own courses.');
  }

  const updated = await prisma.course.update({
    where: { id: courseId },
    data: { status: 'ARCHIVED' },
  });

  return { message: 'Course archived successfully.', course: updated };
}

export async function overrideCourse(courseId: string, userId: string, role: Role, data: {
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdBy?: string; // reassign to another teacher
}) {
  if (role !== 'ADMIN') {
    throw new ForbiddenError('Only administrators can override course settings.');
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new NotFoundError('Course not found');

  const updateData: any = {};
  if (data.status) updateData.status = data.status;
  if (data.createdBy) updateData.createdBy = data.createdBy;

  const updated = await prisma.course.update({
    where: { id: courseId },
    data: updateData,
  });

  return { message: 'Course settings overridden.', course: updated };
}

// ---------------------------------------------------------------------------
// Quality Score Calculation
// ---------------------------------------------------------------------------

export async function calculateQualityScore(courseId: string): Promise<number> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: { include: { contents: true } },
    },
  });
  if (!course) return 0;

  let score = 0;
  const maxScore = 100;

  // Has description: +10
  if (course.description && course.description.trim().length > 50) score += 10;

  // Has category: +5
  if (course.category) score += 5;

  // Has thumbnail: +5
  if (course.thumbnail) score += 5;

  // Has at least 1 module: +15
  if (course.modules.length > 0) score += 15;

  // Has at least 3 modules: +10
  if (course.modules.length >= 3) score += 10;

  // Has at least 5 content items: +15
  const totalContent = course.modules.reduce((acc, m) => acc + m.contents.length, 0);
  if (totalContent >= 5) score += 15;
  else if (totalContent >= 1) score += 5;

  // Has at least 1 quiz or assignment: +15
  const hasAssessment = course.modules.some(m =>
    m.contents.some(c => c.type === 'QUIZ' || c.type === 'ASSIGNMENT')
  );
  if (hasAssessment) score += 15;

  // Has duration set: +5
  if (course.duration) score += 5;

  // Has tags: +5
  if (course.tags.length > 0) score += 5;

  // Published status: +10
  if (course.status === 'PUBLISHED') score += 10;

  score = Math.min(score, maxScore);

  // Update the teacher's quality score
  await prisma.teacherPermission.updateMany({
    where: { userId: course.createdBy },
    data: { qualityScore: score },
  }).catch(() => {});

  // eslint-disable-next-line no-console
  console.log(`[quality] Course ${courseId} quality score: ${score}/${maxScore}`);
  return score;
}

// ---------------------------------------------------------------------------
// Self-Enrollment (students enroll themselves)
// ---------------------------------------------------------------------------

export async function selfEnroll(courseId: string, userId: string) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new NotFoundError('Course not found');
  if (course.status !== 'PUBLISHED') {
    throw new ValidationError('Cannot enroll in a course that is not published.');
  }

  // Check if already enrolled
  const existing = await prisma.enrollment.findFirst({
    where: { userId, courseId, status: { in: ['ACTIVE', 'COMPLETED'] } },
  });
  if (existing) {
    throw new ValidationError('You are already enrolled in this course.');
  }

  const enrollment = await prisma.enrollment.create({
    data: {
      userId,
      courseId,
      status: 'ACTIVE',
      progressPercentage: 0,
    },
  });

  // eslint-disable-next-line no-console
  console.log(`[enrollment] Self-enrollment: user ${userId} → course ${courseId}`);

  return { message: 'Enrollment successful.', enrollment };
}
