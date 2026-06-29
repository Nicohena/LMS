// src/modules/settings/setting.routes.ts
import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware';
import { authorize } from '../../common/middlewares/rbac.middleware';
import { validate } from '../../common/middlewares/validation.middleware';
import {
  // Settings
  getSettingsController, getSettingController, updateSettingController, batchUpdateSettingsController,
  // Email templates
  listTemplatesController, getTemplateController, createTemplateController, updateTemplateController,
  // Grading scales
  createScaleController, listScalesController, getScaleController, getDefaultScaleController,
  updateScaleController, deleteScaleController, convertScoreController,
  // Academic years
  createYearController, listYearsController, getYearController, getCurrentYearController,
  updateYearController, deleteYearController, setCurrentYearController,
  // Health
  healthCheckController, systemInfoController,
  // Maintenance
  enableMaintenanceController, disableMaintenanceController, maintenanceStatusController,
  // Error handler
  settingErrorHandler,
} from './setting.controller';
import {
  updateSettingSchema, batchUpdateSettingsSchema,
  emailTemplateSchema, updateEmailTemplateSchema,
  gradingScaleSchema, updateGradingScaleSchema,
  academicYearSchema, updateAcademicYearSchema,
  enableMaintenanceSchema,
} from './setting.schemas';

// ---------------------------------------------------------------------------
// Settings router (/api/v1/settings) — admin only
// ---------------------------------------------------------------------------

export const settingRouter = Router();
settingRouter.use(authenticate, authorize('ADMIN'));

settingRouter.get('/', getSettingsController);
settingRouter.get('/single', getSettingController);
settingRouter.patch('/', validate({ body: updateSettingSchema }), updateSettingController);
settingRouter.patch('/batch', validate({ body: batchUpdateSettingsSchema }), batchUpdateSettingsController);

settingRouter.use(settingErrorHandler);

// ---------------------------------------------------------------------------
// Email templates router (/api/v1/email-templates) — admin only
// ---------------------------------------------------------------------------

export const emailTemplateRouter = Router();
emailTemplateRouter.use(authenticate, authorize('ADMIN'));

emailTemplateRouter.get('/', listTemplatesController);
emailTemplateRouter.get('/:type', getTemplateController);
emailTemplateRouter.get('/:type/render', getTemplateController);
emailTemplateRouter.post('/', validate({ body: emailTemplateSchema }), createTemplateController);
emailTemplateRouter.patch('/:type', validate({ body: updateEmailTemplateSchema }), updateTemplateController);

emailTemplateRouter.use(settingErrorHandler);

// ---------------------------------------------------------------------------
// Grading scales router (/api/v1/grading-scales)
// ---------------------------------------------------------------------------

export const gradingScaleRouter = Router();

// Public routes (no auth)
gradingScaleRouter.get('/default', getDefaultScaleController);
gradingScaleRouter.get('/convert', convertScoreController);

// Admin-only routes
gradingScaleRouter.use(authenticate, authorize('ADMIN'));
gradingScaleRouter.get('/', listScalesController);
gradingScaleRouter.get('/:id', getScaleController);
gradingScaleRouter.post('/', validate({ body: gradingScaleSchema }), createScaleController);
gradingScaleRouter.patch('/:id', validate({ body: updateGradingScaleSchema }), updateScaleController);
gradingScaleRouter.delete('/:id', deleteScaleController);

gradingScaleRouter.use(settingErrorHandler);

// ---------------------------------------------------------------------------
// Academic years router (/api/v1/academic-years) — admin only
// ---------------------------------------------------------------------------

export const academicYearRouter = Router();
academicYearRouter.use(authenticate, authorize('ADMIN'));

academicYearRouter.get('/', listYearsController);
academicYearRouter.get('/current', getCurrentYearController);
academicYearRouter.get('/:id', getYearController);
academicYearRouter.post('/', validate({ body: academicYearSchema }), createYearController);
academicYearRouter.patch('/:id', validate({ body: updateAcademicYearSchema }), updateYearController);
academicYearRouter.delete('/:id', deleteYearController);
academicYearRouter.post('/:id/set-current', setCurrentYearController);

academicYearRouter.use(settingErrorHandler);

// ---------------------------------------------------------------------------
// Health router (/api/v1/health) — public health check, admin system info
// ---------------------------------------------------------------------------

export const healthRouter = Router();

// Public health check (no auth)
healthRouter.get('/', healthCheckController);

// Admin-only system info
healthRouter.get('/system', authenticate, authorize('ADMIN'), systemInfoController);

// ---------------------------------------------------------------------------
// Maintenance router (/api/v1/maintenance)
// ---------------------------------------------------------------------------

export const maintenanceRouter = Router();

// Public status check (no auth)
maintenanceRouter.get('/status', maintenanceStatusController);

// Admin-only enable/disable
maintenanceRouter.use(authenticate, authorize('ADMIN'));
maintenanceRouter.post('/enable', validate({ body: enableMaintenanceSchema }), enableMaintenanceController);
maintenanceRouter.post('/disable', disableMaintenanceController);

maintenanceRouter.use(settingErrorHandler);
