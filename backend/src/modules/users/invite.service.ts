// src/modules/users/invite.service.ts
import { prisma } from '../../lib/prisma';
import { NotFoundError, ForbiddenError, ValidationError } from '../../common/errors';
import { hashPassword } from '../../common/utils/password.utils';
import { v4 as uuidv4 } from 'uuid';
import type { Role } from '@prisma/client';

// ---------------------------------------------------------------------------
// Generate invite code (admin only)
// ---------------------------------------------------------------------------

export async function generateInviteCode(
  adminId: string,
  options: { role?: Role; expiresAt?: Date; count?: number } = {},
): Promise<{ codes: any[] }> {
  const role = options.role ?? 'STUDENT';
  const count = Math.min(options.count ?? 1, 50); // max 50 at once
  const expiresAt = options.expiresAt;

  const codes: any[] = [];
  for (let i = 0; i < count; i++) {
    const code = generateCode();
    const invite = await prisma.inviteCode.create({
      data: {
        code,
        role,
        createdBy: adminId,
        expiresAt,
      },
    });
    codes.push(invite);
  }

  // eslint-disable-next-line no-console
  console.log(`[invites] Admin ${adminId} generated ${count} invite code(s) for role ${role}`);
  return { codes };
}

function generateCode(): string {
  // Generate a readable code: LMS-XXXX-XXXX (uppercase alphanumeric)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segment = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `LMS-${segment(4)}-${segment(4)}`;
}

// ---------------------------------------------------------------------------
// Get invite codes (admin only)
// ---------------------------------------------------------------------------

export async function getInviteCodes(filters?: { isUsed?: boolean; page?: number; limit?: number }) {
  const page = filters?.page ?? 1;
  const limit = Math.min(filters?.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const where: any = {};
  if (filters?.isUsed !== undefined) where.isUsed = filters.isUsed;

  const [data, total] = await Promise.all([
    prisma.inviteCode.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { id: true, firstName: true, lastName: true, email: true } },
        usedByUser: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    }),
    prisma.inviteCode.count({ where }),
  ]);

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ---------------------------------------------------------------------------
// Validate invite code
// ---------------------------------------------------------------------------

export async function validateInviteCode(code: string): Promise<{ valid: boolean; role?: Role; inviteId?: string }> {
  const invite = await prisma.inviteCode.findUnique({ where: { code: code.toUpperCase() } });
  if (!invite) return { valid: false };
  if (invite.isUsed) return { valid: false };
  if (invite.expiresAt && invite.expiresAt < new Date()) return { valid: false };
  return { valid: true, role: invite.role, inviteId: invite.id };
}

// ---------------------------------------------------------------------------
// Register with invite code
// ---------------------------------------------------------------------------

