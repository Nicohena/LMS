// src/modules/auth/auth.service.ts
import { prisma } from '../../lib/prisma';
import { comparePassword, hashPassword } from '../../common/utils/password.utils';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  decodeRefreshToken,
  expiryStringToMs,
} from '../../common/utils/jwt.utils';
import type {
  LoginResult,
  PublicUser,
  Tokens,
  TokenPayload,
} from './auth.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toPublicUser(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: any;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLogin: Date | null;
}): PublicUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
    lastLogin: user.lastLogin,
  };
}

function issueTokens(payload: TokenPayload): Tokens {
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

function refreshExpiryDate(): Date {
  const expiryStr = process.env.JWT_REFRESH_EXPIRY || '7d';
  return new Date(Date.now() + expiryStringToMs(expiryStr));
}

// ---------------------------------------------------------------------------
// Service errors
// ---------------------------------------------------------------------------

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: 'INVALID_CREDENTIALS' | 'ACCOUNT_DISABLED' | 'INVALID_TOKEN' | 'TOKEN_REVOKED' | 'TOKEN_EXPIRED' | 'PASSWORD_MISMATCH' | 'USER_NOT_FOUND' | 'REGISTRATION_DISABLED' | 'EMAIL_ALREADY_EXISTS' | 'INVALID_RESET_TOKEN',
    public readonly statusCode: number = 401,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface LoginContext {
  ip?: string;
  userAgent?: string;
}

export async function login(
  email: string,
  password: string,
  context: LoginContext = {},
): Promise<LoginResult> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  // Use a generic error message to avoid leaking whether the email exists.
  if (!user) {
    // eslint-disable-next-line no-console
    console.warn(`[auth] Login failed (unknown email): ${email} from ${context.ip ?? 'unknown'}`);
    throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS', 401);
  }

  if (!user.isActive) {
    // eslint-disable-next-line no-console
    console.warn(`[auth] Login blocked (inactive account): ${user.email}`);
    throw new AuthError('Account is disabled. Contact an administrator.', 'ACCOUNT_DISABLED', 403);
  }

  const passwordOk = await comparePassword(password, user.passwordHash);
  if (!passwordOk) {
    // eslint-disable-next-line no-console
    console.warn(`[auth] Login failed (bad password): ${user.email} from ${context.ip ?? 'unknown'}`);
    throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS', 401);
  }

  // Update lastLogin timestamp
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  const payload: TokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };

  const tokens = issueTokens(payload);

  // Store the refresh token in MongoDB
  await prisma.refreshToken.create({
    data: {
      token: tokens.refreshToken,
      userId: user.id,
      expiresAt: refreshExpiryDate(),
    },
  });

  // eslint-disable-next-line no-console
  console.log(`[auth] Login success: ${user.email} (role=${user.role}) from ${context.ip ?? 'unknown'} UA=${context.userAgent ?? 'unknown'}`);

  return {
    user: toPublicUser(user),
    tokens,
    mustChangePassword: user.mustChangePassword,
  };
}

export async function refresh(refreshToken: string): Promise<Tokens> {
  // Step 1: verify signature. If invalid, reject.
  let payload: TokenPayload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[auth] Refresh failed: invalid signature');
    throw new AuthError('Invalid refresh token', 'INVALID_TOKEN', 401);
  }

  // Step 2: look up the token in DB (must exist, not revoked, not expired)
  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (!stored) {
    // eslint-disable-next-line no-console
    console.warn(`[auth] Refresh failed: token not found for user ${payload.sub}`);
    throw new AuthError('Invalid refresh token', 'INVALID_TOKEN', 401);
  }

  if (stored.revoked) {
    // Possible token reuse — revoke ALL of this user's tokens to be safe.
    // eslint-disable-next-line no-console
    console.warn(`[auth] Refresh failed: token already revoked for user ${payload.sub}. Revoking ALL tokens for this user.`);
    await prisma.refreshToken.updateMany({
      where: { userId: payload.sub, revoked: false },
      data: { revoked: true },
    });
    throw new AuthError('Refresh token has been revoked', 'TOKEN_REVOKED', 401);
  }

  if (stored.expiresAt < new Date()) {
    // eslint-disable-next-line no-console
    console.warn(`[auth] Refresh failed: token expired for user ${payload.sub}`);
    throw new AuthError('Refresh token has expired', 'TOKEN_EXPIRED', 401);
  }

  // Step 3: revoke the old token (rotation)
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revoked: true },
  });

  // Step 4: ensure the user still exists and is still active
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive) {
    // eslint-disable-next-line no-console
    console.warn(`[auth] Refresh failed: user not found or inactive (${payload.sub})`);
    throw new AuthError('Invalid refresh token', 'INVALID_TOKEN', 401);
  }

  // Step 5: issue new tokens and persist the new refresh token
  const newPayload: TokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };
  const newTokens = issueTokens(newPayload);

  await prisma.refreshToken.create({
    data: {
      token: newTokens.refreshToken,
      userId: user.id,
      expiresAt: refreshExpiryDate(),
    },
  });

  // eslint-disable-next-line no-console
  console.log(`[auth] Refresh success: ${user.email}`);
  return newTokens;
}

