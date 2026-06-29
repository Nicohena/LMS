// src/modules/settings/setting.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { EmailTemplateType } from '@prisma/client';
import { getSettings, getSetting, updateSetting, batchUpdateSettings } from './setting.service';
import { listTemplates, getTemplate, createTemplate, updateTemplate, renderTemplate } from './email-template.service';
import { createScale, getScales, getScale, updateScale, deleteScale, getDefaultScale, convertScore } from './grading.service';
import { createYear, getYears, getYear, updateYear, deleteYear, setCurrentYear, getCurrentYear } from './academic-year.service';
import { checkHealth, getSystemInfo } from './health.service';
import { enableMaintenance, disableMaintenance, getMaintenanceStatus } from './maintenance.service';
import { logAction } from '../../common/services/audit.service';
import { getClientIp, getUserAgent } from '../../common/services/upload.service';
import { isHttpError } from '../../common/errors';

function paramId(req: Request, key: string): string {
  const v = req.params[key];
  return Array.isArray(v) ? v[0] : v;
}
function auditCtx(req: Request) {
  return { ip: getClientIp(req), userAgent: getUserAgent(req) };
}

// ---------------------------------------------------------------------------
// Platform settings
// ---------------------------------------------------------------------------

export async function getSettingsController(req: Request, res: Response, next: NextFunction) {
  try {
    const category = req.query.category as string | undefined;
    const settings = await getSettings(category);
    res.status(200).json({ settings });
  } catch (err) { next(err); }
}

export async function getSettingController(req: Request, res: Response, next: NextFunction) {
  try {
    const key = req.query.key as string;
    if (!key) { res.status(400).json({ message: 'key query parameter is required.' }); return; }
    const value = await getSetting(key);
    res.status(200).json({ key, value });
  } catch (err) { next(err); }
}

export async function updateSettingController(req: Request, res: Response, next: NextFunction) {
  try {
    const { key, value, category, description } = req.body;
    const setting = await updateSetting(key, value, req.user!.sub, category, description);
    await logAction({ userId: req.user!.sub, action: 'PLATFORM_SETTING_UPDATE', entityType: 'PlatformSetting', entityId: setting.id, details: { key, value } as any, context: auditCtx(req) });
    res.status(200).json({ message: 'Setting updated.', setting });
  } catch (err) { next(err); }
}

export async function batchUpdateSettingsController(req: Request, res: Response, next: NextFunction) {
  try {
    const count = await batchUpdateSettings(req.body.settings, req.user!.sub);
    res.status(200).json({ message: `${count} settings updated.` });
  } catch (err) { next(err); }
}

// ---------------------------------------------------------------------------
// Email templates
// ---------------------------------------------------------------------------

export async function listTemplatesController(_req: Request, res: Response, next: NextFunction) {
  try {
    const templates = await listTemplates();
    res.status(200).json({ templates });
  } catch (err) { next(err); }
}

export async function getTemplateController(req: Request, res: Response, next: NextFunction) {
  try {
    const type = paramId(req, 'type') as EmailTemplateType;
    const template = await getTemplate(type);
    if (!template) { res.status(404).json({ message: 'Template not found.' }); return; }

    // If /render endpoint, render with query params
    if (req.path.endsWith('/render')) {
      const data = req.query as Record<string, unknown>;
      const rendered = renderTemplate(template, data);
      res.status(200).json({ rendered });
      return;
    }

    res.status(200).json({ template });
  } catch (err) { next(err); }
}

export async function createTemplateController(req: Request, res: Response, next: NextFunction) {
  try {
    const template = await createTemplate(req.body, req.user!.sub);
    res.status(201).json({ message: 'Template created.', template });
  } catch (err) { next(err); }
}

export async function updateTemplateController(req: Request, res: Response, next: NextFunction) {
  try {
    const type = paramId(req, 'type') as EmailTemplateType;
    const template = await updateTemplate(type, req.body, req.user!.sub);
    res.status(200).json({ message: 'Template updated.', template });
  } catch (err) { next(err); }
}

// ---------------------------------------------------------------------------
// Grading scales
// ---------------------------------------------------------------------------

export async function createScaleController(req: Request, res: Response, next: NextFunction) {
  try {
    const scale = await createScale(req.body, req.user!.sub);
    res.status(201).json({ message: 'Grading scale created.', scale });
  } catch (err) { next(err); }
}

export async function listScalesController(_req: Request, res: Response, next: NextFunction) {
  try {
    const scales = await getScales();
    res.status(200).json({ scales });
  } catch (err) { next(err); }
}

