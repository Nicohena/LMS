// src/modules/reports/report.schemas.ts
import { z } from 'zod';
import { ReportFormat, ReportFrequency, ReportStatus } from '@prisma/client';

// ---------------------------------------------------------------------------
// Report templates
// ---------------------------------------------------------------------------

export const reportTemplateSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  dataSource: z.enum(['users', 'courses', 'enrollments', 'grades', 'progress', 'quiz_attempts', 'submissions', 'certificates', 'xp']),
  metrics: z.array(z.string()).min(1, 'At least one metric is required'),
  dimensions: z.array(z.string()).default([]),
  filters: z.record(z.string(), z.unknown()).optional(),
  chartType: z.enum(['bar', 'line', 'pie', 'table', 'heatmap']).optional(),
  isPublic: z.boolean().default(false),
}).strict();

export const updateReportTemplateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).nullable().optional(),
  dataSource: z.enum(['users', 'courses', 'enrollments', 'grades', 'progress', 'quiz_attempts', 'submissions', 'certificates', 'xp']).optional(),
  metrics: z.array(z.string()).optional(),
  dimensions: z.array(z.string()).optional(),
  filters: z.record(z.string(), z.unknown()).nullable().optional(),
  chartType: z.enum(['bar', 'line', 'pie', 'table', 'heatmap']).nullable().optional(),
  isPublic: z.boolean().optional(),
}).strict();

// ---------------------------------------------------------------------------
// Scheduled reports
// ---------------------------------------------------------------------------

export const scheduleReportSchema = z.object({
  templateId: z.string().min(1),
  name: z.string().min(1).max(120),
  frequency: z.nativeEnum(ReportFrequency),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Must be HH:MM'),
  recipients: z.array(z.string().email()).min(1, 'At least one recipient is required'),
  format: z.nativeEnum(ReportFormat).default('PDF'),
  isActive: z.boolean().default(true),
}).strict();

export const updateScheduleSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  frequency: z.nativeEnum(ReportFrequency).optional(),
  dayOfWeek: z.number().int().min(0).max(6).nullable().optional(),
  dayOfMonth: z.number().int().min(1).max(31).nullable().optional(),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  recipients: z.array(z.string().email()).optional(),
  format: z.nativeEnum(ReportFormat).optional(),
  isActive: z.boolean().optional(),
}).strict();

// ---------------------------------------------------------------------------
// Generate report
// ---------------------------------------------------------------------------

export const generateReportSchema = z.object({
  filters: z.record(z.string(), z.unknown()).optional(),
  format: z.nativeEnum(ReportFormat).default('JSON'),
}).strict();

// ---------------------------------------------------------------------------
// Audit log query
// ---------------------------------------------------------------------------

export const auditLogQuerySchema = z.object({
  page: z.string().optional().transform((v) => (v ? Math.max(1, Number(v)) : 1)),
  limit: z.string().optional().transform((v) => {
    if (!v) return 20;
    return Math.min(200, Math.max(1, Number(v)));
  }),
  userId: z.string().min(1).optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().min(1).optional(),
  startDate: z.string().datetime().optional().transform((v) => (v ? new Date(v) : undefined)),
  endDate: z.string().datetime().optional().transform((v) => (v ? new Date(v) : undefined)),
}).strict();

// ---------------------------------------------------------------------------
// Platform settings
// ---------------------------------------------------------------------------

export const platformSettingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.unknown(),
  category: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
}).strict();

// ---------------------------------------------------------------------------
// Derived types
// ---------------------------------------------------------------------------

export type ReportTemplateInput = z.infer<typeof reportTemplateSchema>;
export type UpdateReportTemplateInput = z.infer<typeof updateReportTemplateSchema>;
export type ScheduleReportInput = z.infer<typeof scheduleReportSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
export type GenerateReportInput = z.infer<typeof generateReportSchema>;
export type AuditLogQueryInput = z.infer<typeof auditLogQuerySchema>;
export type PlatformSettingInput = z.infer<typeof platformSettingSchema>;
