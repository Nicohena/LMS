// src/common/middlewares/admin-permission.middleware.ts
import type { Request, Response, NextFunction } from 'express';
import { getUserPermissions } from '../../modules/admin-roles/admin-role.service';
import type { AdminPermission } from '@prisma/client';

/**
 * Middleware that checks if the authenticated admin user has a specific permission.
 * Must be used AFTER `authenticate` and `authorize('ADMIN')` middleware.
 *
 * Usage: router.get('/sensitive', authenticate, authorize('ADMIN'), requireAdminPermission('USERS_DELETE'), handler)
 */
export function requireAdminPermission(permission: AdminPermission) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.sub;
      const userRole = req.user!.role;

      const perms = await getUserPermissions(userId, userRole);

      // ALL_ACCESS bypasses all permission checks
      if (perms.includes('ALL_ACCESS' as AdminPermission)) {
        next();
        return;
      }

      if (!perms.includes(permission)) {
        res.status(403).json({
          message: `Forbidden: requires admin permission "${permission}".`,
          code: 'INSUFFICIENT_PERMISSION',
          requiredPermission: permission,
          yourPermissions: perms,
        });
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
