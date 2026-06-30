// src/modules/courses/quality-monitoring.service.ts
import { prisma } from '../../lib/prisma';
import { NotFoundError, ForbiddenError } from '../../common/errors';

// Quality thresholds
const QUALITY_THRESHOLD = 40; // Courses below this are flagged
const FLAGS = {
  NO_DESCRIPTION: 'NO_DESCRIPTION',
  NO_MODULES: 'NO_MODULES',
  FEW_MODULES: 'FEW_MODULES',
  NO_CONTENT: 'NO_CONTENT',
  NO_QUIZZES: 'NO_QUIZZES',
  NO_ASSIGNMENTS: 'NO_ASSIGNMENTS',
  NO_THUMBNAIL: 'NO_THUMBNAIL',
  LOW_COMPLETION: 'LOW_COMPLETION',
  LOW_QUALITY: 'LOW_QUALITY',
};

// ---------------------------------------------------------------------------
// Calculate course quality score (enhanced version)
// ---------------------------------------------------------------------------

export async function calculateCourseQuality(courseId: string): Promise<{ score: number; flags: string[] }> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: { include: { contents: true } },
      enrollments: { select: { id: true, status: true, progressPercentage: true } },
      certificates: { select: { id: true } },
    },
  });
  if (!course) return { score: 0, flags: [] };

  let score = 0;
  const flags: string[] = [];
  const maxScore = 100;

  // 1. Description quality (15 pts)
  if (course.description && course.description.trim().length > 50) score += 15;
  else if (course.description && course.description.trim().length > 0) score += 5;
  else flags.push(FLAGS.NO_DESCRIPTION);

  // 2. Thumbnail (5 pts)
  if (course.thumbnail) score += 5;
  else flags.push(FLAGS.NO_THUMBNAIL);

  // 3. Category + tags (5 pts)
  if (course.category) score += 3;
  if (course.tags.length > 0) score += 2;

  // 4. Modules (20 pts)
  if (course.modules.length === 0) {
    flags.push(FLAGS.NO_MODULES);
  } else {
    score += 10;
    if (course.modules.length >= 3) score += 10;
    else flags.push(FLAGS.FEW_MODULES);
  }

  // 5. Content items (15 pts)
  const totalContent = course.modules.reduce((acc, m) => acc + m.contents.length, 0);
  if (totalContent === 0) {
    flags.push(FLAGS.NO_CONTENT);
  } else {
    score += 5;
    if (totalContent >= 5) score += 10;
  }

  // 6. Quiz presence (10 pts)
  const hasQuiz = course.modules.some(m => m.contents.some(c => c.type === 'QUIZ'));
  if (hasQuiz) score += 10;
  else flags.push(FLAGS.NO_QUIZZES);

  // 7. Assignment presence (10 pts)
  const hasAssignment = course.modules.some(m => m.contents.some(c => c.type === 'ASSIGNMENT'));
  if (hasAssignment) score += 10;
  else flags.push(FLAGS.NO_ASSIGNMENTS);

  // 8. Certificate availability (5 pts)
  if (course.certificates.length > 0) score += 5;

  // 9. Completion rate (15 pts)
  const totalEnrollments = course.enrollments.length;
  if (totalEnrollments > 0) {
    const completed = course.enrollments.filter(e => e.status === 'COMPLETED').length;
    const completionRate = (completed / totalEnrollments) * 100;
    if (completionRate >= 50) score += 15;
    else if (completionRate >= 25) score += 10;
    else if (completionRate >= 10) score += 5;
    else flags.push(FLAGS.LOW_COMPLETION);
  }

  score = Math.min(score, maxScore);
  if (score < QUALITY_THRESHOLD) flags.push(FLAGS.LOW_QUALITY);

  // Update course
  await prisma.course.update({
    where: { id: courseId },
    data: { qualityScore: score, qualityFlags: flags },
  });

  // Update teacher's performance score (average of all their courses)
  await updateTeacherPerformance(course.createdBy);

  // eslint-disable-next-line no-console
  console.log(`[quality] Course ${courseId}: score=${score}/${maxScore}, flags=${flags.join(',')}`);
  return { score, flags };
}

// ---------------------------------------------------------------------------
// Update teacher performance score
// ---------------------------------------------------------------------------

