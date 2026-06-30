// src/modules/admin-roles/admin-role.service.ts
import { prisma } from '../../lib/prisma';
import { NotFoundError, ForbiddenError, ValidationError } from '../../common/errors';
import type { AdminPermission } from '@prisma/client';

// Default sub-roles with predefined permissions
const DEFAULT_ROLES = [
  { name: 'Super Admin', description: 'Full access to everything', permissions: ['ALL_ACCESS'], isSystem: true },
  { name: 'User Manager', description: 'Create/delete users, role changes, account recovery', permissions: ['USERS_VIEW', 'USERS_CREATE', 'USERS_DELETE', 'USERS_ROLE_CHANGE'], isSystem: true },
  { name: 'Content Moderator', description: 'Review flagged content, remove violations', permissions: ['CONTENT_MODERATE'], isSystem: true },
  { name: 'Course Quality Manager', description: 'Review course quality, approve featured courses', permissions: ['COURSE_QUALITY_MANAGE'], isSystem: true },
  { name: 'Analytics Viewer', description: 'View reports, generate exports (no changes)', permissions: ['ANALYTICS_VIEW', 'ANALYTICS_EXPORT'], isSystem: true },
  { name: 'Support Admin', description: 'Impersonate users, view error logs, help desk', permissions: ['SUPPORT_IMPERSONATE'], isSystem: true },
  { name: 'System Admin', description: 'Server config, integrations, maintenance mode', permissions: ['SYSTEM_CONFIG', 'SYSTEM_MAINTENANCE'], isSystem: true },
];

// ---------------------------------------------------------------------------
// Seed default roles (called on startup)
// ---------------------------------------------------------------------------

export async function seedDefaultAdminRoles() {
  for (const role of DEFAULT_ROLES) {
    const existing = await prisma.adminRole.findUnique({ where: { name: role.name } });
    if (!existing) {
      await prisma.adminRole.create({
        data: {
          name: role.name,
          description: role.description,
          permissions: role.permissions as AdminPermission[],
          isSystem: role.isSystem,
          isDefault: role.name === 'Super Admin',
        },
      });
      // eslint-disable-next-line no-console
      console.log(`[admin-roles] Seeded: ${role.name}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Get admin role for a user
// ---------------------------------------------------------------------------

export async function getAdminRole(userId: string) {
  const admin = await prisma.admin.findUnique({
    where: { userId },
    include: { role: true },
  });
  return admin?.role ?? null;
}

export async function getUserPermissions(userId: string, userRole: string): Promise<AdminPermission[]> {
  if (userRole !== 'ADMIN') return [];
  const adminRole = await getAdminRole(userId);
  if (adminRole) return adminRole.permissions as AdminPermission[];
  // Default: all access for ADMIN users without a specific sub-role
  return ['ALL_ACCESS'] as AdminPermission[];
}

export async function hasPermission(userId: string, userRole: string, permission: AdminPermission): Promise<boolean> {
  const perms = await getUserPermissions(userId, userRole);
  return perms.includes('ALL_ACCESS' as AdminPermission) || perms.includes(permission);
}

// ---------------------------------------------------------------------------
// CRUD for AdminRole
// ---------------------------------------------------------------------------

export async function createRole(data: { name: string; description?: string; permissions: string[] }) {
  const existing = await prisma.adminRole.findUnique({ where: { name: data.name } });
  if (existing) throw new ValidationError('Role name already exists.');
  return prisma.adminRole.create({
    data: { name: data.name, description: data.description, permissions: data.permissions as AdminPermission[] },
  });
}

export async function listRoles() {
  return prisma.adminRole.findMany({
    orderBy: { createdAt: 'asc' },
    include: { _count: { select: { admins: true } } },
  });
}

export async function updateRole(roleId: string, data: { name?: string; description?: string; permissions?: string[] }) {
  const role = await prisma.adminRole.findUnique({ where: { id: roleId } });
  if (!role) throw new NotFoundError('Admin role not found.');
  if (role.isSystem && data.name && data.name !== role.name) throw new ValidationError('Cannot rename system roles.');
  const updateData: any = {};
  if (data.name) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.permissions) updateData.permissions = data.permissions as AdminPermission[];
  return prisma.adminRole.update({ where: { id: roleId }, data: updateData });
}

export async function deleteRole(roleId: string) {
  const role = await prisma.adminRole.findUnique({ where: { id: roleId } });
  if (!role) throw new NotFoundError('Admin role not found.');
  if (role.isSystem) throw new ValidationError('Cannot delete system roles.');
  const adminCount = await prisma.admin.count({ where: { roleId } });
  if (adminCount > 0) throw new ValidationError(`Cannot delete role with ${adminCount} assigned admin(s).`);
  return prisma.adminRole.delete({ where: { id: roleId } });
}

// ---------------------------------------------------------------------------
// Assign admin role to user
// ---------------------------------------------------------------------------

export async function assignAdminRole(userId: string, roleId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found.');
  if (user.role !== 'ADMIN') throw new ValidationError('User must have ADMIN role first.');
  const role = await prisma.adminRole.findUnique({ where: { id: roleId } });
  if (!role) throw new NotFoundError('Admin role not found.');
  const admin = await prisma.admin.upsert({
    where: { userId },
    update: { roleId },
    create: { userId, roleId },
  });
  // eslint-disable-next-line no-console
  console.log(`[admin-roles] Assigned ${role.name} to user ${userId}`);
  return { message: `Admin role "${role.name}" assigned.`, admin };
}

export async function listAdmins() {
  return prisma.admin.findMany({
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
      role: { select: { id: true, name: true, permissions: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function removeAdminRole(userId: string) {
  await prisma.admin.deleteMany({ where: { userId } });
  return { message: 'Admin sub-role removed. User retains default ADMIN access.' };
}