export async function getScaleController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req, 'id');
    const scale = await getScale(id);
    res.status(200).json({ scale });
  } catch (err) { next(err); }
}

export async function getDefaultScaleController(_req: Request, res: Response, next: NextFunction) {
  try {
    const scale = await getDefaultScale();
    res.status(200).json({ scale });
  } catch (err) { next(err); }
}

export async function updateScaleController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req, 'id');
    const scale = await updateScale(id, req.body, req.user!.sub);
    res.status(200).json({ message: 'Grading scale updated.', scale });
  } catch (err) { next(err); }
}

export async function deleteScaleController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req, 'id');
    const result = await deleteScale(id);
    res.status(200).json({ message: 'Grading scale deleted.', ...result });
  } catch (err) { next(err); }
}

export async function convertScoreController(req: Request, res: Response, next: NextFunction) {
  try {
    const score = Number(req.query.score);
    const scaleId = req.query.scaleId as string | undefined;
    if (Number.isNaN(score)) { res.status(400).json({ message: 'score query parameter must be a number.' }); return; }
    const result = await convertScore(score, scaleId);
    res.status(200).json({ result });
  } catch (err) { next(err); }
}

// ---------------------------------------------------------------------------
// Academic years
// ---------------------------------------------------------------------------

export async function createYearController(req: Request, res: Response, next: NextFunction) {
  try {
    const year = await createYear(req.body);
    res.status(201).json({ message: 'Academic year created.', year });
  } catch (err) { next(err); }
}

export async function listYearsController(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.query.status as any;
    const years = await getYears(status);
    res.status(200).json({ years });
  } catch (err) { next(err); }
}

export async function getYearController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req, 'id');
    const year = await getYear(id);
    res.status(200).json({ year });
  } catch (err) { next(err); }
}

export async function getCurrentYearController(_req: Request, res: Response, next: NextFunction) {
  try {
    const year = await getCurrentYear();
    res.status(200).json({ year });
  } catch (err) { next(err); }
}

export async function updateYearController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req, 'id');
    const year = await updateYear(id, req.body);
    res.status(200).json({ message: 'Academic year updated.', year });
  } catch (err) { next(err); }
}

export async function deleteYearController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req, 'id');
    const result = await deleteYear(id);
    res.status(200).json({ message: 'Academic year deleted.', ...result });
  } catch (err) { next(err); }
}

export async function setCurrentYearController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req, 'id');
    const year = await setCurrentYear(id);
    res.status(200).json({ message: 'Current academic year set.', year });
  } catch (err) { next(err); }
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export async function healthCheckController(_req: Request, res: Response, next: NextFunction) {
  try {
    const health = await checkHealth();
    const status = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
    res.status(status).json(health);
  } catch (err) { next(err); }
}

export async function systemInfoController(_req: Request, res: Response, next: NextFunction) {
  try {
    const info = getSystemInfo();
    res.status(200).json(info);
  } catch (err) { next(err); }
}

// ---------------------------------------------------------------------------
// Maintenance
// ---------------------------------------------------------------------------

export async function enableMaintenanceController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await enableMaintenance(req.body, req.user!.sub);
    await logAction({ userId: req.user!.sub, action: 'PLATFORM_SETTING_UPDATE', entityType: 'PlatformSetting', entityId: 'maintenance', details: { enabled: true, message: req.body.message } as any, context: auditCtx(req) });
    res.status(200).json({ ...result, message: 'Maintenance mode enabled.' });
  } catch (err) { next(err); }
}

export async function disableMaintenanceController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await disableMaintenance(req.user!.sub);
    await logAction({ userId: req.user!.sub, action: 'PLATFORM_SETTING_UPDATE', entityType: 'PlatformSetting', entityId: 'maintenance', details: { enabled: false } as any, context: auditCtx(req) });
    res.status(200).json({ ...result, message: 'Maintenance mode disabled.' });
  } catch (err) { next(err); }
}

export async function maintenanceStatusController(_req: Request, res: Response, next: NextFunction) {
  try {
    const status = await getMaintenanceStatus();
    res.status(200).json(status);
  } catch (err) { next(err); }
}

// ---------------------------------------------------------------------------
// Error handler
// ---------------------------------------------------------------------------

export function settingErrorHandler(err: unknown, _req: Request, res: Response, next: NextFunction): void {
  if (isHttpError(err)) { res.status(err.statusCode).json({ message: err.message, code: err.code }); return; }
  next(err);
}
