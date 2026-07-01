// src/modules/academic/academic.controller.ts
import type { Request, Response, NextFunction } from 'express';
import {
  createAcademicYear, getAcademicYears, getCurrentAcademicYear,
  createGrade, getGrades,
  createSubject, getSubjects,
  createSection, getSections, getSectionStudents, getSectionTeachers,
  assignTeacherToSectionSubject, getSectionSubjects,
  assignStudentToSection, getStudentSections, getTeacherSectionSubjects,
  removeStudentFromSection,
} from './academic.service';
import { logAction } from '../../common/services/audit.service';
import { getClientIp, getUserAgent } from '../../common/services/upload.service';

function auditCtx(req: Request) {
  return { ip: getClientIp(req), userAgent: getUserAgent(req) };
}
function paramId(req: Request, key: string): string {
  const v = req.params[key];
  return Array.isArray(v) ? v[0] : (v || '');
}

// --- Academic Years ---
export async function createAcademicYearController(req: Request, res: Response, next: NextFunction) {
  try {
    const ay = await createAcademicYear(req.body);
    await logAction({ userId: req.user!.sub, action: 'ACADEMIC_YEAR_CREATE' as any, entityType: 'AcademicYear' as any, entityId: ay.id, context: auditCtx(req) });
    res.status(201).json({ message: 'Academic year created.', academicYear: ay });
  } catch (err) { next(err); }
}
export async function getAcademicYearsController(req: Request, res: Response, next: NextFunction) {
  try {
    const academicYears = await getAcademicYears();
    res.status(200).json({ data: academicYears });
  } catch (err) { next(err); }
}
export async function getCurrentAcademicYearController(req: Request, res: Response, next: NextFunction) {
  try {
    const current = await getCurrentAcademicYear();
    res.status(200).json({ academicYear: current });
  } catch (err) { next(err); }
}

// --- Grades ---
export async function createGradeController(req: Request, res: Response, next: NextFunction) {
  try {
    const grade = await createGrade(req.body);
    await logAction({ userId: req.user!.sub, action: 'GRADE_CREATE' as any, entityType: 'Grade' as any, entityId: grade.id, context: auditCtx(req) });
    res.status(201).json({ message: 'Grade created.', grade });
  } catch (err) { next(err); }
}
export async function getGradesController(req: Request, res: Response, next: NextFunction) {
  try {
    const grades = await getGrades();
    res.status(200).json({ data: grades });
  } catch (err) { next(err); }
}

// --- Subjects ---
export async function createSubjectController(req: Request, res: Response, next: NextFunction) {
  try {
    const subject = await createSubject(req.body);
    await logAction({ userId: req.user!.sub, action: 'SUBJECT_CREATE' as any, entityType: 'Subject' as any, entityId: subject.id, context: auditCtx(req) });
    res.status(201).json({ message: 'Subject created.', subject });
  } catch (err) { next(err); }
}
export async function getSubjectsController(req: Request, res: Response, next: NextFunction) {
  try {
    const subjects = await getSubjects();
    res.status(200).json({ data: subjects });
  } catch (err) { next(err); }
}

// --- Sections ---
export async function createSectionController(req: Request, res: Response, next: NextFunction) {
  try {
    const section = await createSection(req.body);
    await logAction({ userId: req.user!.sub, action: 'SECTION_CREATE' as any, entityType: 'Section' as any, entityId: section.id, context: auditCtx(req) });
    res.status(201).json({ message: 'Section created.', section });
  } catch (err) { next(err); }
}
export async function getSectionsController(req: Request, res: Response, next: NextFunction) {
  try {
    const filters: any = {};
    if (req.query.gradeId) filters.gradeId = req.query.gradeId as string;
    if (req.query.academicYearId) filters.academicYearId = req.query.academicYearId as string;
    const sections = await getSections(filters);
    res.status(200).json({ data: sections });
  } catch (err) { next(err); }
}
export async function getSectionStudentsController(req: Request, res: Response, next: NextFunction) {
  try {
    const sectionId = paramId(req, 'id');
    const students = await getSectionStudents(sectionId);
    res.status(200).json({ data: students });
  } catch (err) { next(err); }
}
export async function getSectionTeachersController(req: Request, res: Response, next: NextFunction) {
  try {
    const sectionId = paramId(req, 'id');
    const teachers = await getSectionTeachers(sectionId);
    res.status(200).json({ data: teachers });
  } catch (err) { next(err); }
}

// --- Section-Subjects (teacher assignment) ---
export async function assignTeacherController(req: Request, res: Response, next: NextFunction) {
  try {
    const ss = await assignTeacherToSectionSubject(req.body);
    await logAction({ userId: req.user!.sub, action: 'TEACHER_ASSIGN' as any, entityType: 'SectionSubject' as any, entityId: ss.id, details: { teacherId: req.body.teacherId } as any, context: auditCtx(req) });
    res.status(201).json({ message: 'Teacher assigned to section-subject.', sectionSubject: ss });
  } catch (err) { next(err); }
}
export async function getSectionSubjectsController(req: Request, res: Response, next: NextFunction) {
  try {
    const filters: any = {};
    if (req.query.sectionId) filters.sectionId = req.query.sectionId as string;
    if (req.query.teacherId) filters.teacherId = req.query.teacherId as string;
    const sectionSubjects = await getSectionSubjects(filters);
    res.status(200).json({ data: sectionSubjects });
  } catch (err) { next(err); }
}

// --- Student-Sections (student enrollment) ---
export async function assignStudentController(req: Request, res: Response, next: NextFunction) {
  try {
    const ss = await assignStudentToSection(req.body);
    await logAction({ userId: req.user!.sub, action: 'STUDENT_ASSIGN' as any, entityType: 'StudentSection' as any, entityId: ss.id, details: { studentId: req.body.studentId } as any, context: auditCtx(req) });
    res.status(201).json({ message: 'Student assigned to section.', studentSection: ss });
  } catch (err) { next(err); }
}
export async function getStudentSectionsController(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = paramId(req, 'id');
    // Students can only see their own sections; admins/teachers can see anyone's
    if (req.user!.role === 'STUDENT' && req.user!.sub !== studentId) {
      res.status(403).json({ message: 'You can only view your own sections.' });
      return;
    }
    const sections = await getStudentSections(studentId);
    res.status(200).json({ data: sections });
  } catch (err) { next(err); }
}
export async function getTeacherSectionsController(req: Request, res: Response, next: NextFunction) {
  try {
    const teacherId = paramId(req, 'id');
    if (req.user!.role === 'TEACHER' && req.user!.sub !== teacherId) {
      res.status(403).json({ message: 'You can only view your own sections.' });
      return;
    }
    const sectionSubjects = await getTeacherSectionSubjects(teacherId);
    res.status(200).json({ data: sectionSubjects });
  } catch (err) { next(err); }
}
export async function removeStudentFromSectionController(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = paramId(req, 'id');
    const sectionId = paramId(req, 'sectionId');
    const result = await removeStudentFromSection(studentId, sectionId);
    await logAction({ userId: req.user!.sub, action: 'STUDENT_REMOVE' as any, entityType: 'StudentSection' as any, entityId: result.id, context: auditCtx(req) });
    res.status(200).json({ message: 'Student removed from section.' });
  } catch (err) { next(err); }
}
