// src/modules/courses/course.schemas.ts
import { z } from 'zod';
import { CourseStatus, DifficultyLevel, ContentType } from '@prisma/client';

// ---------------------------------------------------------------------------
// Course
// ---------------------------------------------------------------------------

export const createCourseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200).trim(),
  description: z.string().max(5000).optional(),
  thumbnail: z.string().url().optional(),
  category: z.string().max(80).optional(),
  tags: z.array(z.string().max(40)).max(20).default([]),
  duration: z.number().int().positive().max(100000).optional(),
  difficulty: z.nativeEnum(DifficultyLevel).default('BEGINNER'),
  language: z.string().max(40).default('English'),
  status: z.nativeEnum(CourseStatus).default('DRAFT'),
}).strict();

export const updateCourseSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(5000).optional(),
  thumbnail: z.string().url().optional(),
  category: z.string().max(80).optional(),
  tags: z.array(z.string().max(40)).max(20).optional(),
  duration: z.number().int().positive().max(100000).optional(),
  difficulty: z.nativeEnum(DifficultyLevel).optional(),
  language: z.string().max(40).optional(),
  status: z.nativeEnum(CourseStatus).optional(),
}).strict();

export const courseQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v ? Math.max(1, Number(v)) : 1)),
  limit: z
    .string()
    .optional()
    .transform((v) => {
      if (!v) return 10;
      const n = Number(v);
      return Math.min(100, Math.max(1, n));
    }),
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  difficulty: z.nativeEnum(DifficultyLevel).optional(),
  status: z.nativeEnum(CourseStatus).optional(),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'title', 'difficulty'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
}).strict();

// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------

export const createModuleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200).trim(),
  description: z.string().max(2000).optional(),
  order: z.number().int().nonnegative().optional(),
}).strict();

export const updateModuleSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(2000).optional(),
  order: z.number().int().nonnegative().optional(),
}).strict();

export const reorderModulesSchema = z.object({
  courseId: z.string().min(1),
  moduleIds: z.array(z.string().min(1)).min(1, 'At least one moduleId is required'),
}).strict();

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

export const createContentSchema = z.object({
  type: z.nativeEnum(ContentType),
  title: z.string().min(1, 'Title is required').max(200).trim(),
  description: z.string().max(2000).optional(),
  contentJson: z.any().optional(),
  videoUrl: z.string().url().optional(),
  fileUrl: z.string().url().optional(),
  externalUrl: z.string().url().optional(),
  duration: z.number().int().nonnegative().max(100000).optional(),
  order: z.number().int().nonnegative().optional(),
  isPublished: z.boolean().optional(),
}).strict();

export const updateContentSchema = z.object({
  type: z.nativeEnum(ContentType).optional(),
  title: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(2000).optional(),
  contentJson: z.any().optional(),
  videoUrl: z.string().url().nullable().optional(),
  fileUrl: z.string().url().nullable().optional(),
  externalUrl: z.string().url().nullable().optional(),
  duration: z.number().int().nonnegative().max(100000).optional(),
  order: z.number().int().nonnegative().optional(),
  isPublished: z.boolean().optional(),
}).strict();

export const reorderContentsSchema = z.object({
  moduleId: z.string().min(1),
  contentIds: z.array(z.string().min(1)).min(1, 'At least one contentId is required'),
}).strict();

// ---------------------------------------------------------------------------
// Derived types
// ---------------------------------------------------------------------------

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CourseQueryInput = z.infer<typeof courseQuerySchema>;

export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>;
export type ReorderModulesInput = z.infer<typeof reorderModulesSchema>;

export type CreateContentInput = z.infer<typeof createContentSchema>;
export type UpdateContentInput = z.infer<typeof updateContentSchema>;
export type ReorderContentsInput = z.infer<typeof reorderContentsSchema>;
