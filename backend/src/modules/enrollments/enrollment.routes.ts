// src/modules/enrollments/enrollment.routes.ts
import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware';
import { authorize } from '../../common/middlewares/rbac.middleware';
import { validate } from '../../common/middlewares/validation.middleware';
import {
  enrollUserController,
  bulkEnrollController,
  cancelEnrollmentController,
  getEnrollmentsController,
  getEnrollmentController,
  updateProgressController,
  getStudentDashboardController,
  getTeacherDashboardController,
  getNextContentController,
  createRuleController,
  listRulesController,
  updateRuleController,
  deleteRuleController,
  triggerAutoEnrollmentController,
  enrollmentErrorHandler,
} from './enrollment.controller';
import {
  enrollUserSchema,
  bulkEnrollSchema,
  cancelEnrollmentSchema,
  progressUpdateSchema,
  enrollmentQuerySchema,
  createRuleSchema,
  updateRuleSchema,
  triggerAutoEnrollmentSchema,
} from './enrollment.schemas';

const router = Router();

// All enrollment routes require authentication.
router.use(authenticate);

// ---------------------------------------------------------------------------
// Enrollment endpoints (mounted under /api/v1/enrollments)
// ---------------------------------------------------------------------------

// Self-service routes — registered BEFORE /:enrollmentId so they don't collide.
router.get('/dashboard/student', getStudentDashboardController);
router.get('/dashboard/teacher', authorize('TEACHER', 'ADMIN'), getTeacherDashboardController);
router.get('/next-content', getNextContentController);

// Bulk enroll — admin or teacher (course owner)
router.post(
  '/bulk',
  authorize('ADMIN', 'TEACHER'),
  validate({ body: bulkEnrollSchema }),
  bulkEnrollController,
);

// Single enroll — admin or teacher (course owner)
router.post(
  '/',
  authorize('ADMIN', 'TEACHER'),
  validate({ body: enrollUserSchema }),
  enrollUserController,
);

// List enrollments — role-scoped inside the service
router.get(
  '/',
  validate({ query: enrollmentQuerySchema }),
  getEnrollmentsController,
);

// Get single enrollment — permission checked inside service
router.get('/:enrollmentId', getEnrollmentController);

// Cancel enrollment — admin, course owner, OR the student themselves
router.patch(
  '/:enrollmentId/cancel',
  validate({ body: cancelEnrollmentSchema }),
  cancelEnrollmentController,
);

// Update progress — only the enrolled student themselves
router.post(
  '/:enrollmentId/progress',
  validate({ body: progressUpdateSchema }),
  updateProgressController,
);

// ---------------------------------------------------------------------------
// Auto-enrollment admin routes (mounted under /api/v1/admin/auto-enrollment)
// ---------------------------------------------------------------------------

export const autoEnrollmentRouter = Router();
autoEnrollmentRouter.use(authenticate, authorize('ADMIN'));

autoEnrollmentRouter.post('/rules', validate({ body: createRuleSchema }), createRuleController);
autoEnrollmentRouter.get('/rules', listRulesController);
autoEnrollmentRouter.patch('/rules/:ruleId', validate({ body: updateRuleSchema }), updateRuleController);
autoEnrollmentRouter.delete('/rules/:ruleId', deleteRuleController);
autoEnrollmentRouter.post(
  '/trigger',
  validate({ body: triggerAutoEnrollmentSchema }),
  triggerAutoEnrollmentController,
);

// Service error handler
router.use(enrollmentErrorHandler);
autoEnrollmentRouter.use(enrollmentErrorHandler);

export default router;
