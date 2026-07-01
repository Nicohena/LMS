// src/modules/academic/dashboard.service.ts
import { prisma } from '../../lib/prisma';

// ---------------------------------------------------------------------------
// Teacher Dashboard
// ---------------------------------------------------------------------------

export async function getTeacherDashboardData(teacherId: string) {
  const sectionSubjects = await prisma.sectionSubject.findMany({
    where: { teacherId },
    include: {
      subject: true,
      section: { include: { grade: true, academicYear: true, _count: { select: { studentSections: true } } } },
      _count: { select: { sectionContents: true, sectionQuizzes: true, sectionAssignments: true } },
    },
    orderBy: { section: { name: 'asc' } },
  });

  const sectionIds = [...new Set(sectionSubjects.map((ss) => ss.sectionId))];
  const totalStudents = await prisma.studentSection.count({
    where: { sectionId: { in: sectionIds }, status: 'ACTIVE' },
  });

  // Upcoming assignment deadlines (next 7 days)
  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingDeadlines = await prisma.sectionAssignment.findMany({
    where: {
      sectionSubject: { teacherId },
      dueDate: { gte: now, lte: sevenDaysLater },
      status: 'PUBLISHED',
    },
    include: { sectionSubject: { include: { subject: true, section: true } } },
    orderBy: { dueDate: 'asc' },
    take: 10,
  });

  // At-risk students: students in teacher's sections with low progress
  const studentSections = await prisma.studentSection.findMany({
    where: { sectionId: { in: sectionIds }, status: 'ACTIVE' },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, email: true } },
      section: { include: { grade: true } },
      sectionProgress: true,
    },
  });

  const atRiskStudents = studentSections
    .filter((ss: any) => {
      if (ss.sectionProgress.length === 0) return true; // no activity
      const avgProgress = ss.sectionProgress.reduce((sum, p) => sum + p.progressPercent, 0) / ss.sectionProgress.length;
      return avgProgress < 30;
    })
    .slice(0, 10)
    .map((ss) => ({
      studentId: ss.student.id,
      name: `${ss.student.firstName} ${ss.student.lastName}`,
      email: ss.student.email,
      sectionName: ss.section.name,
      gradeName: ss.section.grade.name,
      avgProgress: ss.sectionProgress.length > 0
        ? Math.round(ss.sectionProgress.reduce((sum, p) => sum + p.progressPercent, 0) / ss.sectionProgress.length)
        : 0,
    }));

  return {
    stats: {
      totalSections: sectionIds.length,
      totalSubjects: sectionSubjects.length,
      totalStudents,
      totalContent: sectionSubjects.reduce((sum: number, ss: any) => sum + ss._count.sectionContents, 0),
      totalQuizzes: sectionSubjects.reduce((sum: number, ss: any) => sum + ss._count.sectionQuizzes, 0),
      totalAssignments: sectionSubjects.reduce((sum: number, ss: any) => sum + ss._count.sectionAssignments, 0),
    },
    sectionSubjects: sectionSubjects.map((ss) => ({
      id: ss.id,
      subject: ss.subject,
      section: ss.section,
      studentCount: ss.section._count.studentSections,
      contentCount: ss._count.sectionContents,
      quizCount: ss._count.sectionQuizzes,
      assignmentCount: ss._count.sectionAssignments,
    })),
    upcomingDeadlines: upcomingDeadlines.map((a) => ({
      id: a.id,
      title: a.title,
      dueDate: a.dueDate,
      subject: a.sectionSubject.subject.name,
      section: a.sectionSubject.section.name,
    })),
    atRiskStudents,
  };
}

// ---------------------------------------------------------------------------
// Student Dashboard
// ---------------------------------------------------------------------------

