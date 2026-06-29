// src/common/middlewares/rbac.middleware.ts
import type { Request, Response, NextFunction } from 'express';
import type { Role } from '@prisma/client';

/**
 * Role-based authorization middleware.
 *
 * Usage: router.get('/admin-only', authenticate, authorize('ADMIN'), handler)
 *
 * - Responds 401 if `req.user` is missing (i.e. `authenticate` did not run).
 * - Responds 403 if the user's role is not in the allowed set.
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized: authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        message: `Forbidden: requires one of the following roles: ${allowedRoles.join(', ')}.`,
      });
      return;
    }

    next();
  };
}
