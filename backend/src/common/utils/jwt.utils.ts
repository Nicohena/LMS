// src/common/utils/jwt.utils.ts
import jwt, { type SignOptions } from 'jsonwebtoken';
import type { TokenPayload } from '../../modules/auth/auth.types';

const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

function requireSecret(name: string): string {
  const secret = process.env.JWT_ACCESS_SECRET && name === 'JWT_ACCESS_SECRET'
    ? process.env.JWT_ACCESS_SECRET
    : process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error(
      `Missing ${name}. Set it in .env (see .env.example).`,
    );
  }
  return secret;
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, requireSecret('JWT_ACCESS_SECRET'), {
    expiresIn: ACCESS_EXPIRY,
  } as SignOptions);
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, requireSecret('JWT_REFRESH_SECRET'), {
    expiresIn: REFRESH_EXPIRY,
  } as SignOptions);
}

export function verifyAccessToken(token: string): TokenPayload {
  const decoded = jwt.verify(
    token,
    requireSecret('JWT_ACCESS_SECRET'),
  );
  return decoded as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  const decoded = jwt.verify(
    token,
    requireSecret('JWT_REFRESH_SECRET'),
  );
  return decoded as TokenPayload;
}

/**
 * Decode a refresh token WITHOUT verifying the signature.
 * Used to look up the token in the DB even if it has expired,
 * so we can revoke it explicitly.
 */
export function decodeRefreshToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.decode(token);
    return decoded as TokenPayload | null;
  } catch {
    return null;
  }
}

/** Convert a human-readable JWT expiry (e.g. "7d", "15m") to milliseconds. */
export function expiryStringToMs(expiry: string): number {
  const match = /^(\d+)([smhd])$/.exec(expiry.trim());
  if (!match) {
    throw new Error(`Invalid JWT expiry format: "${expiry}"`);
  }
  const value = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return value * multipliers[unit];
}
