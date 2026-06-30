// src/modules/admin-roles/admin-role.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { createRole, listRoles, updateRole, deleteRole, assignAdminRole, listAdmins, removeAdminRole } from './admin-role.service';

function paramId(req: Request, key: string): string {
  const v = req.params[key];
  return Array.isArray(v) ? v[0] : (v || '');
}

// POST /api/v1/admin/roles
export async function createRoleController(req: Request, res: Response, next: NextFunction) {
  try {
    const role = await createRole(req.body);
    res.status(201).json({ message: 'Admin role created.', role });
  } catch (err) { next(err); }
}

// GET /api/v1/admin/roles
export async function listRolesController(req: Request, res: Response, next: NextFunction) {
  try {
    const roles = await listRoles();
    res.status(200).json({ data: roles });
  } catch (err) { next(err); }
}

// PATCH /api/v1/admin/roles/:id
export async function updateRoleController(req: Request, res: Response, next: NextFunction) {
  try {
    const roleId = paramId(req, 'id');
    const role = await updateRole(roleId, req.body);
    res.status(200).json({ message: 'Admin role updated.', role });
  } catch (err) { next(err); }
}

// DELETE /api/v1/admin/roles/:id
export async function deleteRoleController(req: Request, res: Response, next: NextFunction) {
  try {
    const roleId = paramId(req, 'id');
    await deleteRole(roleId);
    res.status(200).json({ message: 'Admin role deleted.' });
  } catch (err) { next(err); }
}

// POST /api/v1/admin/users/:id/role — assign admin sub-role
export async function assignRoleController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = paramId(req, 'id');
    const { roleId } = req.body;
    const result = await assignAdminRole(userId, roleId);
    res.status(200).json(result);
  } catch (err) { next(err); }
}

// GET /api/v1/admin/admins — list all admin assignments
export async function listAdminsController(req: Request, res: Response, next: NextFunction) {
  try {
    const admins = await listAdmins();
    res.status(200).json({ data: admins });
  } catch (err) { next(err); }
}

// DELETE /api/v1/admin/users/:id/role — remove admin sub-role
export async function removeRoleController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = paramId(req, 'id');
    const result = await removeAdminRole(userId);
    res.status(200).json(result);
  } catch (err) { next(err); }
}
