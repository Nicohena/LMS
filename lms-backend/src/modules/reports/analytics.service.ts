// src/modules/reports/analytics.service.ts
import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../common/errors';
import { cacheGet, cacheSet, cacheDelete } from '../../common/services/cache.service';
import type {
  CourseAnalyticsStats,
  PlatformDashboardStats,
  StudentDashboardStats,
  TeacherDashboardStats,
} from './report.types';

const CACHE_TTL = 5 * 60; // 5 minutes
const PLATFORM_CACHE_KEY = 'dashboard:platform';
const TEACHER_CACHE_PREFIX = 'dashboard:teacher:';
const STUDENT_CACHE_PREFIX = 'dashboard:student:';
const COURSE_CACHE_PREFIX = 'dashboard:course:';

// ---------------------------------------------------------------------------
// Platform dashboard (admin only)
// ---------------------------------------------------------------------------

export async function getPlatformStats(): Promise<PlatformDashboardStats> {
  const cached = await cacheGet<PlatformDashboardStats>(PLATFORM_CACHE_KEY);
  if (cached) return cached;

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    users, students, teachers, admins, activeUsers, newThisWeek, newThisMonth,
    dailyActive, weeklyActive, monthlyActive,
    courses, publishedCourses, draftCourses, archivedCourses,
    enrollments, activeEnrollments, completedEnrollments, droppedEnrollments, newEnrollmentsThisWeek,
    modules, contents, quizzes, assignments,
    quizAttempts, assignmentSubmissions, certificatesIssued,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.user.count({ where: { role: 'TEACHER' } }),
    prisma.user.count({ where: { role: 'ADMIN' } }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
    // DAU: users with lastLogin in last 24h (approximate — uses lastLogin)
    prisma.user.count({ where: { lastLogin: { gte: dayAgo } } }),
    prisma.user.count({ where: { lastLogin: { gte: weekAgo } } }),
    prisma.user.count({ where: { lastLogin: { gte: monthAgo } } }),
    prisma.course.count(),
    prisma.course.count({ where: { status: 'PUBLISHED' } }),
    prisma.course.count({ where: { status: 'DRAFT' } }),
    prisma.course.count({ where: { status: 'ARCHIVED' } }),
    prisma.enrollment.count(),
    prisma.enrollment.count({ where: { status: 'ACTIVE' } }),
    prisma.enrollment.count({ where: { status: 'COMPLETED' } }),
    prisma.enrollment.count({ where: { status: 'DROPPED' } }),
    prisma.enrollment.count({ where: { enrolledAt: { gte: weekAgo } } }),
    prisma.module.count(),
    prisma.content.count(),
    prisma.content.count({ where: { type: 'QUIZ' } }),
    prisma.content.count({ where: { type: 'ASSIGNMENT' } }),
    prisma.quizAttempt.count({ where: { status: { in: ['COMPLETED', 'TIMED_OUT'] } } }),
    prisma.submission.count({ where: { status: { in: ['SUBMITTED', 'LATE', 'GRADED'] } } }),
    prisma.certificate.count({ where: { status: 'ISSUED' } }),
  ]);

  const stats: PlatformDashboardStats = {
    users: { total: users, students, teachers, admins, active: activeUsers, newThisWeek, newThisMonth, dailyActive, weeklyActive, monthlyActive },
    courses: { total: courses, published: publishedCourses, draft: draftCourses, archived: archivedCourses },
    enrollments: { total: enrollments, active: activeEnrollments, completed: completedEnrollments, dropped: droppedEnrollments, newThisWeek: newEnrollmentsThisWeek },
    content: { totalModules: modules, totalContent: contents, totalQuizzes: quizzes, totalAssignments: assignments },
    engagement: { quizAttempts, assignmentSubmissions, certificatesIssued },
  };

  await cacheSet(PLATFORM_CACHE_KEY, stats, CACHE_TTL);
  return stats;
}

// ---------------------------------------------------------------------------
// Teacher dashboard
// ---------------------------------------------------------------------------

