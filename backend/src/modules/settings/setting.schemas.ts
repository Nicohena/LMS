// src/modules/settings/setting.schemas.ts
import { z } from 'zod';
import { AcademicYearStatus, EmailTemplateType } from '@prisma/client';

// ---------------------------------------------------------------------------
// Platform settings
// ---------------------------------------------------------------------------

export const updateSettingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.unknown(),
  category: z.string().min(1).max(50).optional(),
  description: z.string().max(500).optional(),
}).strict();

export const batchUpdateSettingsSchema = z.object({
  settings: z.array(updateSettingSchema).min(1).max(50),
}).strict();

// ---------------------------------------------------------------------------
// Email templates
// ---------------------------------------------------------------------------

export const emailTemplateSchema = z.object({
  type: z.nativeEnum(EmailTemplateType),
  name: z.string().min(1).max(120),
  subject: z.string().min(1).max(300),
  htmlContent: z.string().min(1),
  textContent: z.string().optional(),
  placeholders: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
}).strict();

export const updateEmailTemplateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  subject: z.string().min(1).max(300).optional(),
  htmlContent: z.string().min(1).optional(),
  textContent: z.string().optional(),
  placeholders: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
}).strict();

// ---------------------------------------------------------------------------
// Grading scales
// ---------------------------------------------------------------------------

export const gradeEntrySchema = z.object({
  letter: z.string().min(1).max(10),
  min: z.number().min(0),
  max: z.number().max(100),
  description: z.string().max(200).optional(),
  gpa: z.number().optional(),
});

export const gradingScaleSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  type: z.enum(['percentage', 'gpa', 'points']),
  grades: z.array(gradeEntrySchema).min(1),
  isDefault: z.boolean().default(false),
}).strict();

export const updateGradingScaleSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).nullable().optional(),
  type: z.enum(['percentage', 'gpa', 'points']).optional(),
  grades: z.array(gradeEntrySchema).optional(),
  isDefault: z.boolean().optional(),
}).strict();

// ---------------------------------------------------------------------------
// Academic years
// ---------------------------------------------------------------------------

export const academicYearSchema = z.object({
  name: z.string().min(1).max(120),
  startDate: z.string().datetime().transform((v) => new Date(v)),
  endDate: z.string().datetime().transform((v) => new Date(v)),
  status: z.nativeEnum(AcademicYearStatus).default('ACTIVE'),
  isCurrent: z.boolean().default(false),
}).strict().refine(
  (d) => d.endDate > d.startDate,
  'endDate must be after startDate',
);

export const updateAcademicYearSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  startDate: z.string().datetime().optional().transform((v) => (v ? new Date(v) : undefined)),
  endDate: z.string().datetime().optional().transform((v) => (v ? new Date(v) : undefined)),
  status: z.nativeEnum(AcademicYearStatus).optional(),
  isCurrent: z.boolean().optional(),
}).strict();

// ---------------------------------------------------------------------------
// Maintenance mode
// ---------------------------------------------------------------------------

export const enableMaintenanceSchema = z.object({
  message: z.string().min(1).max(1000).default('Platform is under maintenance. Please try again later.'),
  whitelist: z.array(z.string()).default([]),
}).strict();

// ---------------------------------------------------------------------------
// Derived types
// ---------------------------------------------------------------------------

export type UpdateSettingInput = z.infer<typeof updateSettingSchema>;
export type BatchUpdateSettingsInput = z.infer<typeof batchUpdateSettingsSchema>;
export type EmailTemplateInput = z.infer<typeof emailTemplateSchema>;
export type UpdateEmailTemplateInput = z.infer<typeof updateEmailTemplateSchema>;
export type GradingScaleInput = z.infer<typeof gradingScaleSchema>;
export type UpdateGradingScaleInput = z.infer<typeof updateGradingScaleSchema>;
export type AcademicYearInput = z.infer<typeof academicYearSchema>;
export type UpdateAcademicYearInput = z.infer<typeof updateAcademicYearSchema>;
export type EnableMaintenanceInput = z.infer<typeof enableMaintenanceSchema>;
