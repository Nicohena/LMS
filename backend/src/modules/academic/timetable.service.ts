// src/modules/academic/timetable.service.ts
import { prisma } from '../../lib/prisma';
import { NotFoundError, ForbiddenError, ConflictError } from '../../common/errors';

// ---------------------------------------------------------------------------
// Create a timetable entry (admin only)
// ---------------------------------------------------------------------------

export async function createTimetableEntry(data: {
  sectionId: string;
  sectionSubjectId?: string;
  day: string;
  period: number;
  startTime: string;
  endTime: string;
  subjectName?: string;
  teacherName?: string;
  room?: string;
  breakType?: string;
}) {
  const section = await prisma.section.findUnique({ where: { id: data.sectionId } });
  if (!section) throw new NotFoundError('Section not found');

  if (data.sectionSubjectId) {
    const ss = await prisma.sectionSubject.findUnique({
      where: { id: data.sectionSubjectId },
      include: { subject: true, teacher: true },
    });
    if (!ss) throw new NotFoundError('Section-subject not found');
    // Auto-fill subject and teacher names
    if (!data.subjectName) data.subjectName = ss.subject.name;
    if (!data.teacherName && ss.teacher) {
      data.teacherName = `${ss.teacher.firstName} ${ss.teacher.lastName}`;
    }
  }

  return prisma.timetable.create({ data, include: { section: true, sectionSubject: { include: { subject: true, teacher: true } } } });
}

export async function createTimetableBatch(data: {
  sectionId: string;
  entries: Array<{
    day: string;
    period: number;
    startTime: string;
    endTime: string;
    sectionSubjectId?: string;
    subjectName?: string;
    teacherName?: string;
    room?: string;
    breakType?: string;
  }>;
}) {
  const section = await prisma.section.findUnique({ where: { id: data.sectionId } });
  if (!section) throw new NotFoundError('Section not found');

  // Delete existing timetable for this section
  await prisma.timetable.deleteMany({ where: { sectionId: data.sectionId } });

  // Create new entries
  const entries: any[] = [];
  for (const e of data.entries) {
    let subjectName = e.subjectName;
    let teacherName = e.teacherName;
    if (e.sectionSubjectId) {
      const ss = await prisma.sectionSubject.findUnique({
        where: { id: e.sectionSubjectId },
        include: { subject: true, teacher: true },
      });
      if (ss) {
        if (!subjectName) subjectName = ss.subject.name;
        if (!teacherName && ss.teacher) teacherName = `${ss.teacher.firstName} ${ss.teacher.lastName}`;
      }
    }
    const entry = await prisma.timetable.create({
      data: {
        sectionId: data.sectionId,
        sectionSubjectId: e.sectionSubjectId || null,
        day: e.day,
        period: e.period,
        startTime: e.startTime,
        endTime: e.endTime,
        subjectName,
        teacherName,
        room: e.room,
        breakType: e.breakType || null,
      },
    });
    entries.push(entry);
  }
  return entries;
}

// ---------------------------------------------------------------------------
// Get timetable for a section (students/teachers/admins)
// ---------------------------------------------------------------------------

export async function getTimetableBySection(sectionId: string) {
  const entries = await prisma.timetable.findMany({
    where: { sectionId },
    orderBy: [{ day: 'asc' }, { period: 'asc' }],
    include: {
      sectionSubject: { include: { subject: true, teacher: true } },
    },
  });

  // Group by day
  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  const grouped: Record<string, any[]> = {};
  for (const day of days) grouped[day] = [];
  for (const e of entries) {
    if (grouped[e.day]) grouped[e.day].push(e);
  }
  return { sectionId, schedule: grouped, raw: entries };
}

export async function getStudentTimetable(studentId: string) {
  const studentSections = await prisma.studentSection.findMany({
    where: { studentId, status: 'ACTIVE' },
    select: { sectionId: true },
  });
  const sectionIds = studentSections.map((s) => s.sectionId);
  if (sectionIds.length === 0) return { schedule: {}, sections: [] };

  const sections = await prisma.section.findMany({
    where: { id: { in: sectionIds } },
    include: { grade: true, academicYear: true },
  });

  const entries = await prisma.timetable.findMany({
    where: { sectionId: { in: sectionIds } },
    orderBy: [{ day: 'asc' }, { period: 'asc' }],
    include: {
      section: { include: { grade: true } },
      sectionSubject: { include: { subject: true, teacher: true } },
    },
  });

  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  const grouped: Record<string, any[]> = {};
  for (const day of days) grouped[day] = [];
  for (const e of entries) {
    if (grouped[e.day]) grouped[e.day].push(e);
  }

  return { schedule: grouped, sections, raw: entries };
}

export async function getTeacherTimetable(teacherId: string) {
  const sectionSubjects = await prisma.sectionSubject.findMany({
    where: { teacherId },
    select: { id: true, sectionId: true },
  });
  const sectionIds = [...new Set(sectionSubjects.map((s) => s.sectionId))];

  const entries = await prisma.timetable.findMany({
    where: { sectionId: { in: sectionIds } },
    orderBy: [{ day: 'asc' }, { period: 'asc' }],
    include: {
      section: { include: { grade: true } },
      sectionSubject: { include: { subject: true } },
    },
  });

  // Filter to only this teacher's entries
  const teacherEntries = entries.filter(
    (e) => !e.sectionSubjectId || sectionSubjects.some((ss) => ss.id === e.sectionSubjectId)
  );

  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  const grouped: Record<string, any[]> = {};
  for (const day of days) grouped[day] = [];
  for (const e of teacherEntries) {
    if (grouped[e.day]) grouped[e.day].push(e);
  }

  return { schedule: grouped, sections: sectionIds, raw: teacherEntries };
}

export async function deleteTimetableEntry(id: string) {
  await prisma.timetable.delete({ where: { id } });
}

export async function deleteTimetableBySection(sectionId: string) {
  await prisma.timetable.deleteMany({ where: { sectionId } });
}
