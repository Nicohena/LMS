// src/common/utils/cookie.utils.ts
import type { CookieOptions } from 'express';

const isProduction = process.env.NODE_ENV === 'production';

/** Common defaults for both cookies. */
const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  path: '/',
};

export const accessTokenCookieOptions: CookieOptions = {
  ...baseCookieOptions,
  maxAge: 15 * 60 * 1000, // 15 minutes (mirrors JWT_ACCESS_EXPIRY)
};

export const refreshTokenCookieOptions: CookieOptions = {
  ...baseCookieOptions,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (mirrors JWT_REFRESH_EXPIRY)
};

export const clearCookieCommonOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  path: '/',
};

export const ACCESS_TOKEN_COOKIE = 'accessToken';
export const REFRESH_TOKEN_COOKIE = 'refreshToken';
