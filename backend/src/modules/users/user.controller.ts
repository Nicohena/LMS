// src/modules/users/user.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { Readable } from 'node:stream';
import csv from 'csv-parser';
import { Parser as Json2CsvParser } from 'json2csv';
import { Role } from '@prisma/client';
import {
  createUser as createUserService,
  getUsers as getUsersService,
  getUserById as getUserByIdService,
  updateUser as updateUserService,
  deleteUser as deleteUserService,
  updateProfile as updateProfileService,
  bulkCreateUsers,
  bulkExportUsers,
  UserServiceError,
} from './user.service';
import type { UserFilters } from './user.types';
import type { UserQueryInput } from './user.schemas';
import type { BulkRowInput } from './user.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toUserFilters(query: UserQueryInput): UserFilters {
  return {
    page: query.page,
    limit: query.limit,
    search: query.search,
    role: query.role,
    isActive: query.isActive,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  };
}

/** Coerce Express's possibly-array `req.params.id` into a single string. */
function paramId(req: Request): string {
  const id = req.params.id;
  return Array.isArray(id) ? id[0] : id;
}

// ---------------------------------------------------------------------------
// Admin endpoints
// ---------------------------------------------------------------------------

export async function createUserController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await createUserService(req.body);

    // Real-time: notify admins that a new user was created
    const { broadcastPlatformStatsUpdate, broadcastActivityUpdate } = await import('../../socket');
    broadcastPlatformStatsUpdate({ event: 'user_created', timestamp: new Date().toISOString() });
    broadcastActivityUpdate({
      type: 'user_registered',
      timestamp: new Date().toISOString(),
      data: {
        name: `${result.user.firstName} ${result.user.lastName}`,
        email: result.user.email,
        role: result.user.role,
      },
    });

    res.status(201).json({
      message: 'User created successfully.',
      user: result.user,
      ...(result.temporaryPassword
        ? {
            temporaryPassword: result.temporaryPassword,
            warning:
              'Share this temporary password with the user securely. They will be forced to change it on first login.',
          }
        : {}),
    });
  } catch (err) {
    next(err);
  }
}

