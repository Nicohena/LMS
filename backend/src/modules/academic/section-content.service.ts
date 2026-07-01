// src/modules/academic/section-content.service.ts
import { prisma } from '../../lib/prisma';
import { NotFoundError, ForbiddenError } from '../../common/errors';

// --- Helper: verify teacher can manage this section-subject ---
async function assertTeacherCanManage(sectionSubjectId: string, teacherId: string) {
  const ss = await prisma.sectionSubject.findUnique({ where: { id: sectionSubjectId } });
  if (!ss) throw new NotFoundError('Section-subject not found');
  if (ss.teacherId !== teacherId) {
    throw new ForbiddenError('You are not assigned to teach this section-subject');
  }
  return ss;
}

// --- Helper: verify student can access this section-subject ---
async function assertStudentCanAccess(sectionSubjectId: string, studentId: string) {
  const ss = await prisma.sectionSubject.findUnique({
    where: { id: sectionSubjectId },
    include: { section: true },
  });
  if (!ss) throw new NotFoundError('Section-subject not found');
  const studentSection = await prisma.studentSection.findFirst({
    where: { studentId, sectionId: ss.sectionId, status: 'ACTIVE' },
  });
  if (!studentSection) {
    throw new ForbiddenError('You are not enrolled in this section');
  }
  return { ss, studentSection };
}

// ---------------------------------------------------------------------------
// Section Content CRUD
// ---------------------------------------------------------------------------

export async function createSectionContent(teacherId: string, data: {
  sectionSubjectId: string;
  type: any;
  title: string;
  description?: string;
  contentJson?: any;
  videoUrl?: string;
  fileUrl?: string;
  externalUrl?: string;
  duration?: number;
  order?: number;
  isPublished?: boolean;
}) {
  await assertTeacherCanManage(data.sectionSubjectId, teacherId);
  return prisma.sectionContent.create({
    data: { ...data, createdBy: teacherId },
    include: { sectionSubject: { include: { subject: true, section: true } } },
  });
}

export async function getSectionContents(filters: {
  sectionSubjectId?: string;
  studentId?: string;
  teacherId?: string;
  isAdmin?: boolean;
}) {
  const where: any = {};
  if (filters.sectionSubjectId) where.sectionSubjectId = filters.sectionSubjectId;

  // Access control:
  // - Students: only content for their sections, only PUBLISHED
  // - Teachers: only content for section-subjects they teach
  // - Admins: all content
  if (filters.studentId) {
    const studentSections = await prisma.studentSection.findMany({
      where: { studentId: filters.studentId, status: 'ACTIVE' },
      select: { sectionId: true },
    });
    const sectionIds = studentSections.map((s) => s.sectionId);
    const sectionSubjects = await prisma.sectionSubject.findMany({
      where: { sectionId: { in: sectionIds } },
      select: { id: true },
    });
    where.sectionSubjectId = { in: sectionSubjects.map((s) => s.id) };
    where.isPublished = true;
    where.status = 'PUBLISHED';
  } else if (filters.teacherId && !filters.isAdmin) {
    const teacherSSs = await prisma.sectionSubject.findMany({
      where: { teacherId: filters.teacherId },
      select: { id: true },
    });
    where.sectionSubjectId = { in: teacherSSs.map((s) => s.id) };
  }

  return prisma.sectionContent.findMany({
    where,
    orderBy: { order: 'asc' },
    include: {
      sectionSubject: { include: { subject: true, section: { include: { grade: true } } } },
    },
  });
}

export async function getSectionContentById(id: string, viewer?: { id: string; role: string }) {
  const content = await prisma.sectionContent.findUnique({
    where: { id },
    include: { sectionSubject: { include: { subject: true, section: true } } },
  });
  if (!content) throw new NotFoundError('Content not found');

  // Access check
  if (viewer && viewer.role === 'STUDENT') {
    await assertStudentCanAccess(content.sectionSubjectId, viewer.id);
  } else if (viewer && viewer.role === 'TEACHER') {
    await assertTeacherCanManage(content.sectionSubjectId, viewer.id);
  }

  return content;
}

export async function updateSectionContent(id: string, teacherId: string, data: any) {
  const content = await prisma.sectionContent.findUnique({ where: { id } });
  if (!content) throw new NotFoundError('Content not found');
  await assertTeacherCanManage(content.sectionSubjectId, teacherId);
  return prisma.sectionContent.update({ where: { id }, data });
}

