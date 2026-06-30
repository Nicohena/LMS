// src/modules/reports/admin-dashboard.service.ts
import { prisma } from '../../lib/prisma';

// ---------------------------------------------------------------------------
// Admin alerts — pending escalations, flagged content, low-quality courses,
// at-risk students, system health
// ---------------------------------------------------------------------------

export async function getAdminAlerts() {
  const [
    pendingEscalations,
    flaggedContent,
    lowQualityCourses,
    atRiskStudents,
    openGradeDisputes,
  ] = await Promise.all([
    prisma.escalation.count({ where: { status: { in: ['OPEN', 'TEACHER_REVIEW', 'FORWARDED_TO_ADMIN'] } } }),
    prisma.content.count({ where: { status: 'FLAGGED' } }),
    prisma.course.count({ where: { qualityScore: { lt: 40 } } }),
    prisma.enrollment.count({ where: { status: 'ACTIVE', progressPercentage: { lt: 25 } } }),
    prisma.gradeDispute.count({ where: { status: { in: ['OPEN', 'UNDER_REVIEW', 'ESCALATED'] } } }),
  ]);

  return {
    pendingEscalations,
    flaggedContent,
    lowQualityCourses,
    atRiskStudents,
    openGradeDisputes,
    total: pendingEscalations + flaggedContent + lowQualityCourses + atRiskStudents + openGradeDisputes,
  };
}

// ---------------------------------------------------------------------------
// Recent activity feed
// ---------------------------------------------------------------------------

export async function getRecentActivity(limit: number = 20) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [recentUsers, recentCourses, recentEnrollments, recentSubmissions, recentCertificates] = await Promise.all([
    prisma.user.findMany({
      where: { createdAt: { gte: weekAgo } },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    prisma.course.findMany({
      where: { createdAt: { gte: weekAgo } },
      select: { id: true, title: true, status: true, createdAt: true, createdBy: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    prisma.enrollment.findMany({
      where: { enrolledAt: { gte: weekAgo } },
      select: { id: true, userId: true, courseId: true, status: true, enrolledAt: true, course: { select: { title: true } }, user: { select: { firstName: true, lastName: true } } },
      orderBy: { enrolledAt: 'desc' },
      take: limit,
    }),
    prisma.submission.findMany({
      where: { submittedAt: { gte: weekAgo } },
      select: { id: true, status: true, submittedAt: true, user: { select: { firstName: true, lastName: true } }, assignment: { select: { title: true } } },
      orderBy: { submittedAt: 'desc' },
      take: limit,
    }),
    prisma.certificate.findMany({
      where: { issuedAt: { gte: weekAgo } },
      select: { id: true, referenceNumber: true, issuedAt: true, user: { select: { firstName: true, lastName: true } }, course: { select: { title: true } } },
      orderBy: { issuedAt: 'desc' },
      take: limit,
    }),
  ]);

  // Merge into unified activity feed
  const activities: any[] = [];

  recentUsers.forEach(u => activities.push({
    type: 'user_registered', timestamp: u.createdAt, data: { name: `${u.firstName} ${u.lastName}`, email: u.email, role: u.role },
  }));
  recentCourses.forEach(c => activities.push({
    type: 'course_created', timestamp: c.createdAt, data: { title: c.title, status: c.status },
  }));
  recentEnrollments.forEach(e => activities.push({
    type: 'enrollment', timestamp: e.enrolledAt, data: { student: `${e.user?.firstName} ${e.user?.lastName}`, course: e.course?.title, status: e.status },
  }));
  recentSubmissions.forEach(s => activities.push({
    type: 'submission', timestamp: s.submittedAt, data: { student: `${s.user?.firstName} ${s.user?.lastName}`, assignment: s.assignment?.title, status: s.status },
  }));
  recentCertificates.forEach(c => activities.push({
    type: 'certificate_issued', timestamp: c.issuedAt, data: { student: `${c.user?.firstName} ${c.user?.lastName}`, course: c.course?.title, ref: c.referenceNumber },
  }));

  // Sort by timestamp descending and limit
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return activities.slice(0, limit);
}

// ---------------------------------------------------------------------------
// Dashboard summary — combined stats + alerts + activity
// ---------------------------------------------------------------------------

export async function getAdminDashboardSummary() {
  const [alerts, activity] = await Promise.all([
    getAdminAlerts(),
    getRecentActivity(15),
  ]);

  return { alerts, activity };
}