export async function getTeacherStats(teacherId: string): Promise<TeacherDashboardStats> {
  const cacheKey = `${TEACHER_CACHE_PREFIX}${teacherId}`;
  const cached = await cacheGet<TeacherDashboardStats>(cacheKey);
  if (cached) return cached;

  const courses = await prisma.course.findMany({
    where: { createdBy: teacherId },
    select: { id: true, title: true },
  });

  if (courses.length === 0) {
    const empty: TeacherDashboardStats = {
      totalCourses: 0, totalStudents: 0, averageProgress: 0, courses: [], atRiskStudents: [],
    };
    await cacheSet(cacheKey, empty, CACHE_TTL);
    return empty;
  }

  const courseIds = courses.map((c) => c.id);
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: { in: courseIds } },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
      course: { select: { id: true, title: true } },
    },
  });

  const courseStats = courses.map((course) => {
    const courseEnrollments = enrollments.filter((e) => e.courseId === course.id);
    const active = courseEnrollments.filter((e) => e.status === 'ACTIVE');
    const completed = courseEnrollments.filter((e) => e.status === 'COMPLETED');
    const avgProgress = active.length === 0 ? 0 : Math.round(active.reduce((s, e) => s + e.progressPercentage, 0) / active.length * 100) / 100;
    const atRisk = active.filter((e) => {
      const days = (Date.now() - e.enrolledAt.getTime()) / (24 * 60 * 60 * 1000);
      return days > 14 && e.progressPercentage < 30;
    });
    return {
      id: course.id, title: course.title,
      enrolledCount: courseEnrollments.length,
      completedCount: completed.length,
      averageProgress: avgProgress,
      atRiskCount: atRisk.length,
    };
  });

  const atRiskStudents = enrollments
    .filter((e) => e.status === 'ACTIVE')
    .filter((e) => (Date.now() - e.enrolledAt.getTime()) / (24 * 60 * 60 * 1000) > 14 && e.progressPercentage < 30)
    .map((e) => ({
      userId: e.user.id, email: e.user.email, firstName: e.user.firstName, lastName: e.user.lastName,
      courseId: e.course.id, courseTitle: e.course.title,
      progressPercentage: e.progressPercentage,
      daysSinceEnrollment: Math.floor((Date.now() - e.enrolledAt.getTime()) / (24 * 60 * 60 * 1000)),
    }));

  const totalStudents = new Set(enrollments.map((e) => e.userId)).size;
  const allActive = enrollments.filter((e) => e.status === 'ACTIVE');
  const averageProgress = allActive.length === 0 ? 0 : Math.round(allActive.reduce((s, e) => s + e.progressPercentage, 0) / allActive.length * 100) / 100;

  const stats: TeacherDashboardStats = {
    totalCourses: courses.length,
    totalStudents,
    averageProgress,
    courses: courseStats,
    atRiskStudents,
  };

  await cacheSet(cacheKey, stats, CACHE_TTL);
  return stats;
}

// ---------------------------------------------------------------------------
// Student dashboard
// ---------------------------------------------------------------------------

