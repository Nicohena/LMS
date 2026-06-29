// src/modules/users/user.types.ts
import type { Role, User } from '@prisma/client';

/** Public user object — never exposes passwordHash. */
export type UserResponse = Omit<User, 'passwordHash'>;

/** Paginated list response. */
export interface UserListResponse {
  data: UserResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** Result returned when creating a user without an explicit password. */
export interface CreateUserResult {
  user: UserResponse;
  /** Only present when a temporary password was generated server-side. */
  temporaryPassword?: string;
}

/** Bulk import summary. */
export interface BulkImportResult {
  total: number;
  inserted: number;
  failed: number;
  /** Per-row failure details. */
  errors: Array<{ row: number; email?: string; reason: string }>;
  /** Generated temp passwords keyed by email (for admins to relay to users). */
  temporaryPasswords: Array<{ email: string; password: string }>;
}

/** Filters + pagination parsed from the query string. */
export interface UserFilters {
  page: number;
  limit: number;
  search?: string;
  role?: Role;
  isActive?: boolean;
  sortBy: 'createdAt' | 'updatedAt' | 'email' | 'firstName' | 'lastName' | 'lastLogin';
  sortOrder: 'asc' | 'desc';
}

/** Row coming from a CSV/JSON bulk import (after Zod parse). */
export interface BulkUserRow {
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  password?: string;
}