export async function deleteSectionContent(id: string, teacherId: string) {
  const content = await prisma.sectionContent.findUnique({ where: { id } });
  if (!content) throw new NotFoundError('Content not found');
  await assertTeacherCanManage(content.sectionSubjectId, teacherId);
  await prisma.sectionContent.delete({ where: { id } });
}

// ---------------------------------------------------------------------------
// Section Quiz CRUD
// ---------------------------------------------------------------------------

export async function createSectionQuiz(teacherId: string, data: {
  sectionSubjectId: string;
  sectionContentId?: string;
  title: string;
  description?: string;
  timeLimit?: number;
  passingScore?: number;
  maxAttempts?: number;
  status?: any;
}) {
  await assertTeacherCanManage(data.sectionSubjectId, teacherId);
  return prisma.sectionQuiz.create({
    data: { ...data, createdBy: teacherId },
    include: { sectionSubject: { include: { subject: true, section: true } } },
  });
}

export async function getSectionQuizzes(filters: { sectionSubjectId?: string; studentId?: string; teacherId?: string; isAdmin?: boolean }) {
  const where: any = {};
  if (filters.sectionSubjectId) where.sectionSubjectId = filters.sectionSubjectId;

  if (filters.studentId) {
    const studentSections = await prisma.studentSection.findMany({
      where: { studentId: filters.studentId, status: 'ACTIVE' },
      select: { sectionId: true },
    });
    const sectionIds = studentSections.map((s) => s.sectionId);
    const sectionSubjects = await prisma.sectionSubject.findMany({
      where: { sectionId: { in: sectionIds } },
      select: { id: true },
    });
    where.sectionSubjectId = { in: sectionSubjects.map((s) => s.id) };
    where.status = 'PUBLISHED';
  } else if (filters.teacherId && !filters.isAdmin) {
    const teacherSSs = await prisma.sectionSubject.findMany({
      where: { teacherId: filters.teacherId },
      select: { id: true },
    });
    where.sectionSubjectId = { in: teacherSSs.map((s) => s.id) };
  }

  return prisma.sectionQuiz.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { sectionSubject: { include: { subject: true, section: { include: { grade: true } } } } },
  });
}

// ---------------------------------------------------------------------------
// Section Assignment CRUD
// ---------------------------------------------------------------------------

export async function createSectionAssignment(teacherId: string, data: {
  sectionSubjectId: string;
  sectionContentId?: string;
  title: string;
  description?: string;
  instructions?: string;
  dueDate?: Date;
  maxPoints?: number;
  requiresFileUpload?: boolean;
  allowedFileTypes?: string[];
  maxFileSizeMB?: number;
  status?: any;
}) {
  await assertTeacherCanManage(data.sectionSubjectId, teacherId);
  return prisma.sectionAssignment.create({
    data: { ...data, createdBy: teacherId },
    include: { sectionSubject: { include: { subject: true, section: true } } },
  });
}

export async function getSectionAssignments(filters: { sectionSubjectId?: string; studentId?: string; teacherId?: string; isAdmin?: boolean }) {
  const where: any = {};
  if (filters.sectionSubjectId) where.sectionSubjectId = filters.sectionSubjectId;

  if (filters.studentId) {
    const studentSections = await prisma.studentSection.findMany({
      where: { studentId: filters.studentId, status: 'ACTIVE' },
      select: { sectionId: true },
    });
    const sectionIds = studentSections.map((s) => s.sectionId);
    const sectionSubjects = await prisma.sectionSubject.findMany({
      where: { sectionId: { in: sectionIds } },
      select: { id: true },
    });
    where.sectionSubjectId = { in: sectionSubjects.map((s) => s.id) };
    where.status = 'PUBLISHED';
  } else if (filters.teacherId && !filters.isAdmin) {
    const teacherSSs = await prisma.sectionSubject.findMany({
      where: { teacherId: filters.teacherId },
      select: { id: true },
    });
    where.sectionSubjectId = { in: teacherSSs.map((s) => s.id) };
  }

  return prisma.sectionAssignment.findMany({
    where,
    orderBy: { dueDate: 'asc' },
    include: { sectionSubject: { include: { subject: true, section: { include: { grade: true } } } } },
  });
}
