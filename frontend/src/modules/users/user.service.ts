// src/modules/users/user.service.ts
import crypto from 'node:crypto';
import { Prisma, Role, User } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { hashPassword } from '../../common/utils/password.utils';
import type {
  BulkImportResult,
  CreateUserResult,
  UserFilters,
  UserListResponse,
  UserResponse,
} from './user.types';
import type {
  CreateUserInput,
  UpdateProfileInput,
  UpdateUserInput,
} from './user.schemas';

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class UserServiceError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'USER_NOT_FOUND'
      | 'EMAIL_ALREADY_EXISTS'
      | 'INVALID_INPUT'
      | 'FORBIDDEN_SELF_DELETE'
      | 'FORBIDDEN_SELF_DEACTIVATE',
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = 'UserServiceError';
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toPublicUser(user: User): UserResponse {
  // Strip passwordHash — never expose it.
  const { passwordHash: _omitted, ...rest } = user;
  return rest;
}

function generateTempPassword(): string {
  // 16 hex chars = 8 random bytes
  return crypto.randomBytes(8).toString('hex');
}

/** MongoDB ObjectId regex — 24 hex chars. */
const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

/** Returns true if `id` looks like a valid MongoDB ObjectId. */
function isValidObjectId(id: string): boolean {
  return OBJECT_ID_RE.test(id);
}

/** Wrap a "find by id" call so malformed ObjectIds return 404, not a 500. */
function assertValidObjectId(id: string): void {
  if (!isValidObjectId(id)) {
    throw new UserServiceError('User not found', 'USER_NOT_FOUND', 404);
  }
}

function buildWhereClause(filters: UserFilters): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {};

  if (filters.role) {
    where.role = filters.role;
  }

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  if (filters.search) {
    const s = filters.search;
    where.OR = [
      { email: { contains: s, mode: 'insensitive' } },
      { firstName: { contains: s, mode: 'insensitive' } },
      { lastName: { contains: s, mode: 'insensitive' } },
    ];
  }

  return where;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function createUser(data: CreateUserInput): Promise<CreateUserResult> {
  const email = data.email.toLowerCase();

  // Check for existing email first (cheaper than catching Prisma's P2002)
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new UserServiceError(
      'Email already exists',
      'EMAIL_ALREADY_EXISTS',
      409,
    );
  }

  let temporaryPassword: string | undefined;
  let passwordToHash: string;

  if (data.password) {
    passwordToHash = data.password;
  } else {
    temporaryPassword = generateTempPassword();
    passwordToHash = temporaryPassword;
  }

  const passwordHash = await hashPassword(passwordToHash);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      bio: data.bio,
      profilePicture: data.profilePicture,
      // If admin provided mustChangePassword explicitly, honor it.
      // Otherwise: force change on first login (sensible default for new users,
      // whether they got a temp password or an admin-set password).
      mustChangePassword: data.mustChangePassword ?? true,
    },
  });

  // eslint-disable-next-line no-console
  console.log(`[users] Admin created user: ${user.email} (role=${user.role})`);

  return {
    user: toPublicUser(user),
    ...(temporaryPassword ? { temporaryPassword } : {}),
  };
}

export async function getUsers(filters: UserFilters): Promise<UserListResponse> {
  const where = buildWhereClause(filters);
  const skip = (filters.page - 1) * filters.limit;
  const take = filters.limit;

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { [filters.sortBy]: filters.sortOrder },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: data.map(toPublicUser),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  };
}

export async function getUserById(id: string): Promise<UserResponse> {
  assertValidObjectId(id);
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new UserServiceError('User not found', 'USER_NOT_FOUND', 404);
  }
  return toPublicUser(user);
}

export async function updateUser(id: string, data: UpdateUserInput): Promise<UserResponse> {
  assertValidObjectId(id);
  // Verify existence first so we get a clean 404.
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new UserServiceError('User not found', 'USER_NOT_FOUND', 404);
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
  });

  // eslint-disable-next-line no-console
  console.log(`[users] Admin updated user ${updated.email}: ${JSON.stringify(data)}`);

  return toPublicUser(updated);
}