export async function getUsersController(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = toUserFilters(req.validated!.query as unknown as UserQueryInput);
    const result = await getUsersService(filters);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getUserController(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await getUserByIdService(paramId(req));
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

export async function updateUserController(req: Request, res: Response, next: NextFunction) {
  try {
    // Prevent admins from deactivating / deleting themselves via this endpoint
    // (would lock them out).
    if (paramId(req) === req.user!.sub && req.body.isActive === false) {
      res.status(400).json({
        message: 'You cannot deactivate your own account via this endpoint. Use a different admin.',
      });
      return;
    }

    const user = await updateUserService(paramId(req), req.body);
    res.status(200).json({ message: 'User updated successfully.', user });
  } catch (err) {
    next(err);
  }
}

export async function deleteUserController(req: Request, res: Response, next: NextFunction) {
  try {
    if (paramId(req) === req.user!.sub) {
      res.status(400).json({ message: 'You cannot delete your own account.' });
      return;
    }

    // Query param ?hard=true for hard delete; default = soft delete.
    const hard = req.query.hard === 'true';
    const result = await deleteUserService(paramId(req), { soft: !hard });
    res.status(200).json({
      message: hard ? 'User permanently deleted.' : 'User deactivated (soft delete).',
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Bulk import (CSV) / export (CSV)
// ---------------------------------------------------------------------------

const REQUIRED_CSV_HEADERS = ['email', 'firstname', 'lastname', 'role'] as const;

export async function bulkImportController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No CSV file uploaded. Use multipart/form-data with field name "file".' });
      return;
    }

    // Detect CSV vs JSON by extension / content-type.
    const isJson =
      req.file.mimetype.includes('json') ||
      req.file.originalname.toLowerCase().endsWith('.json');

    let rows: BulkRowInput[] = [];

    if (isJson) {
      // Parse JSON synchronously (file sizes for bulk import are small).
      const text = req.file.buffer.toString('utf8');
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        res.status(400).json({ message: 'JSON must be an array of user objects.' });
        return;
      }
      rows = parsed.map(normalizeRow);
    } else {
      // Parse CSV via stream.
      rows = await new Promise<BulkRowInput[]>((resolve, reject) => {
        const out: BulkRowInput[] = [];
        const stream = Readable.from(req.file!.buffer.toString('utf8'));
        stream
          .pipe(csv())
          .on('headers', (headers: string[]) => {
            const lower = headers.map((h) => h.toLowerCase());
            for (const required of REQUIRED_CSV_HEADERS) {
              if (!lower.includes(required)) {
                reject(
                  new Error(
                    `CSV is missing required header "${required}". Found headers: ${headers.join(', ')}`,
                  ),
                );
              }
            }
          })
          .on('data', (row: Record<string, string>) => {
            out.push(normalizeRow(row));
          })
          .on('error', (err: Error) => reject(err))
          .on('end', () => resolve(out));
      });
    }

    // Validate each row synchronously to surface per-row errors clearly.
    const validRows: BulkRowInput[] = [];
    const errors: Array<{ row: number; email?: string; reason: string }> = [];
    rows.forEach((row, idx) => {
      try {
        validRows.push(validateBulkRow(row));
      } catch (e) {
        errors.push({
          row: idx + 2, // +2 because line 1 is the header in CSV
          email: row.email,
          reason: (e as Error).message,
        });
      }
    });

    // Insert the valid ones.
    const result = await bulkCreateUsers(validRows);

    // Merge per-row validation errors with the service-level errors.
    result.errors = [...errors, ...result.errors];
    result.failed += errors.length;
    result.total = rows.length;

    res.status(201).json({
      message: `Bulk import complete: ${result.inserted} inserted, ${result.failed} failed (of ${result.total} rows).`,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

function normalizeRow(row: Record<string, string> | object): BulkRowInput {
  // Accept either a CSV row (all strings, possibly with extra headers)
  // or a JSON object. Header matching is case-insensitive.
  const r = row as Record<string, unknown>;
  const get = (key: string): string | undefined => {
    const lower = key.toLowerCase();
    const found = Object.keys(r).find((k) => k.toLowerCase() === lower);
    return found !== undefined ? String(r[found]) : undefined;
  };
  return {
    email: (get('email') ?? '').trim(),
    firstName: (get('firstName') ?? '').trim(),
    lastName: (get('lastName') ?? '').trim(),
    role: (get('role') ?? 'STUDENT').trim().toUpperCase() as Role,
    password: get('password')?.trim() || undefined,
  };
}

function validateBulkRow(row: BulkRowInput): BulkRowInput {
  if (!row.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
    throw new Error(`Invalid email: "${row.email}"`);
  }
  if (!row.firstName) throw new Error('firstName is required');
  if (!row.lastName) throw new Error('lastName is required');
  const validRoles: Role[] = ['ADMIN', 'TEACHER', 'STUDENT'];
  if (!validRoles.includes(row.role)) {
    throw new Error(`Invalid role "${row.role}". Must be one of: ${validRoles.join(', ')}`);
  }
  if (row.password !== undefined && row.password.length < 6) {
    throw new Error('password must be at least 6 characters');
  }
  return row;
}

export async function bulkExportController(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = toUserFilters(req.validated!.query as unknown as UserQueryInput);
    const users = await bulkExportUsers(filters);

    // CSV field selection (exclude passwordHash defensively — it isn't on the
    // UserResponse type, but be explicit for the export).
    const fields = [
      'id',
      'email',
      'firstName',
      'lastName',
      'role',
      'isActive',
      'mustChangePassword',
      'bio',
      'profilePicture',
      'lastLogin',
      'createdAt',
      'updatedAt',
    ];
    const parser = new Json2CsvParser({ fields });
    const csvText = parser.parse(users);

    const filename = `users-export-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvText);
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Self-service endpoints
// ---------------------------------------------------------------------------

export async function getProfileController(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await getUserByIdService(req.user!.sub);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

export async function updateProfileController(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await updateProfileService(req.user!.sub, req.body);
    res.status(200).json({ message: 'Profile updated successfully.', user });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Error handler for UserServiceError
// ---------------------------------------------------------------------------

export function userServiceErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (err instanceof UserServiceError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }
  next(err);
}
