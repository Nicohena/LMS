// src/modules/users/user.schemas.ts
import { z } from 'zod';
import { Role } from '@prisma/client';

// ---------------------------------------------------------------------------
// Body schemas
// ---------------------------------------------------------------------------

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  firstName: z.string().min(1, 'First name is required').max(80).trim(),
  lastName: z.string().min(1, 'Last name is required').max(80).trim(),
  role: z.nativeEnum(Role).default('STUDENT'),
  // Optional — if omitted, a random temporary password is generated
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .optional(),
  // Optional profile fields
  bio: z.string().max(500).optional(),
  profilePicture: z.string().url('Must be a valid URL').optional(),
  mustChangePassword: z.boolean().optional(),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(80).trim().optional(),
  lastName: z.string().min(1).max(80).trim().optional(),
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
  bio: z.string().max(500).optional(),
  profilePicture: z.string().url('Must be a valid URL').optional(),
  mustChangePassword: z.boolean().optional(),
}).strict();

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(80).trim().optional(),
  lastName: z.string().min(1).max(80).trim().optional(),
  bio: z.string().max(500).optional(),
  profilePicture: z.string().url('Must be a valid URL').optional(),
}).strict();

// ---------------------------------------------------------------------------
// Query schemas
// ---------------------------------------------------------------------------

export const userQuerySchema = z.object({
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
      return Math.min(100, Math.max(1, n)); // cap at 100
    }),
  search: z.string().trim().optional(),
  role: z.nativeEnum(Role).optional(),
  isActive: z
    .string()
    .optional()
    .transform((v) => {
      if (v === undefined) return undefined;
      if (v === 'true') return true;
      if (v === 'false') return false;
      return undefined;
    }),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'email', 'firstName', 'lastName', 'lastLogin'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
}).strict();

// ---------------------------------------------------------------------------
// Derived types
// ---------------------------------------------------------------------------

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UserQueryInput = z.infer<typeof userQuerySchema>;
