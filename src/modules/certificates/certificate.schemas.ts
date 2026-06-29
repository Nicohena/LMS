// src/modules/certificates/certificate.schemas.ts
import { z } from 'zod';
import { CertificateStatus } from '@prisma/client';

export const createCertificateTemplateSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  htmlTemplate: z.string().min(1, 'HTML template is required'),
  cssStyle: z.string().optional(),
  signatureImage: z.string().url().optional(),
  signatureName: z.string().max(120).optional(),
  signatureTitle: z.string().max(120).optional(),
  backgroundImage: z.string().url().optional(),
  fontFamily: z.string().max(100).optional(),
}).strict();

export const updateCertificateTemplateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).nullable().optional(),
  htmlTemplate: z.string().min(1).optional(),
  cssStyle: z.string().nullable().optional(),
  signatureImage: z.string().url().nullable().optional(),
  signatureName: z.string().max(120).nullable().optional(),
  signatureTitle: z.string().max(120).nullable().optional(),
  backgroundImage: z.string().url().nullable().optional(),
  fontFamily: z.string().max(100).nullable().optional(),
}).strict();

export const issueCertificateSchema = z.object({
  userId: z.string().min(1),
  courseId: z.string().min(1).optional(),
  quizId: z.string().min(1).optional(),
  templateId: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).strict().refine(
  (d) => d.courseId || d.quizId,
  'Either courseId or quizId is required',
);

export const bulkIssueSchema = z.object({
  courseId: z.string().min(1),
  templateId: z.string().min(1),
  userIds: z.array(z.string().min(1)).min(1).max(500),
}).strict();

export const revokeCertificateSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(1000),
}).strict();

export type CreateCertificateTemplateInput = z.infer<typeof createCertificateTemplateSchema>;
export type UpdateCertificateTemplateInput = z.infer<typeof updateCertificateTemplateSchema>;
export type IssueCertificateInput = z.infer<typeof issueCertificateSchema>;
export type BulkIssueInput = z.infer<typeof bulkIssueSchema>;
export type RevokeCertificateInput = z.infer<typeof revokeCertificateSchema>;
