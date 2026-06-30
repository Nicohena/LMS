// src/modules/users/invite.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { generateInviteCode, getInviteCodes, registerWithInvite, teacherCreateStudent, changeUserRole } from './invite.service';
import { logAction } from '../../common/services/audit.service';
import { getClientIp, getUserAgent } from '../../common/services/upload.service';

function auditCtx(req: Request) {
  return { ip: getClientIp(req), userAgent: getUserAgent(req) };
}

function paramId(req: Request, key: string): string {
  const v = req.params[key];
  return Array.isArray(v) ? v[0] : (v || '');
}

// POST /api/v1/admin/invites/generate
export async function generateInviteController(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.sub;
    const { role, expiresAt, count } = req.body;
    const result = await generateInviteCode(adminId, {
      role,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      count,
    });
    await logAction({ userId: adminId, action: 'USER_CREATE' as any, entityType: 'User', entityId: result.codes[0]?.id ?? '', details: { role, count: count ?? 1 }, context: auditCtx(req) });
    res.status(201).json({ message: 'Invite code(s) generated.', codes: result.codes });
  } catch (err) { next(err); }
}

// GET /api/v1/admin/invites
export async function getInvitesController(req: Request, res: Response, next: NextFunction) {
  try {
    const isUsed = req.query.isUsed === 'true' ? true : req.query.isUsed === 'false' ? false : undefined;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const result = await getInviteCodes({ isUsed, page, limit });
    res.status(200).json(result);
  } catch (err) { next(err); }
}

// POST /api/v1/auth/register-with-invite
export async function registerWithInviteController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await registerWithInvite(req.body);
    res.status(201).json({
      message: 'Registration successful.',
      user: result.user,
    });
  } catch (err) { next(err); }
}

// POST /api/v1/students — teacher creates student account
export async function teacherCreateStudentController(req: Request, res: Response, next: NextFunction) {
  try {
    const teacherId = req.user!.sub;
    const result = await teacherCreateStudent(teacherId, req.body);
    await logAction({ userId: teacherId, action: 'USER_CREATE' as any, entityType: 'User', entityId: result.user.id, details: { email: result.user.email, role: 'STUDENT' }, context: auditCtx(req) });
    res.status(201).json({ message: 'Student account created.', ...result });
  } catch (err) { next(err); }
}

// PATCH /api/v1/users/:id/role — admin changes role
export async function changeUserRoleController(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.sub;
    const userId = paramId(req, 'id');
    const { role } = req.body;
    const result = await changeUserRole(adminId, userId, role);
    await logAction({ userId: adminId, action: 'USER_UPDATE' as any, entityType: 'User', entityId: userId, details: { role }, context: auditCtx(req) });
    res.status(200).json({ message: 'Role updated successfully.', user: result.user });
  } catch (err) { next(err); }
}