async function updateTeacherPerformance(teacherId: string) {
  const courses = await prisma.course.findMany({
    where: { createdBy: teacherId, status: 'PUBLISHED' },
    select: { qualityScore: true },
  });
  if (courses.length === 0) return;

  const avgScore = courses.reduce((sum, c) => sum + (c.qualityScore ?? 0), 0) / courses.length;
  await prisma.teacherPermission.upsert({
    where: { userId: teacherId },
    update: { qualityScore: avgScore },
    create: { userId: teacherId, qualityScore: avgScore },
  }).catch(() => {});
  // eslint-disable-next-line no-console
  console.log(`[quality] Teacher ${teacherId} performance: ${avgScore.toFixed(1)}`);
}

// ---------------------------------------------------------------------------
// Get course quality report (admin)
// ---------------------------------------------------------------------------

export async function getCourseQualityReport(filters?: { minScore?: number; maxScore?: number; flagged?: boolean }) {
  const where: any = {};
  if (filters?.flagged) where.qualityFlags = { isEmpty: false };

  const courses = await prisma.course.findMany({
    where,
    select: {
      id: true,
      title: true,
      status: true,
      qualityScore: true,
      qualityFlags: true,
      createdBy: true,
      createdAt: true,
      enrollments: { select: { id: true, status: true } },
    },
    orderBy: { qualityScore: 'asc' },
  });

  // Enrich with teacher info
  const enriched = await Promise.all(courses.map(async (c) => {
    const teacher = await prisma.user.findUnique({
      where: { id: c.createdBy },
      select: { id: true, firstName: true, lastName: true },
    }).catch(() => null);
    const teacherPerm = await prisma.teacherPermission.findUnique({
      where: { userId: c.createdBy },
      select: { qualityScore: true },
    }).catch(() => null);
    return {
      ...c,
      teacher,
      teacherPerformanceScore: teacherPerm?.qualityScore ?? 0,
      enrollmentCount: c.enrollments.length,
      completedCount: c.enrollments.filter(e => e.status === 'COMPLETED').length,
    };
  }));

  // Filter by score range
  const filtered = enriched.filter(c => {
    if (filters?.minScore !== undefined && (c.qualityScore ?? 0) < filters.minScore) return false;
    if (filters?.maxScore !== undefined && (c.qualityScore ?? 0) > filters.maxScore) return false;
    return true;
  });

  return { data: filtered, total: filtered.length };
}

// ---------------------------------------------------------------------------
// Flag / unflag course (admin)
// ---------------------------------------------------------------------------

export async function flagCourse(courseId: string, flag: string, adminId: string) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new NotFoundError('Course not found');

  const currentFlags = course.qualityFlags || [];
  if (!currentFlags.includes(flag)) {
    currentFlags.push(flag);
  }

  const updated = await prisma.course.update({
    where: { id: courseId },
    data: { qualityFlags: currentFlags },
  });

  // Notify teacher
  try {
    const teacher = await prisma.user.findUnique({ where: { id: course.createdBy }, select: { email: true, firstName: true } });
    if (teacher) {
      const { sendEmail } = await import('../notifications/email.service');
      await sendEmail({
        to: teacher.email,
        subject: `Course Quality Flag: ${course.title}`,
        template: 'generic',
        data: {
          title: 'Course Quality Flag',
          content: `Hi ${teacher.firstName}, your course "${course.title}" has been flagged for: ${flag}. Please review and improve the course quality.`,
          link: `${process.env.CLIENT_URL || 'http://localhost:3000'}/catalog`,
        },
      });
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[quality] Failed to notify teacher:', (err as Error).message);
  }

  return { message: 'Course flagged.', course: updated };
}

export async function unflagCourse(courseId: string, flag: string) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new NotFoundError('Course not found');

  const currentFlags = (course.qualityFlags || []).filter(f => f !== flag);

  const updated = await prisma.course.update({
    where: { id: courseId },
    data: { qualityFlags: currentFlags },
  });

  return { message: 'Flag removed.', course: updated };
}

// ---------------------------------------------------------------------------
// Recalculate all courses (bulk background job)
// ---------------------------------------------------------------------------

export async function recalculateAllCourseQuality() {
  const courses = await prisma.course.findMany({
    where: { status: { in: ['PUBLISHED', 'DRAFT'] } },
    select: { id: true },
  });

  let processed = 0;
  let flagged = 0;

  for (const course of courses) {
    const result = await calculateCourseQuality(course.id).catch(() => null);
    if (result) {
      processed++;
      if (result.flags.includes(FLAGS.LOW_QUALITY)) flagged++;
    }
  }

  // eslint-disable-next-line no-console
  console.log(`[quality] Bulk recalculation: ${processed} courses processed, ${flagged} flagged`);
  return { processed, flagged };
}
