// src/modules/assignments/assignment-enhanced.routes.ts
//
// Routes for the enhanced assignment operations. Mounted at /assignments
// by the main app (same prefix as the existing assignment.routes.ts).
// All routes require authentication; most require TEACHER role.
//
import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware';
import { authorize } from '../../common/middlewares/rbac.middleware';
import * as ctrl from './assignment-enhanced.controller';

const router = Router();

// Workflow operations (teacher/admin)
router.post('/:assignmentId/publish', authenticate, authorize('TEACHER', 'ADMIN'), ctrl.publishAssignmentController);
router.post('/:assignmentId/schedule', authenticate, authorize('TEACHER', 'ADMIN'), ctrl.scheduleAssignmentController);
router.post('/:assignmentId/close', authenticate, authorize('TEACHER', 'ADMIN'), ctrl.closeAssignmentController);
router.post('/:assignmentId/reopen', authenticate, authorize('TEACHER', 'ADMIN'), ctrl.reopenAssignmentController);
router.post('/:assignmentId/archive', authenticate, authorize('TEACHER', 'ADMIN'), ctrl.archiveAssignmentController);
router.post('/:assignmentId/restore', authenticate, authorize('TEACHER', 'ADMIN'), ctrl.restoreAssignmentController);
router.post('/:assignmentId/duplicate', authenticate, authorize('TEACHER', 'ADMIN'), ctrl.duplicateAssignmentController);

// Bulk grading (teacher/admin)
router.post('/:assignmentId/bulk-grade', authenticate, authorize('TEACHER', 'ADMIN'), ctrl.bulkGradeController);

// Analytics (teacher/admin)
router.get('/:assignmentId/grades/distribution', authenticate, authorize('TEACHER', 'ADMIN'), ctrl.getGradeDistributionController);
router.get('/:assignmentId/submissions/stats', authenticate, authorize('TEACHER', 'ADMIN'), ctrl.getSubmissionStatsController);

// Resources — read is open to authenticated, write is teacher/admin
router.get('/:assignmentId/resources', authenticate, ctrl.getResourcesController);
router.post('/:assignmentId/resources', authenticate, authorize('TEACHER', 'ADMIN'), ctrl.uploadResourceController);
router.delete('/resources/:resourceId', authenticate, authorize('TEACHER', 'ADMIN'), ctrl.deleteResourceController);

// Audit logs (teacher/admin)
router.get('/:assignmentId/audit-logs', authenticate, authorize('TEACHER', 'ADMIN'), ctrl.getAuditLogsController);

// Rubric templates (teacher/admin)
router.post('/rubric-templates', authenticate, authorize('TEACHER', 'ADMIN'), ctrl.createRubricTemplateController);
router.get('/rubric-templates', authenticate, authorize('TEACHER', 'ADMIN'), ctrl.getRubricTemplatesController);
router.get('/rubric-templates/:templateId', authenticate, authorize('TEACHER', 'ADMIN'), ctrl.getRubricTemplateController);
router.patch('/rubric-templates/:templateId', authenticate, authorize('TEACHER', 'ADMIN'), ctrl.updateRubricTemplateController);
router.delete('/rubric-templates/:templateId', authenticate, authorize('TEACHER', 'ADMIN'), ctrl.deleteRubricTemplateController);
router.post('/rubric-templates/:templateId/apply/:assignmentId', authenticate, authorize('TEACHER', 'ADMIN'), ctrl.applyRubricTemplateController);

export default router;
