// src/modules/gamification/gamification.schemas.ts
import { z } from 'zod';
import { XPSource } from '@prisma/client';

export const createBadgeTemplateSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().min(1).max(2000),
  imageUrl: z.string().url(),
  criteria: z.string().min(1).max(500),
  points: z.number().int().nonnegative().optional(),
  isActive: z.boolean().default(true),
  expiresAfterDays: z.number().int().positive().max(3650).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateBadgeTemplateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().min(1).max(2000).optional(),
  imageUrl: z.string().url().optional(),
  criteria: z.string().min(1).max(500).optional(),
  points: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
  expiresAfterDays: z.number().int().positive().max(3650).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const awardBadgeSchema = z.object({
  userId: z.string().min(1),
  badgeTemplateId: z.string().min(1),
  evidence: z.string().max(1000).optional(),
});

export const updateXPRuleSchema = z.object({
  points: z.number().int(),
  isActive: z.boolean().optional(),
  description: z.string().max(500).optional(),
});

export const manualXPSchema = z.object({
  userId: z.string().min(1),
  points: z.number().int(),
  reason: z.string().min(1).max(500),
});

export const leaderboardQuerySchema = z.object({
  scope: z.enum(['GLOBAL', 'COURSE', 'COHORT']).default('GLOBAL'),
  scopeId: z.string().min(1).optional(),
  period: z.enum(['daily', 'weekly', 'monthly', 'all-time']).default('all-time'),
  limit: z.string().optional().transform((v) => (v ? Math.min(100, Math.max(1, Number(v))) : 20)),
});

export const xpHistoryQuerySchema = z.object({
  page: z.string().optional().transform((v) => (v ? Math.max(1, Number(v)) : 1)),
  limit: z.string().optional().transform((v) => {
    if (!v) return 20;
    return Math.min(100, Math.max(1, Number(v)));
  }),
});

export type CreateBadgeTemplateInput = z.infer<typeof createBadgeTemplateSchema>;
export type UpdateBadgeTemplateInput = z.infer<typeof updateBadgeTemplateSchema>;
export type AwardBadgeInput = z.infer<typeof awardBadgeSchema>;
export type UpdateXPRuleInput = z.infer<typeof updateXPRuleSchema>;
export type ManualXPInput = z.infer<typeof manualXPSchema>;
export type LeaderboardQueryInput = z.infer<typeof leaderboardQuerySchema>;
export type XPHistoryQueryInput = z.infer<typeof xpHistoryQuerySchema>;
