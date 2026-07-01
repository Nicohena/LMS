// src/modules/academic/section-content.controller.ts
import type { Request, Response, NextFunction } from 'express';
import {
  createSectionContent, getSectionContents, getSectionContentById,
  updateSectionContent, deleteSectionContent,
  createSectionQuiz, getSectionQuizzes,
  createSectionAssignment, getSectionAssignments,
} from './section-content.service';
import { logAction } from '../../common/services/audit.service';
import { getClientIp, getUserAgent } from '../../common/services/upload.service';

function auditCtx(req: Request) { return { ip: getClientIp(req), userAgent: getUserAgent(req) }; }
function paramId(req: Request, key: string): string { const v = req.params[key]; return Array.isArray(v) ? v[0] : (v || ''); }

// --- Section Content ---
export async function createSectionContentController(req: Request, res: Response, next: NextFunction) {
  try {
    const content = await createSectionContent(req.user!.sub, req.body);
    await logAction({ userId: req.user!.sub, action: 'SECTION_CONTENT_CREATE' as any, entityType: 'SectionContent' as any, entityId: content.id, context: auditCtx(req) });
    res.status(201).json({ message: 'Content created.', content });
  } catch (err) { next(err); }
}
export async function getSectionContentsController(req: Request, res: Response, next: NextFunction) {
  try {
    const filters: any = {};
    if (req.query.sectionSubjectId) filters.sectionSubjectId = req.query.sectionSubjectId as string;
    const role = req.user!.role;
    if (role === 'STUDENT') filters.studentId = req.user!.sub;
    else if (role === 'TEACHER') filters.teacherId = req.user!.sub;
    else if (role === 'ADMIN') filters.isAdmin = true;
    const contents = await getSectionContents(filters);
    res.status(200).json({ data: contents });
  } catch (err) { next(err); }
}
export async function getSectionContentByIdController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req, 'id');
    const content = await getSectionContentById(id, { id: req.user!.sub, role: req.user!.role });
    res.status(200).json({ content });
  } catch (err) { next(err); }
}
export async function updateSectionContentController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req, 'id');
    const content = await updateSectionContent(id, req.user!.sub, req.body);
    await logAction({ userId: req.user!.sub, action: 'SECTION_CONTENT_UPDATE' as any, entityType: 'SectionContent' as any, entityId: id, context: auditCtx(req) });
    res.status(200).json({ message: 'Content updated.', content });
  } catch (err) { next(err); }
}
export async function deleteSectionContentController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req, 'id');
    await deleteSectionContent(id, req.user!.sub);
    await logAction({ userId: req.user!.sub, action: 'SECTION_CONTENT_DELETE' as any, entityType: 'SectionContent' as any, entityId: id, context: auditCtx(req) });
    res.status(200).json({ message: 'Content deleted.' });
  } catch (err) { next(err); }
}

// --- Section Quizzes ---
export async function createSectionQuizController(req: Request, res: Response, next: NextFunction) {
  try {
    const quiz = await createSectionQuiz(req.user!.sub, req.body);
    await logAction({ userId: req.user!.sub, action: 'SECTION_QUIZ_CREATE' as any, entityType: 'SectionQuiz' as any, entityId: quiz.id, context: auditCtx(req) });
    res.status(201).json({ message: 'Quiz created.', quiz });
  } catch (err) { next(err); }
}
export async function getSectionQuizzesController(req: Request, res: Response, next: NextFunction) {
  try {
    const filters: any = {};
    if (req.query.sectionSubjectId) filters.sectionSubjectId = req.query.sectionSubjectId as string;
    const role = req.user!.role;
    if (role === 'STUDENT') filters.studentId = req.user!.sub;
    else if (role === 'TEACHER') filters.teacherId = req.user!.sub;
    else if (role === 'ADMIN') filters.isAdmin = true;
    const quizzes = await getSectionQuizzes(filters);
    res.status(200).json({ data: quizzes });
  } catch (err) { next(err); }
}

// --- Section Assignments ---
export async function createSectionAssignmentController(req: Request, res: Response, next: NextFunction) {
  try {
    const assignment = await createSectionAssignment(req.user!.sub, req.body);
    await logAction({ userId: req.user!.sub, action: 'SECTION_ASSIGNMENT_CREATE' as any, entityType: 'SectionAssignment' as any, entityId: assignment.id, context: auditCtx(req) });
    res.status(201).json({ message: 'Assignment created.', assignment });
  } catch (err) { next(err); }
}
export async function getSectionAssignmentsController(req: Request, res: Response, next: NextFunction) {
  try {
    const filters: any = {};
    if (req.query.sectionSubjectId) filters.sectionSubjectId = req.query.sectionSubjectId as string;
    const role = req.user!.role;
    if (role === 'STUDENT') filters.studentId = req.user!.sub;
    else if (role === 'TEACHER') filters.teacherId = req.user!.sub;
    else if (role === 'ADMIN') filters.isAdmin = true;
    const assignments = await getSectionAssignments(filters);
    res.status(200).json({ data: assignments });
  } catch (err) { next(err); }
}
