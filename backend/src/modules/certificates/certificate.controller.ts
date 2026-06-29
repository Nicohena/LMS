// src/modules/certificates/certificate.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import {
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplates,
  issueCertificate,
  bulkIssueCertificates,
  getMyCertificates,
  getCertificate,
  verifyCertificate,
  revokeCertificate,
} from './certificate.service';
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

export async function createTemplateController(req: Request, res: Response, next: NextFunction) {
  try {
    const template = await createTemplate(req.body, req.user!.role);
    await logAction({ userId: req.user!.sub, action: 'CERTIFICATE_TEMPLATE_CREATE', entityType: 'CertificateTemplate', entityId: template.id, context: auditCtx(req) });
    res.status(201).json({ message: 'Template created.', template });
  } catch (err) { next(err); }
}

export async function updateTemplateController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req, 'templateId');
    const template = await updateTemplate(id, req.body, req.user!.role);
    res.status(200).json({ message: 'Template updated.', template });
  } catch (err) { next(err); }
}

export async function deleteTemplateController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req, 'templateId');
    const result = await deleteTemplate(id, req.user!.role);
    res.status(200).json({ message: 'Template deleted.', ...result });
  } catch (err) { next(err); }
}

export async function getTemplatesController(_req: Request, res: Response, next: NextFunction) {
  try {
    const templates = await getTemplates();
    res.status(200).json({ templates });
  } catch (err) { next(err); }
}

export async function issueCertificateController(req: Request, res: Response, next: NextFunction) {
  try {
    const cert = await issueCertificate(req.body, req.user!.role);
    await logAction({ userId: req.user!.sub, action: 'CERTIFICATE_ISSUE', entityType: 'Certificate', entityId: cert.id, details: { userId: req.body.userId, courseId: req.body.courseId }, context: auditCtx(req) });
    res.status(201).json({ message: 'Certificate issued.', certificate: cert });
  } catch (err) { next(err); }
}

export async function bulkIssueController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await bulkIssueCertificates(req.body.courseId, req.body.templateId, req.body.userIds, req.user!.role);
    await logAction({ userId: req.user!.sub, action: 'CERTIFICATE_ISSUE', entityType: 'Certificate', entityId: req.body.courseId, details: { bulk: true, count: result.issued }, context: auditCtx(req) });
    res.status(201).json({ message: `Bulk issue complete: ${result.issued} issued, ${result.failed} failed.`, ...result });
  } catch (err) { next(err); }
}

export async function getMyCertificatesController(req: Request, res: Response, next: NextFunction) {
  try {
    const certs = await getMyCertificates(req.user!.sub);
    res.status(200).json({ certificates: certs });
  } catch (err) { next(err); }
}

export async function getCertificateController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req, 'certificateId');
    const viewer = { id: req.user!.sub, role: req.user!.role };
    const cert = await getCertificate(id, viewer);
    res.status(200).json({ certificate: cert });
  } catch (err) { next(err); }
}

export async function verifyCertificateController(req: Request, res: Response, next: NextFunction) {
  try {
    const token = (req.query.token as string) || (req.query.referenceNumber as string);
    if (!token) { res.status(400).json({ message: 'token or referenceNumber query parameter is required.' }); return; }
    const result = await verifyCertificate(token);
    res.status(200).json(result);
  } catch (err) { next(err); }
}

export async function revokeCertificateController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req, 'certificateId');
    const result = await revokeCertificate(id, req.body.reason, req.user!.role);
    await logAction({ userId: req.user!.sub, action: 'CERTIFICATE_REVOKE', entityType: 'Certificate', entityId: id, details: { reason: req.body.reason }, context: auditCtx(req) });
    res.status(200).json({ message: 'Certificate revoked.', ...result });
  } catch (err) { next(err); }
}

export function certificateErrorHandler(err: unknown, _req: Request, res: Response, next: NextFunction): void {
  if (isHttpError(err)) { res.status(err.statusCode).json({ message: err.message, code: err.code }); return; }
  next(err);
}