export async function logout(refreshToken: string | undefined): Promise<void> {
  if (!refreshToken) {
    // Nothing to do — caller may have already cleared cookies.
    return;
  }

  // Decode without verifying so we can still revoke an expired-but-once-valid token.
  const decoded = decodeRefreshToken(refreshToken);
  if (!decoded) {
    return; // malformed token, ignore silently
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (stored && !stored.revoked) {
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true },
    });
    // eslint-disable-next-line no-console
    console.log(`[auth] Logout: revoked refresh token for user ${decoded.sub}`);
  }
}

export async function changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string,
): Promise<{ message: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AuthError('User not found', 'USER_NOT_FOUND', 404);
  }

  const passwordOk = await comparePassword(oldPassword, user.passwordHash);
  if (!passwordOk) {
    // eslint-disable-next-line no-console
    console.warn(`[auth] Change password failed (bad old password): ${user.email}`);
    throw new AuthError('Current password is incorrect', 'PASSWORD_MISMATCH', 401);
  }

  const newHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: newHash,
      mustChangePassword: false,
    },
  });

  // Revoke ALL existing refresh tokens so the user must re-authenticate
  // with their new password on other devices too.
  await prisma.refreshToken.updateMany({
    where: { userId, revoked: false },
    data: { revoked: true },
  });

  // eslint-disable-next-line no-console
  console.log(`[auth] Password changed for user ${user.email}`);
  return { message: 'Password updated successfully. Please log in again.' };
}

// ---------------------------------------------------------------------------
// Self-registration
// ---------------------------------------------------------------------------

export async function register(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<{ user: PublicUser; tokens: Tokens }> {
  const email = data.email.toLowerCase();

  // Check if registration is allowed
  const { getSetting } = await import('../settings/setting.service');
  const allowRegistration = await getSetting<boolean>('allowRegistration');
  if (allowRegistration === false) {
    throw new AuthError('Self-registration is disabled. Please contact an administrator.', 'REGISTRATION_DISABLED', 403);
  }

  // Check for existing email
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AuthError('Email already exists', 'EMAIL_ALREADY_EXISTS', 409);
  }

  // Get default role from settings (default: STUDENT)
  const defaultRole = (await getSetting<string>('defaultRole')) || 'STUDENT';

  const passwordHash = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: defaultRole as any,
      mustChangePassword: false,
    },
  });

  const payload: TokenPayload = { sub: user.id, email: user.email, role: user.role };
  const tokens = issueTokens(payload);

  await prisma.refreshToken.create({
    data: {
      token: tokens.refreshToken,
      userId: user.id,
      expiresAt: refreshExpiryDate(),
    },
  });

  // eslint-disable-next-line no-console
  console.log(`[auth] Self-registration: ${user.email} (role=${user.role})`);

  return { user: toPublicUser(user), tokens };
}

// ---------------------------------------------------------------------------
// Password reset flow
// ---------------------------------------------------------------------------

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  // Always return the same message to avoid leaking whether the email exists
  const genericMessage = 'If an account exists for that email, a password reset link has been sent.';

  if (!user) {
    // eslint-disable-next-line no-console
    console.warn(`[auth] Password reset requested for unknown email: ${email}`);
    return { message: genericMessage };
  }

  // Generate a reset token (JWT with 1-hour expiry)
  const crypto = await import('crypto');
  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Store the reset token hash on the user (we hash it so it can't be read from DB)
  const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: tokenHash,
      passwordResetExpires: expiresAt,
    },
  });

  // Send the reset email
  try {
    const { sendEmail } = await import('../notifications/email.service');
    const { getSetting } = await import('../settings/setting.service');
    const clientUrl = (await getSetting<string>('clientUrl')) || process.env.CLIENT_URL || 'http://localhost:3000';
    const resetLink = `${clientUrl}/reset-password?token=${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: 'Password Reset - LMS',
      template: 'passwordReset',
      data: { firstName: user.firstName, resetLink },
    });
    // eslint-disable-next-line no-console
    console.log(`[auth] Password reset email sent to ${user.email}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[auth] Failed to send password reset email to ${user.email}:`, (err as Error).message);
  }

  return { message: genericMessage };
}

export async function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  const crypto = await import('crypto');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: tokenHash,
      passwordResetExpires: { gt: new Date() },
    },
  });

  if (!user) {
    throw new AuthError('Invalid or expired reset token', 'INVALID_RESET_TOKEN', 400);
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
      mustChangePassword: false,
    },
  });

  // Revoke all existing refresh tokens
  await prisma.refreshToken.updateMany({
    where: { userId: user.id, revoked: false },
    data: { revoked: true },
  });

  // eslint-disable-next-line no-console
  console.log(`[auth] Password reset successful for ${user.email}`);
  return { message: 'Password reset successful. Please log in with your new password.' };
}
