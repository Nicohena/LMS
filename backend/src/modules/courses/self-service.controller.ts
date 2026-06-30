// src/modules/courses/self-service.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { publishCourse, archiveCourse, overrideCourse, selfEnroll, checkCourseSlotLimit } from './self-service.service';
import { logAction } from '../../common/services/audit.service';
import { getClientIp, getUserAgent } from '../../common/services/upload.service';

function paramId(req: Request, key: string): string {
  const v = req.params[key];
  return Array.isArray(v) ? v[0] : (v || '');
}

function auditCtx(req: Request) {
  return { ip: getClientIp(req), userAgent: getUserAgent(req) };
}

export async function publishCourseController(req: Request, res: Response, next: NextFunction) {
  try {
    const courseId = paramId(req, 'id');
    const userId = req.user!.sub;
    const role = req.user!.role;
    const result = await publishCourse(courseId, userId, role as any);
    await logAction({ userId, action: 'COURSE_PUBLISH', entityType: 'Course', entityId: courseId, context: auditCtx(req) });
    res.status(200).json(result);
  } catch (err) { next(err); }
}

export async function archiveCourseController(req: Request, res: Response, next: NextFunction) {
  try {
    const courseId = paramId(req, 'id');
    const userId = req.user!.sub;
    const role = req.user!.role;
    const result = await archiveCourse(courseId, userId, role as any);
    await logAction({ userId, action: 'COURSE_ARCHIVE', entityType: 'Course', entityId: courseId, context: auditCtx(req) });
    res.status(200).json(result);
  } catch (err) { next(err); }
}

export async function overrideCourseController(req: Request, res: Response, next: NextFunction) {
  try {
    const courseId = paramId(req, 'id');
    const userId = req.user!.sub;
    const role = req.user!.role;
    const result = await overrideCourse(courseId, userId, role as any, req.body);
    await logAction({ userId, action: 'COURSE_OVERRIDE', entityType: 'Course', entityId: courseId, details: req.body, context: auditCtx(req) });
    res.status(200).json(result);
  } catch (err) { next(err); }
}

export async function selfEnrollController(req: Request, res: Response, next: NextFunction) {
  try {
    const courseId = paramId(req, 'courseId');
    const userId = req.user!.sub;
    const result = await selfEnroll(courseId, userId);
    await logAction({ userId, action: 'SELF_ENROLL', entityType: 'Enrollment', entityId: result.enrollment.id, details: { courseId }, context: auditCtx(req) });
    res.status(201).json(result);
  } catch (err) { next(err); }
}

export async function checkSlotLimitController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;
    await checkCourseSlotLimit(userId);
    res.status(200).json({ message: 'Slot limit OK.' });
  } catch (err) { next(err); }
}
