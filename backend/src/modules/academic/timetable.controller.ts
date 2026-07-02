// src/modules/academic/timetable.controller.ts
import type { Request, Response, NextFunction } from 'express';
import {
  createTimetableEntry, createTimetableBatch,
  getTimetableBySection, getStudentTimetable, getTeacherTimetable,
  deleteTimetableEntry, deleteTimetableBySection,
} from './timetable.service';
import { logAction } from '../../common/services/audit.service';
import { getClientIp, getUserAgent } from '../../common/services/upload.service';

function auditCtx(req: Request) { return { ip: getClientIp(req), userAgent: getUserAgent(req) }; }
function paramId(req: Request, key: string): string { const v = req.params[key]; return Array.isArray(v) ? v[0] : (v || ''); }

export async function createTimetableEntryController(req: Request, res: Response, next: NextFunction) {
  try {
    const entry = await createTimetableEntry(req.body);
    await logAction({ userId: req.user!.sub, action: 'TIMETABLE_CREATE' as any, entityType: 'Timetable' as any, entityId: entry.id, context: auditCtx(req) });
    res.status(201).json({ message: 'Timetable entry created.', entry });
  } catch (err) { next(err); }
}

export async function createTimetableBatchController(req: Request, res: Response, next: NextFunction) {
  try {
    const entries = await createTimetableBatch(req.body);
    await logAction({ userId: req.user!.sub, action: 'TIMETABLE_BATCH_CREATE' as any, entityType: 'Timetable' as any, entityId: req.body.sectionId, context: auditCtx(req) });
    res.status(201).json({ message: 'Timetable created.', count: entries.length, entries });
  } catch (err) { next(err); }
}

export async function getTimetableBySectionController(req: Request, res: Response, next: NextFunction) {
  try {
    const sectionId = paramId(req, 'sectionId');
    const result = await getTimetableBySection(sectionId);
    res.status(200).json(result);
  } catch (err) { next(err); }
}

export async function getStudentTimetableController(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = req.user!.sub;
    const result = await getStudentTimetable(studentId);
    res.status(200).json(result);
  } catch (err) { next(err); }
}

export async function getTeacherTimetableController(req: Request, res: Response, next: NextFunction) {
  try {
    const teacherId = req.user!.sub;
    const result = await getTeacherTimetable(teacherId);
    res.status(200).json(result);
  } catch (err) { next(err); }
}

export async function deleteTimetableEntryController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req, 'id');
    await deleteTimetableEntry(id);
    await logAction({ userId: req.user!.sub, action: 'TIMETABLE_DELETE' as any, entityType: 'Timetable' as any, entityId: id, context: auditCtx(req) });
    res.status(200).json({ message: 'Entry deleted.' });
  } catch (err) { next(err); }
}

export async function deleteTimetableBySectionController(req: Request, res: Response, next: NextFunction) {
  try {
    const sectionId = paramId(req, 'sectionId');
    await deleteTimetableBySection(sectionId);
    await logAction({ userId: req.user!.sub, action: 'TIMETABLE_CLEAR' as any, entityType: 'Timetable' as any, entityId: sectionId, context: auditCtx(req) });
    res.status(200).json({ message: 'Timetable cleared.' });
  } catch (err) { next(err); }
}
