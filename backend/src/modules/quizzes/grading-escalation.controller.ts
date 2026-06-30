// src/modules/quizzes/grading-escalation.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { adminOverrideGrade, escalateGrade, getDisputes, resolveDispute } from './grading-escalation.service';
import { logAction } from '../../common/services/audit.service';
import { getClientIp, getUserAgent } from '../../common/services/upload.service';

function auditCtx(req: Request) {
  return { ip: getClientIp(req), userAgent: getUserAgent(req) };
}

function paramId(req: Request, key: string): string {
  const v = req.params[key];
  return Array.isArray(v) ? v[0] : (v || '');
}

// PATCH /api/v1/quizzes/attempts/:attemptId/admin-grade
export async function adminGradeController(req: Request, res: Response, next: NextFunction) {
  try {
    const attemptId = paramId(req, 'attemptId');
    const adminId = req.user!.sub;
    const result = await adminOverrideGrade(adminId, attemptId, req.body);
    await logAction({ userId: adminId, action: 'QUIZ_ATTEMPT_SUBMIT' as any, entityType: 'QuizAttempt', entityId: attemptId, details: { override: true, newScore: req.body.newScore, reason: req.body.reason }, context: auditCtx(req) });
    res.status(200).json(result);
  } catch (err) { next(err); }
}

// POST /api/v1/quizzes/attempts/:attemptId/escalate
export async function escalateGradeController(req: Request, res: Response, next: NextFunction) {
  try {
    const attemptId = paramId(req, 'attemptId');
    const userId = req.user!.sub;
    const { reason } = req.body;
    const result = await escalateGrade(userId, attemptId, reason);
    res.status(201).json(result);
  } catch (err) { next(err); }
}

// GET /api/v1/quizzes/disputes
export async function getDisputesController(req: Request, res: Response, next: NextFunction) {
  try {
    const viewer = { id: req.user!.sub, role: req.user!.role as any };
    const status = req.query.status as string | undefined;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const result = await getDisputes(viewer, { status, page, limit });
    res.status(200).json(result);
  } catch (err) { next(err); }
}

// PATCH /api/v1/quizzes/disputes/:disputeId/resolve
export async function resolveDisputeController(req: Request, res: Response, next: NextFunction) {
  try {
    const disputeId = paramId(req, 'disputeId');
    const resolverId = req.user!.sub;
    const role = req.user!.role as any;
    const result = await resolveDispute(resolverId, role, disputeId, req.body);
    res.status(200).json(result);
  } catch (err) { next(err); }
}