export async function getStudentDashboardData(studentId: string) {
  const studentSections = await prisma.studentSection.findMany({
    where: { studentId, status: 'ACTIVE' },
    include: {
      section: {
        include: {
          grade: true,
          academicYear: true,
          sectionSubjects: {
            include: {
              subject: true,
              teacher: { select: { id: true, firstName: true, lastName: true } },
              _count: { select: { sectionContents: true, sectionQuizzes: true, sectionAssignments: true } },
            },
          },
        },
      },
    },
  });

  // Progress per section-subject
  const allProgress = await prisma.sectionProgress.findMany({
    where: { studentSection: { studentId } },
    include: { sectionContent: { include: { sectionSubject: { include: { subject: true } } } } },
  });

  const subjectProgressMap = new Map<string, { total: number; completed: number; avgProgress: number }>();
  for (const p of allProgress) {
    const ssId = p.sectionContent.sectionSubjectId;
    if (!subjectProgressMap.has(ssId)) {
      subjectProgressMap.set(ssId, { total: 0, completed: 0, avgProgress: 0 });
    }
    const entry = subjectProgressMap.get(ssId)!;
    entry.total++;
    if (p.status === 'COMPLETED') entry.completed++;
    entry.avgProgress += p.progressPercent;
  }

  const subjectProgress = Array.from(subjectProgressMap.entries()).map(([ssId, data]: [string, any]) => ({
    sectionSubjectId: ssId,
    totalContent: data.total,
    completedContent: data.completed,
    averageProgress: data.total > 0 ? Math.round(data.avgProgress / data.total) : 0,
    completionRate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
  }));

  // Upcoming deadlines
  const now = new Date();
  const sectionIds = studentSections.map((ss) => ss.sectionId);
  const upcomingDeadlines = await prisma.sectionAssignment.findMany({
    where: {
      sectionSubject: { sectionId: { in: sectionIds } },
      dueDate: { gte: now },
      status: 'PUBLISHED',
    },
    include: { sectionSubject: { include: { subject: true, section: true } } },
    orderBy: { dueDate: 'asc' },
    take: 10,
  });

  // Overall stats
  const totalContent = allProgress.length;
  const completedContent = allProgress.filter((p) => p.status === 'COMPLETED').length;
  const overallProgress = totalContent > 0
    ? Math.round(allProgress.reduce((sum, p) => sum + p.progressPercent, 0) / totalContent)
    : 0;
  const totalTimeSpent = allProgress.reduce((sum, p) => sum + p.timeSpent, 0);

  return {
    stats: {
      totalSections: studentSections.length,
      totalSubjects: subjectProgress.length,
      totalContent,
      completedContent,
      overallProgress,
      totalTimeSpent,
    },
    sections: studentSections.map((ss) => ({
      id: ss.id,
      section: ss.section,
      subjects: ss.section.sectionSubjects.map((subj) => ({
        ...subj,
        progress: subjectProgress.find((sp) => sp.sectionSubjectId === subj.id),
      })),
    })),
    subjectProgress,
    upcomingDeadlines: upcomingDeadlines.map((a) => ({
      id: a.id,
      title: a.title,
      dueDate: a.dueDate,
      subject: a.sectionSubject.subject.name,
      section: a.sectionSubject.section.name,
      daysUntilDue: Math.ceil((a.dueDate!.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
    })),
  };
}

// ---------------------------------------------------------------------------
// Admin Dashboard (school-based metrics)
// ---------------------------------------------------------------------------

export async function getAdminSchoolDashboardData() {
  const [
    academicYears, grades, sections, subjects,
    sectionSubjects, studentSections,
  ] = await Promise.all([
    prisma.academicYear.count(),
    prisma.grade.count(),
    prisma.section.count(),
    prisma.subject.count(),
    prisma.sectionSubject.count(),
    prisma.studentSection.count({ where: { status: 'ACTIVE' } }),
  ]);

  // Enrollment distribution by grade
  const sectionsByGrade = await prisma.grade.findMany({
    include: {
      _count: { select: { sections: true } },
      sections: { include: { _count: { select: { studentSections: true } } } },
    },
    orderBy: { level: 'asc' },
  });

  const enrollmentByGrade = sectionsByGrade.map((g) => ({
    grade: g.name,
    sections: g._count.sections,
    students: g.sections.reduce((sum, s) => sum + s._count.studentSections, 0),
  }));

  // Teacher workload distribution
  const teacherWorkload = await prisma.sectionSubject.groupBy({
    by: ['teacherId'],
    _count: { id: true },
    where: { teacherId: { not: null } },
  });

  const teachers = await prisma.user.findMany({
    where: { id: { in: teacherWorkload.map((t) => t.teacherId!) } },
    select: { id: true, firstName: true, lastName: true },
  });

  const teacherWorkloadDist = teacherWorkload.map((tw: any) => {
    const teacher = teachers.find((t: any) => t.id === tw.teacherId);
    return {
      teacherId: tw.teacherId,
      teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Unknown',
      sectionSubjectCount: tw._count.id,
    };
  });

  // Unassigned section-subjects (no teacher)
  const unassignedCount = await prisma.sectionSubject.count({ where: { teacherId: null } });

  return {
    stats: {
      academicYears,
      grades,
      sections,
      subjects,
      sectionSubjects,
      studentSections,
      unassignedSectionSubjects: unassignedCount,
    },
    enrollmentByGrade,
    teacherWorkload: teacherWorkloadDist,
  };
}
