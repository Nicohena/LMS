// src/modules/reports/report.routes.ts
import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware';
import { authorize } from '../../common/middlewares/rbac.middleware';
import { validate } from '../../common/middlewares/validation.middleware';
import {
  getPlatformDashboardController,
  getTeacherDashboardController,
  getStudentDashboardController,
  getCourseDashboardController,
  createTemplateController,
  getTemplatesController,
  getTemplateController,
  updateTemplateController,
  deleteTemplateController,
  generateReportController,
  previewReportController,
  createScheduleController,
  getSchedulesController,
  updateScheduleController,
  deleteScheduleController,
  triggerScheduleController,
  reportErrorHandler,
} from './report.controller';
import {
  reportTemplateSchema,
  updateReportTemplateSchema,
  scheduleReportSchema,
  updateScheduleSchema,
  generateReportSchema,
} from './report.schemas';

// ---------------------------------------------------------------------------
// Dashboards router (/api/v1/dashboards)
// ---------------------------------------------------------------------------

export const dashboardRouter = Router();
dashboardRouter.use(authenticate);

dashboardRouter.get('/platform', authorize('ADMIN'), getPlatformDashboardController);
dashboardRouter.get('/teacher', authorize('TEACHER', 'ADMIN'), getTeacherDashboardController);
dashboardRouter.get('/student', getStudentDashboardController);
dashboardRouter.get('/courses/:courseId', authorize('ADMIN', 'TEACHER'), getCourseDashboardController);

dashboardRouter.use(reportErrorHandler);

// ---------------------------------------------------------------------------
// Reports router (/api/v1/reports)
// ---------------------------------------------------------------------------

export const reportRouter = Router();
reportRouter.use(authenticate);

// Templates
reportRouter.post('/templates', validate({ body: reportTemplateSchema }), createTemplateController);
reportRouter.get('/templates', getTemplatesController);
reportRouter.get('/templates/:templateId', getTemplateController);
reportRouter.patch('/templates/:templateId', validate({ body: updateReportTemplateSchema }), updateTemplateController);
reportRouter.delete('/templates/:templateId', deleteTemplateController);

// Generate / preview
reportRouter.post('/generate/:templateId', validate({ body: generateReportSchema }), generateReportController);
reportRouter.get('/preview/:templateId', previewReportController);

reportRouter.use(reportErrorHandler);

// ---------------------------------------------------------------------------
// Schedules router (/api/v1/schedules)
// ---------------------------------------------------------------------------

export const scheduleRouter = Router();
scheduleRouter.use(authenticate, authorize('ADMIN'));

scheduleRouter.post('/', validate({ body: scheduleReportSchema }), createScheduleController);
scheduleRouter.get('/', getSchedulesController);
scheduleRouter.patch('/:scheduleId', validate({ body: updateScheduleSchema }), updateScheduleController);
scheduleRouter.delete('/:scheduleId', deleteScheduleController);
scheduleRouter.post('/:scheduleId/trigger', triggerScheduleController);

scheduleRouter.use(reportErrorHandler);

export default reportRouter;