export async function getStudentStats(userId: string): Promise<StudentDashboardStats> {
  const cacheKey = `${STUDENT_CACHE_PREFIX}${userId}`;
  const cached = await cacheGet<StudentDashboardStats>(cacheKey);
  if (cached) return cached;

  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    include: { course: { select: { id: true, title: true } } },
  });

  const active = enrollments.filter((e) => e.status === 'ACTIVE');
  const completed = enrollments.filter((e) => e.status === 'COMPLETED');
  const averageProgress = active.length === 0 ? 0 : Math.round(active.reduce((s, e) => s + e.progressPercentage, 0) / active.length * 100) / 100;

  // Time spent = sum of all progress.timeSpent
  const progressRecords = await prisma.progress.findMany({
    where: { enrollment: { userId } },
    select: { timeSpent: true },
  });
  const timeSpentSeconds = progressRecords.reduce((s, p) => s + p.timeSpent, 0);

  // Upcoming deadlines: assignments linked to enrolled courses, due in the future
  const courseIds = enrollments.filter((e) => e.status === 'ACTIVE').map((e) => e.courseId);
  const upcomingAssignments = courseIds.length > 0
    ? await prisma.assignment.findMany({
        where: {
          status: 'PUBLISHED',
          dueDate: { gte: new Date() },
          content: { module: { courseId: { in: courseIds } } },
        },
        select: { id: true, title: true, dueDate: true, content: { select: { module: { select: { course: { select: { title: true } } } } } } },
        orderBy: { dueDate: 'asc' },
        take: 5,
      })
    : [];

  const now = new Date();
  const upcomingDeadlines = upcomingAssignments.map((a) => ({
    assignmentId: a.id,
    title: a.title,
    courseTitle: a.content?.module?.course?.title || 'N/A',
    dueDate: a.dueDate!,
    daysUntilDue: Math.ceil((a.dueDate!.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
  }));

  // Recent activity: last 5 XP transactions
  const recentXP = await prisma.xPTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { source: true, points: true, createdAt: true },
  });
  const recentActivity = recentXP.map((x) => ({
    type: 'XP',
    description: `${x.source}: ${x.points > 0 ? '+' : ''}${x.points} XP`,
    date: x.createdAt,
  }));

  // Gamification
  const userLevel = await prisma.userLevel.findUnique({ where: { userId } });
  const badgeCount = await prisma.userBadge.count({ where: { userId } });
  const streak = await prisma.learningStreak.findUnique({ where: { userId } });

  const stats: StudentDashboardStats = {
    enrollments: { total: enrollments.length, active: active.length, completed: completed.length },
    averageProgress,
    timeSpentSeconds,
    upcomingDeadlines,
    recentActivity,
    gamification: {
      level: userLevel?.level ?? 1,
      totalXP: userLevel?.totalXP ?? 0,
      badges: badgeCount,
      currentStreak: streak?.currentStreak ?? 0,
    },
  };

  await cacheSet(cacheKey, stats, CACHE_TTL);
  return stats;
}

// ---------------------------------------------------------------------------
// Course analytics
// ---------------------------------------------------------------------------

export async function getCourseAnalytics(courseId: string): Promise<CourseAnalyticsStats> {
  const cacheKey = `${COURSE_CACHE_PREFIX}${courseId}`;
  const cached = await cacheGet<CourseAnalyticsStats>(cacheKey);
  if (cached) return cached;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, title: true },
  });
  if (!course) throw new NotFoundError('Course not found');

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId },
    select: { id: true, status: true, progressPercentage: true },
  });

  const enrolledCount = enrollments.length;
  const completedCount = enrollments.filter((e) => e.status === 'COMPLETED').length;
  const active = enrollments.filter((e) => e.status === 'ACTIVE');
  const averageProgress = active.length === 0 ? 0 : Math.round(active.reduce((s, e) => s + e.progressPercentage, 0) / active.length * 100) / 100;
  const atRiskCount = active.filter((e) => (Date.now() - new Date().getTime()) / (24 * 60 * 60 * 1000) > 14 && e.progressPercentage < 30).length;

  // Average quiz score for this course
  const quizAttempts = await prisma.quizAttempt.findMany({
    where: { quiz: { content: { module: { courseId } } }, status: { in: ['COMPLETED', 'TIMED_OUT'] } },
    select: { scorePercentage: true },
  });
  const averageScore = quizAttempts.length > 0 ? Math.round(quizAttempts.reduce((s, a) => s + (a.scorePercentage ?? 0), 0) / quizAttempts.length * 100) / 100 : 0;

  const moduleCount = await prisma.module.count({ where: { courseId } });
  const contentCount = await prisma.content.count({ where: { module: { courseId } } });

  const stats: CourseAnalyticsStats = {
    courseId: course.id,
    courseTitle: course.title,
    enrolledCount,
    completedCount,
    completionRate: enrolledCount > 0 ? Math.round((completedCount / enrolledCount) * 10000) / 100 : 0,
    averageProgress,
    averageScore,
    moduleCount,
    contentCount,
    atRiskCount,
  };

  await cacheSet(cacheKey, stats, CACHE_TTL);
  return stats;
}

// ---------------------------------------------------------------------------
// Cache invalidation
// ---------------------------------------------------------------------------

export async function invalidateDashboardCaches(): Promise<void> {
  await cacheDelete(PLATFORM_CACHE_KEY);
  // For per-teacher/student/course caches, we'd need prefix-based deletion —
  // the cache service supports it via cacheDeleteByPrefix
}