export async function registerWithInvite(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  inviteCode: string;
}): Promise<{ user: any; tokens: any }> {
  const email = data.email.toLowerCase();

  // Validate invite code
  const invite = await prisma.inviteCode.findUnique({ where: { code: data.inviteCode.toUpperCase() } });
  if (!invite) throw new ValidationError('Invalid invite code.');
  if (invite.isUsed) throw new ValidationError('This invite code has already been used.');
  if (invite.expiresAt && invite.expiresAt < new Date()) throw new ValidationError('This invite code has expired.');

  // Check for existing email
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ValidationError('Email already exists.');

  const passwordHash = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: invite.role,
      mustChangePassword: false,
      createdBy: invite.createdBy,
    },
  });

  // Mark invite code as used
  await prisma.inviteCode.update({
    where: { id: invite.id },
    data: { isUsed: true, usedBy: user.id },
  });

  // Issue tokens
  const { signAccessToken, signRefreshToken } = await import('../../common/utils/jwt.utils');
  const { issueTokens, refreshExpiryDate } = await import('../auth/auth.service');
  const payload = { sub: user.id, email: user.email, role: user.role };
  const tokens = issueTokens(payload);

  await prisma.refreshToken.create({
    data: {
      token: tokens.refreshToken,
      userId: user.id,
      expiresAt: refreshExpiryDate(),
    },
  });

  // Send welcome email
  try {
    const { sendEmail } = await import('../notifications/email.service');
    const { getSetting } = await import('../settings/setting.service');
    const clientUrl = (await getSetting<string>('clientUrl')) || process.env.CLIENT_URL || 'http://localhost:3000';
    await sendEmail({
      to: user.email,
      subject: `Welcome to LMS, ${user.firstName}!`,
      template: 'welcome',
      data: { firstName: user.firstName, email: user.email, loginLink: `${clientUrl}/login` },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[invites] Failed to send welcome email to ${user.email}:`, (err as Error).message);
  }

  // eslint-disable-next-line no-console
  console.log(`[invites] User registered with invite code: ${user.email} (role=${user.role})`);

  // Return user without passwordHash
  const { passwordHash: _, ...userWithoutHash } = user;
  return { user: userWithoutHash, tokens };
}

// ---------------------------------------------------------------------------
// Teacher creates student account
// ---------------------------------------------------------------------------

export async function teacherCreateStudent(
  teacherId: string,
  data: {
    email: string;
    firstName: string;
    lastName: string;
    password?: string;
    courseId?: string; // auto-enroll in this course
  },
): Promise<{ user: any; temporaryPassword?: string }> {
  const email = data.email.toLowerCase();

  // Verify teacher role
  const teacher = await prisma.user.findUnique({ where: { id: teacherId } });
  if (!teacher || (teacher.role !== 'TEACHER' && teacher.role !== 'ADMIN')) {
    throw new ForbiddenError('Only teachers and admins can create student accounts.');
  }

  // Check for existing email
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ValidationError('Email already exists.');

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
      role: 'STUDENT',
      mustChangePassword: !!temporaryPassword,
      createdBy: teacherId,
    },
  });

  // Auto-enroll in the specified course
  if (data.courseId) {
    await prisma.enrollment.create({
      data: {
        userId: user.id,
        courseId: data.courseId,
        status: 'ACTIVE',
        progressPercentage: 0,
      },
    }).catch(() => {});
    // eslint-disable-next-line no-console
    console.log(`[invites] Auto-enrolled ${user.email} in course ${data.courseId}`);
  }

  // Send welcome email
  try {
    const { sendEmail } = await import('../notifications/email.service');
    await sendEmail({
      to: user.email,
      subject: `Welcome to LMS, ${data.firstName}!`,
      template: 'welcome',
      data: {
        firstName: data.firstName,
        email: user.email,
        temporaryPassword,
        loginLink: `${process.env.CLIENT_URL || 'http://localhost:3000'}/login`,
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[invites] Failed to send welcome email to ${user.email}:`, (err as Error).message);
  }

  // eslint-disable-next-line no-console
  console.log(`[invites] Teacher ${teacherId} created student: ${user.email}`);

  const { passwordHash: _, ...userWithoutHash } = user;
  return { user: userWithoutHash, ...(temporaryPassword ? { temporaryPassword } : {}) };
}

function generateTempPassword(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ---------------------------------------------------------------------------
// Admin changes user role
// ---------------------------------------------------------------------------

export async function changeUserRole(
  adminId: string,
  userId: string,
  newRole: Role,
): Promise<{ user: any }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found.');

  if (user.role === newRole) throw new ValidationError('User already has this role.');

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });

  // If promoting to teacher, create teacher permission record
  if (newRole === 'TEACHER') {
    await prisma.teacherPermission.upsert({
      where: { userId },
      update: {},
      create: { userId },
    }).catch(() => {});
  }

  // eslint-disable-next-line no-console
  console.log(`[invites] Admin ${adminId} changed user ${userId} role to ${newRole}`);

  const { passwordHash: _, ...userWithoutHash } = updated;
  return { user: userWithoutHash };
}
