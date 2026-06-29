// src/modules/auth/auth.types.ts
import type { Role } from '@prisma/client';

/** JWT payload embedded inside both access and refresh tokens. */
export interface TokenPayload {
  sub: string; // user id
  email: string;
  role: Role;
}

/** Pair of tokens issued by login/refresh. */
export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

/** Public user object returned by login (no sensitive fields). */
export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLogin: Date | null;
}

/** Result of a successful login. */
export interface LoginResult {
  user: PublicUser;
  tokens: Tokens;
  mustChangePassword: boolean;
}
