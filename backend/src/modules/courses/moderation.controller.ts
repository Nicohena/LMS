// src/modules/courses/moderation.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { getFlaggedContent, moderateFlaggedContent, moderateContent } from './moderation.service';
import { logAction } from '../../common/services/audit.service';
import { getClientIp, getUserAgent } from '../../common/services/upload.service';

function auditCtx(req: Request) {
  return { ip: getClientIp(req), userAgent: getUserAgent(req) };
}

function paramId(req: Request, key: string): string {
  const v = req.params[key];
  return Array.isArray(v) ? v[0] : (v || '');
}

// GET /api/v1/content/flagged — admin reviews flagged content
export async function getFlaggedContentController(req: Request, res: Response, next: NextFunction) {
  try {
    const type = req.query.type as string | undefined;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const result = await getFlaggedContent({ type, page, limit });
    res.status(200).json(result);
  } catch (err) { next(err); }
}

// PATCH /api/v1/content/:id/moderate — admin moderates flagged content
export async function moderateContentController(req: Request, res: Response, next: NextFunction) {
  try {
    const contentId = paramId(req, 'id');
    const adminId = req.user!.sub;
    const { action, notes } = req.body;
    const result = await moderateFlaggedContent(contentId, adminId, action, notes);
    await logAction({
      userId: adminId,
      action: 'CONTENT_MODERATE' as any,
      entityType: 'Content',
      entityId: contentId,
      details: { action, notes },
      context: auditCtx(req),
    });
    res.status(200).json(result);
  } catch (err) { next(err); }
}

// POST /api/v1/content/:id/moderate/run — trigger background moderation manually
export async function runModerationController(req: Request, res: Response, next: NextFunction) {
  try {
    const contentId = paramId(req, 'id');
    const result = await moderateContent(contentId);
    res.status(200).json({ message: 'Moderation complete.', result });
  } catch (err) { next(err); }
}
