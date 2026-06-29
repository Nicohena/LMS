// src/modules/audit/audit.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { getAuditLogs, getUserAuditTrail } from './audit.service';
import { exportUserData, requestDeletion } from './data-export.service';
import { logAction } from '../../common/services/audit.service';
import { getClientIp, getUserAgent } from '../../common/services/upload.service';
import { isHttpError } from '../../common/errors';
import type { AuditLogQueryInput } from '../reports/report.schemas';

function paramId(req: Request, key: string): string {
  const v = req.params[key];
  return Array.isArray(v) ? v[0] : v;
}
function auditCtx(req: Request) {
  return { ip: getClientIp(req), userAgent: getUserAgent(req) };
}

export async function getAuditLogsController(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
      ...(req.query.userId ? { userId: String(req.query.userId) } : {}),
      ...(req.query.action ? { action: String(req.query.action) } : {}),
      ...(req.query.entityType ? { entityType: String(req.query.entityType) } : {}),
      ...(req.query.entityId ? { entityId: String(req.query.entityId) } : {}),
      ...(req.query.startDate ? { startDate: String(req.query.startDate) } : {}),
      ...(req.query.endDate ? { endDate: String(req.query.endDate) } : {}),
    } as AuditLogQueryInput;
    const result = await getAuditLogs(filters);
    res.status(200).json(result);
  } catch (err) { next(err); }
}

export async function getUserAuditTrailController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = paramId(req, 'userId');
    const result = await getUserAuditTrail(userId);
    res.status(200).json(result);
  } catch (err) { next(err); }
}

export async function exportUserDataController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = paramId(req, 'userId');
    const data = await exportUserData(userId);
    await logAction({ userId: req.user!.sub, action: 'DATA_EXPORT', entityType: 'User', entityId: userId, context: auditCtx(req) });
    // Return as downloadable JSON
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="user-data-${userId}.json"`);
    res.status(200).json(data);
  } catch (err) { next(err); }
}

export async function requestDeletionController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = paramId(req, 'userId');
    const result = await requestDeletion(userId, req.user!.sub);
    res.status(200).json({ ...result, message: 'Deletion request processed.' });
  } catch (err) { next(err); }
}

export function auditErrorHandler(err: unknown, _req: Request, res: Response, next: NextFunction): void {
  if (isHttpError(err)) { res.status(err.statusCode).json({ message: err.message, code: err.code }); return; }
  next(err);
}
