// src/modules/reports/report.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { getPlatformStats, getTeacherStats, getStudentStats, getCourseAnalytics } from './analytics.service';
import {
  createTemplate, getTemplates, getTemplate, updateTemplate, deleteTemplate,
  generateReport, previewReport,
} from './report-builder.service';
import {
  createSchedule, getSchedules, updateSchedule, deleteSchedule, triggerScheduleNow,
} from './scheduled-report.service';
import { logAction } from '../../common/services/audit.service';
import { getClientIp, getUserAgent } from '../../common/services/upload.service';
import { isHttpError } from '../../common/errors';
import type { GenerateReportInput } from './report.schemas';

function paramId(req: Request, key: string): string {
  const v = req.params[key];
  return Array.isArray(v) ? v[0] : v;
}
function auditCtx(req: Request) {
  return { ip: getClientIp(req), userAgent: getUserAgent(req) };
}

// ---------------------------------------------------------------------------
// Dashboards
// ---------------------------------------------------------------------------

export async function getPlatformDashboardController(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await getPlatformStats();
    res.status(200).json({ stats });
  } catch (err) { next(err); }
}

export async function getTeacherDashboardController(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await getTeacherStats(req.user!.sub);
    res.status(200).json({ stats });
  } catch (err) { next(err); }
}

export async function getStudentDashboardController(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await getStudentStats(req.user!.sub);
    res.status(200).json({ stats });
  } catch (err) { next(err); }
}

export async function getCourseDashboardController(req: Request, res: Response, next: NextFunction) {
  try {
    const courseId = paramId(req, 'courseId');
    const stats = await getCourseAnalytics(courseId);
    res.status(200).json({ stats });
  } catch (err) { next(err); }
}

// ---------------------------------------------------------------------------
// Report templates
// ---------------------------------------------------------------------------

export async function createTemplateController(req: Request, res: Response, next: NextFunction) {
  try {
    const template = await createTemplate(req.user!.sub, req.body);
    await logAction({ userId: req.user!.sub, action: 'REPORT_TEMPLATE_CREATE', entityType: 'ReportTemplate', entityId: template.id, context: auditCtx(req) });
    res.status(201).json({ message: 'Template created.', template });
  } catch (err) { next(err); }
}

export async function getTemplatesController(req: Request, res: Response, next: NextFunction) {
  try {
    const templates = await getTemplates(req.user!.sub, req.user!.role);
    res.status(200).json({ templates });
  } catch (err) { next(err); }
}

export async function getTemplateController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req, 'templateId');
    const template = await getTemplate(id, req.user!.sub, req.user!.role);
    res.status(200).json({ template });
  } catch (err) { next(err); }
}

export async function updateTemplateController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req, 'templateId');
    const template = await updateTemplate(id, req.user!.sub, req.user!.role, req.body);
    await logAction({ userId: req.user!.sub, action: 'REPORT_TEMPLATE_UPDATE', entityType: 'ReportTemplate', entityId: id, context: auditCtx(req) });
    res.status(200).json({ message: 'Template updated.', template });
  } catch (err) { next(err); }
}

export async function deleteTemplateController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req, 'templateId');
    const result = await deleteTemplate(id, req.user!.sub, req.user!.role);
    await logAction({ userId: req.user!.sub, action: 'REPORT_TEMPLATE_DELETE', entityType: 'ReportTemplate', entityId: id, context: auditCtx(req) });
    res.status(200).json({ message: 'Template deleted.', ...result });
  } catch (err) { next(err); }
}

// ---------------------------------------------------------------------------
// Generate / preview
// ---------------------------------------------------------------------------

export async function generateReportController(req: Request, res: Response, next: NextFunction) {
  try {
    const templateId = paramId(req, 'templateId');
    const body = req.body as GenerateReportInput;
    const result = await generateReport(templateId, req.user!.sub, req.user!.role, body.filters, body.format);
    await logAction({ userId: req.user!.sub, action: 'REPORT_GENERATE', entityType: 'ReportTemplate', entityId: templateId, details: { format: body.format, rowCount: result.rowCount } as any, context: auditCtx(req) });
    res.status(200).json({ message: 'Report generated.', ...result });
  } catch (err) { next(err); }
}

export async function previewReportController(req: Request, res: Response, next: NextFunction) {
  try {
    const templateId = paramId(req, 'templateId');
    const filters = req.query.filters ? JSON.parse(req.query.filters as string) : undefined;
    const data = await previewReport(templateId, req.user!.sub, req.user!.role, filters);
    res.status(200).json({ data });
  } catch (err) { next(err); }
}

// ---------------------------------------------------------------------------
// Schedules
// ---------------------------------------------------------------------------

export async function createScheduleController(req: Request, res: Response, next: NextFunction) {
  try {
    const schedule = await createSchedule(req.user!.sub, req.user!.role, req.body);
    await logAction({ userId: req.user!.sub, action: 'REPORT_SCHEDULE_CREATE', entityType: 'ScheduledReport', entityId: schedule.id, context: auditCtx(req) });
    res.status(201).json({ message: 'Schedule created.', schedule });
  } catch (err) { next(err); }
}

export async function getSchedulesController(req: Request, res: Response, next: NextFunction) {
  try {
    const schedules = await getSchedules(req.user!.sub, req.user!.role);
    res.status(200).json({ schedules });
  } catch (err) { next(err); }
}

export async function updateScheduleController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req, 'scheduleId');
    const schedule = await updateSchedule(id, req.user!.sub, req.user!.role, req.body);
    res.status(200).json({ message: 'Schedule updated.', schedule });
  } catch (err) { next(err); }
}

export async function deleteScheduleController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req, 'scheduleId');
    const result = await deleteSchedule(id, req.user!.role);
    res.status(200).json({ message: 'Schedule deleted.', ...result });
  } catch (err) { next(err); }
}

export async function triggerScheduleController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req, 'scheduleId');
    const result = await triggerScheduleNow(id, req.user!.sub, req.user!.role);
    await logAction({ userId: req.user!.sub, action: 'REPORT_SCHEDULE_TRIGGER', entityType: 'ScheduledReport', entityId: id, context: auditCtx(req) });
    res.status(200).json({ message: 'Report triggered.', ...result });
  } catch (err) { next(err); }
}

// ---------------------------------------------------------------------------
// Error handler
// ---------------------------------------------------------------------------

export function reportErrorHandler(err: unknown, _req: Request, res: Response, next: NextFunction): void {
  if (isHttpError(err)) { res.status(err.statusCode).json({ message: err.message, code: err.code }); return; }
  next(err);
}
