// src/modules/audit/audit.routes.ts
import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware';
import { authorize } from '../../common/middlewares/rbac.middleware';
import {
  getAuditLogsController,
  getUserAuditTrailController,
  exportUserDataController,
  requestDeletionController,
  auditErrorHandler,
} from './audit.controller';

const router = Router();

// All audit routes require authentication + admin role
router.use(authenticate, authorize('ADMIN'));

router.get('/logs', getAuditLogsController);
router.get('/users/:userId/trail', getUserAuditTrailController);
router.get('/users/:userId/export', exportUserDataController);
router.post('/users/:userId/delete', requestDeletionController);

router.use(auditErrorHandler);

export default router;
