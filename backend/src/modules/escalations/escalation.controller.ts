// src/modules/escalations/escalation.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { createEscalation, teacherResolve, adminResolve, getEscalations } from './escalation.service';
import { logAction } from '../../common/services/audit.service';
import { getClientIp, getUserAgent } from '../../common/services/upload.service';

function auditCtx(req: Request) {
  return { ip: getClientIp(req), userAgent: getUserAgent(req) };
}

function paramId(req: Request, key: string): string {
  const v = req.params[key];
  return Array.isArray(v) ? v[0] : (v || '');
}

// POST /api/v1/submissions/:id/escalate — student escalates to teacher
export async function escalateSubmissionController(req: Request, res: Response, next: NextFunction) {
  try {
    const submissionId = paramId(req, 'id');
    const userId = req.user!.sub;
    const result = await createEscalation(userId, { submissionId, reason: req.body.reason });
    await logAction({ userId, action: 'USER_UPDATE' as any, entityType: 'Submission', entityId: submissionId, details: { escalation: true }, context: auditCtx(req) });
    res.status(201).json(result);
  } catch (err) { next(err); }
}

// POST /api/v1/quizzes/attempts/:id/escalate-submission — student escalates quiz attempt
export async function escalateAttemptController(req: Request, res: Response, next: NextFunction) {
  try {
    const attemptId = paramId(req, 'id');
    const userId = req.user!.sub;
    const result = await createEscalation(userId, { attemptId, reason: req.body.reason });
    res.status(201).json(result);
  } catch (err) { next(err); }
}

// PATCH /api/v1/escalations/:id/resolve — teacher resolves or forwards
export async function teacherResolveController(req: Request, res: Response, next: NextFunction) {
  try {
    const escalationId = paramId(req, 'id');
    const teacherId = req.user!.sub;
    const result = await teacherResolve(teacherId, escalationId, req.body);
    res.status(200).json(result);
  } catch (err) { next(err); }
}

// PATCH /api/v1/escalations/:id/admin-resolve — admin final resolution
export async function adminResolveController(req: Request, res: Response, next: NextFunction) {
  try {
    const escalationId = paramId(req, 'id');
    const adminId = req.user!.sub;
    const result = await adminResolve(adminId, escalationId, req.body);
    res.status(200).json(result);
  } catch (err) { next(err); }
}

// GET /api/v1/escalations — list escalations (role-based)
// GET /api/v1/admin/escalations — admin views pending escalations
export async function getEscalationsController(req: Request, res: Response, next: NextFunction) {
  try {
    const viewer = { id: req.user!.sub, role: req.user!.role as any };
    const status = req.query.status as string | undefined;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const result = await getEscalations(viewer, { status, page, limit });
    res.status(200).json(result);
  } catch (err) { next(err); }
}
