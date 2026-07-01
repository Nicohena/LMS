// src/modules/academic/academic.service.ts
import { prisma } from '../../lib/prisma';
import { NotFoundError, ConflictError, ForbiddenError } from '../../common/errors';

// ---------------------------------------------------------------------------
// Academic Year
// ---------------------------------------------------------------------------

export async function createAcademicYear(data: { name: string; startDate: Date; endDate: Date; isCurrent?: boolean }) {
  if (data.isCurrent) {
    // Unset any existing current year
    await prisma.academicYear.updateMany({ where: { isCurrent: true }, data: { isCurrent: false } });
  }
  return prisma.academicYear.create({ data });
}

export async function getAcademicYears() {
  return prisma.academicYear.findMany({ orderBy: { startDate: 'desc' } });
}

export async function getCurrentAcademicYear() {
  const current = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
  if (!current) {
    // Fallback to the most recent
    return prisma.academicYear.findFirst({ orderBy: { startDate: 'desc' } });
  }
  return current;
}

// ---------------------------------------------------------------------------
// Grade
// ---------------------------------------------------------------------------

export async function createGrade(data: { name: string; level: number }) {
  const existing = await prisma.grade.findUnique({ where: { name: data.name } });
  if (existing) throw new ConflictError('Grade with this name already exists');
  return prisma.grade.create({ data });
}

export async function getGrades() {
  return prisma.grade.findMany({ orderBy: { level: 'asc' }, include: { _count: { select: { sections: true } } } });
}

// ---------------------------------------------------------------------------
// Subject
// ---------------------------------------------------------------------------

export async function createSubject(data: { name: string; code?: string; description?: string }) {
  const existing = await prisma.subject.findUnique({ where: { name: data.name } });
  if (existing) throw new ConflictError('Subject with this name already exists');
  return prisma.subject.create({ data });
}

export async function getSubjects() {
  return prisma.subject.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { sectionSubjects: true } } } });
}

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

export async function createSection(data: { name: string; gradeId: string; academicYearId: string; capacity?: number }) {
  const grade = await prisma.grade.findUnique({ where: { id: data.gradeId } });
  if (!grade) throw new NotFoundError('Grade not found');
  const ay = await prisma.academicYear.findUnique({ where: { id: data.academicYearId } });
  if (!ay) throw new NotFoundError('Academic year not found');
  const existing = await prisma.section.findUnique({ where: { name_academicYearId: { name: data.name, academicYearId: data.academicYearId } } });
  if (existing) throw new ConflictError('Section with this name already exists in this academic year');
  return prisma.section.create({
    data,
    include: { grade: true, academicYear: true, _count: { select: { studentSections: true, sectionSubjects: true } } },
  });
}

export async function getSections(filters?: { gradeId?: string; academicYearId?: string }) {
  return prisma.section.findMany({
    where: filters,
    orderBy: { name: 'asc' },
    include: {
      grade: true,
      academicYear: true,
      _count: { select: { studentSections: true, sectionSubjects: true } },
    },
  });
}

export async function getSectionStudents(sectionId: string) {
  return prisma.studentSection.findMany({
    where: { sectionId, status: 'ACTIVE' },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, email: true, role: true, isActive: true } },
    },
    orderBy: { student: { firstName: 'asc' } },
  });
}

export async function getSectionTeachers(sectionId: string) {
  return prisma.sectionSubject.findMany({
    where: { sectionId, teacherId: { not: null } },
    include: {
      teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
      subject: true,
    },
  });
}

// ---------------------------------------------------------------------------
// Section-Subject (teacher assignment)
// ---------------------------------------------------------------------------

export async function assignTeacherToSectionSubject(data: { sectionId: string; subjectId: string; teacherId: string }) {
  // Verify teacher exists and has TEACHER role
  const teacher = await prisma.user.findUnique({ where: { id: data.teacherId } });
  if (!teacher) throw new NotFoundError('Teacher not found');
  if (teacher.role !== 'TEACHER') throw new ForbiddenError('User is not a teacher');

  // Verify section + subject exist
  const section = await prisma.section.findUnique({ where: { id: data.sectionId } });
  if (!section) throw new NotFoundError('Section not found');
  const subject = await prisma.subject.findUnique({ where: { id: data.subjectId } });
  if (!subject) throw new NotFoundError('Subject not found');

  // Upsert: create or update teacher assignment
  const existing = await prisma.sectionSubject.findUnique({
    where: { sectionId_subjectId: { sectionId: data.sectionId, subjectId: data.subjectId } },
  });

  if (existing) {
    return prisma.sectionSubject.update({
      where: { id: existing.id },
      data: { teacherId: data.teacherId },
      include: { section: true, subject: true, teacher: true },
    });
  }

  return prisma.sectionSubject.create({
    data,
    include: { section: true, subject: true, teacher: true },
  });
}

export async function getSectionSubjects(filters?: { sectionId?: string; teacherId?: string }) {
  return prisma.sectionSubject.findMany({
    where: filters,
    include: {
      section: { include: { grade: true, academicYear: true } },
      subject: true,
      teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
      _count: { select: { sectionContents: true, sectionQuizzes: true, sectionAssignments: true } },
    },
    orderBy: { subject: { name: 'asc' } },
  });
}

// ---------------------------------------------------------------------------
// Student-Section (student enrollment)
// ---------------------------------------------------------------------------

export async function assignStudentToSection(data: { studentId: string; sectionId: string; academicYearId: string }) {
  const student = await prisma.user.findUnique({ where: { id: data.studentId } });
  if (!student) throw new NotFoundError('Student not found');
  if (student.role !== 'STUDENT') throw new ForbiddenError('User is not a student');

  const section = await prisma.section.findUnique({ where: { id: data.sectionId } });
  if (!section) throw new NotFoundError('Section not found');
  const ay = await prisma.academicYear.findUnique({ where: { id: data.academicYearId } });
  if (!ay) throw new NotFoundError('Academic year not found');

  const existing = await prisma.studentSection.findUnique({
    where: { studentId_sectionId_academicYearId: { studentId: data.studentId, sectionId: data.sectionId, academicYearId: data.academicYearId } },
  });
  if (existing) throw new ConflictError('Student already assigned to this section for this academic year');

  return prisma.studentSection.create({
    data,
    include: {
      student: { select: { id: true, firstName: true, lastName: true, email: true } },
      section: { include: { grade: true } },
      academicYear: true,
    },
  });
}

export async function getStudentSections(studentId: string) {
  return prisma.studentSection.findMany({
    where: { studentId, status: 'ACTIVE' },
    include: {
      section: { include: { grade: true, academicYear: true, sectionSubjects: { include: { subject: true, teacher: { select: { id: true, firstName: true, lastName: true } } } } } },
    },
    orderBy: { enrolledAt: 'desc' },
  });
}

export async function getTeacherSectionSubjects(teacherId: string) {
  return prisma.sectionSubject.findMany({
    where: { teacherId },
    include: {
      section: { include: { grade: true, academicYear: true, _count: { select: { studentSections: true } } } },
      subject: true,
    },
    orderBy: { section: { name: 'asc' } },
  });
}

export async function removeStudentFromSection(studentId: string, sectionId: string) {
  const existing = await prisma.studentSection.findFirst({ where: { studentId, sectionId } });
  if (!existing) throw new NotFoundError('Student is not assigned to this section');
  return prisma.studentSection.update({
    where: { id: existing.id },
    data: { status: 'TRANSFERRED' },
  });
}