export async function deleteUser(id: string, options?: { soft?: boolean }): Promise<{ id: string; deleted: boolean }> {
  assertValidObjectId(id);
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new UserServiceError('User not found', 'USER_NOT_FOUND', 404);
  }

  // Revoke all refresh tokens for this user (whether soft or hard delete).
  await prisma.refreshToken.updateMany({
    where: { userId: id, revoked: false },
    data: { revoked: true },
  });

  if (options?.soft === false) {
    // Hard delete — first delete all refresh tokens for this user
    // (MongoDB provider doesn't auto-cascade despite onDelete: CASCADE in schema).
    await prisma.refreshToken.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });
    // eslint-disable-next-line no-console
    console.log(`[users] Admin HARD-deleted user: ${existing.email}`);
    return { id, deleted: true };
  }

  // Soft delete: just deactivate.
  await prisma.user.update({
    where: { id },
    data: { isActive: false },
  });

  // eslint-disable-next-line no-console
  console.log(`[users] Admin soft-deleted (deactivated) user: ${existing.email}`);

  return { id, deleted: true };
}

export async function updateProfile(userId: string, data: UpdateProfileInput): Promise<UserResponse> {
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    throw new UserServiceError('User not found', 'USER_NOT_FOUND', 404);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
  });

  // eslint-disable-next-line no-console
  console.log(`[users] User self-updated profile: ${updated.email}`);

  return toPublicUser(updated);
}

// ---------------------------------------------------------------------------
// Bulk operations
// ---------------------------------------------------------------------------

export interface BulkRowInput {
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  password?: string;
}

export async function bulkCreateUsers(rows: BulkRowInput[]): Promise<BulkImportResult> {
  const result: BulkImportResult = {
    total: rows.length,
    inserted: 0,
    failed: 0,
    errors: [],
    temporaryPasswords: [],
  };

  if (rows.length === 0) {
    return result;
  }

  // 1. Deduplicate within the batch (by email, case-insensitive).
  const seenEmails = new Set<string>();
  const deduped: BulkRowInput[] = [];
  rows.forEach((row, idx) => {
    const email = row.email.toLowerCase();
    if (seenEmails.has(email)) {
      result.failed += 1;
      result.errors.push({
        row: idx + 1,
        email: row.email,
        reason: 'Duplicate email within the import file',
      });
      return;
    }
    seenEmails.add(email);
    deduped.push({ ...row, email });
  });

  if (deduped.length === 0) return result;

  // 2. Fetch all existing users with these emails in one query.
  const existing = await prisma.user.findMany({
    where: { email: { in: deduped.map((r) => r.email) } },
    select: { email: true },
  });
  const existingEmails = new Set(existing.map((u) => u.email.toLowerCase()));

  // 3. Build the records to insert, hashing passwords as needed.
  const records: Prisma.UserCreateManyInput[] = [];
  for (const row of deduped) {
    if (existingEmails.has(row.email)) {
      result.failed += 1;
      result.errors.push({
        row: rows.indexOf(row) + 1,
        email: row.email,
        reason: 'Email already exists in database',
      });
      continue;
    }

    let password: string;
    if (row.password) {
      password = row.password;
    } else {
      password = generateTempPassword();
      result.temporaryPasswords.push({ email: row.email, password });
    }

    const passwordHash = await hashPassword(password);

    records.push({
      email: row.email,
      passwordHash,
      firstName: row.firstName,
      lastName: row.lastName,
      role: row.role,
      mustChangePassword: true,
    });
  }

  // 4. Insert in a single query. (We already filtered duplicates manually,
  //    so skipDuplicates is not needed — and Prisma's MongoDB provider
  //    doesn't support it anyway.)
  if (records.length > 0) {
    try {
      const insertResult = await prisma.user.createMany({
        data: records,
      });
      result.inserted = insertResult.count;
    } catch (err) {
      // Should not happen given our pre-checks, but log it.
      // eslint-disable-next-line no-console
      console.error('[users] Bulk insert failed:', err);
      result.failed += records.length;
      result.errors.push({
        row: 0,
        reason: `Database insert failed: ${(err as Error).message}`,
      });
    }
  }

  // eslint-disable-next-line no-console
  console.log(
    `[users] Bulk import: ${result.inserted} inserted, ${result.failed} failed (of ${result.total} rows)`,
  );

  return result;
}

export async function bulkExportUsers(filters: UserFilters): Promise<UserResponse[]> {
  // Export up to a higher cap than the regular list endpoint.
  const exportFilters: UserFilters = {
    ...filters,
    page: 1,
    limit: 10000, // generous cap for export
  };

  const where = buildWhereClause(exportFilters);
  const users = await prisma.user.findMany({
    where,
    orderBy: { [filters.sortBy]: filters.sortOrder },
    take: exportFilters.limit,
  });

  return users.map(toPublicUser);
}
