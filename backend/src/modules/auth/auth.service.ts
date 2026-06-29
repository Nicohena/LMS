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
    public readonly code: 'INVALID_CREDENTIALS' | 'ACCOUNT_DISABLED' | 'INVALID_TOKEN' | 'TOKEN_REVOKED' | 'TOKEN_EXPIRED' | 'PASSWORD_MISMATCH' | 'USER_NOT_FOUND',
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
