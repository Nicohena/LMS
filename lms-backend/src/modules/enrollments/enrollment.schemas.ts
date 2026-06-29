// src/modules/enrollments/enrollment.schemas.ts
import { z } from 'zod';
import { EnrollmentStatus, ProgressStatus } from '@prisma/client';

// ---------------------------------------------------------------------------
// Body schemas
// ---------------------------------------------------------------------------

export const enrollUserSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  courseId: z.string().min(1, 'courseId is required'),
}).strict();

export const bulkEnrollSchema = z.object({
  courseId: z.string().min(1, 'courseId is required'),
  userIds: z
    .array(z.string().min(1))
    .min(1, 'At least one userId is required')
    .max(500, 'Maximum 500 users per bulk enroll'),
}).strict();

export const cancelEnrollmentSchema = z.object({
  reason: z.string().max(500).optional(),
}).strict();

export const progressUpdateSchema = z.object({
  contentId: z.string().min(1, 'contentId is required'),
  progressPercent: z.number().min(0).max(100),
  timeSpent: z.number().int().nonnegative().max(86400).default(0), // seconds, max 1 day
  status: z.nativeEnum(ProgressStatus).optional(),
}).strict();

// ---------------------------------------------------------------------------
// Query schemas
// ---------------------------------------------------------------------------

export const enrollmentQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v ? Math.max(1, Number(v)) : 1)),
  limit: z
    .string()
    .optional()
    .transform((v) => {
      if (!v) return 10;
      return Math.min(100, Math.max(1, Number(v)));
    }),
  status: z.nativeEnum(EnrollmentStatus).optional(),
  courseId: z.string().min(1).optional(),
  userId: z.string().min(1).optional(),
  search: z.string().trim().optional(),
  sortBy: z
    .enum(['enrolledAt', 'updatedAt', 'progressPercentage', 'lastAccessedAt'])
    .optional()
    .default('enrolledAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
}).strict();

// ---------------------------------------------------------------------------
// Auto-enrollment rule schemas
// ---------------------------------------------------------------------------

export const createRuleSchema = z.object({
  name: z.string().min(1).max(120),
  ruleType: z.enum(['DEPARTMENT', 'ROLE', 'CUSTOM']).default('CUSTOM'),
  ruleConfig: z.record(z.string(), z.unknown()),
  courseId: z.string().min(1),
  isActive: z.boolean().optional().default(true),
}).strict();

export const updateRuleSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  ruleType: z.enum(['DEPARTMENT', 'ROLE', 'CUSTOM']).optional(),
  ruleConfig: z.record(z.string(), z.unknown()).optional(),
  courseId: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
}).strict();

export const triggerAutoEnrollmentSchema = z.object({
  userId: z.string().min(1).optional(), // omit to trigger for ALL users
}).strict();

// ---------------------------------------------------------------------------
// Derived types
// ---------------------------------------------------------------------------

export type EnrollUserInput = z.infer<typeof enrollUserSchema>;
export type BulkEnrollInput = z.infer<typeof bulkEnrollSchema>;
export type CancelEnrollmentInput = z.infer<typeof cancelEnrollmentSchema>;
export type ProgressUpdateInput = z.infer<typeof progressUpdateSchema>;
export type EnrollmentQueryInput = z.infer<typeof enrollmentQuerySchema>;
export type CreateRuleInput = z.infer<typeof createRuleSchema>;
export type UpdateRuleInput = z.infer<typeof updateRuleSchema>;
export type TriggerAutoEnrollmentInput = z.infer<typeof triggerAutoEnrollmentSchema>;
