// src/modules/auth/auth.controller.ts
import type { Request, Response, NextFunction } from 'express';
import {
  login as loginService,
  refresh as refreshService,
  logout as logoutService,
  changePassword as changePasswordService,
  register as registerService,
  forgotPassword as forgotPasswordService,
  resetPassword as resetPasswordService,
  AuthError,
} from './auth.service';
import {
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
  clearCookieCommonOptions,
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from '../../common/utils/cookie.utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getClientIp(req: Request): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip ?? req.socket?.remoteAddress ?? undefined;
}

function getUserAgent(req: Request): string | undefined {
  const ua = req.headers['user-agent'];
  return typeof ua === 'string' ? ua : undefined;
}

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, accessTokenCookieOptions);
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, refreshTokenCookieOptions);
}

function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_TOKEN_COOKIE, clearCookieCommonOptions);
  res.clearCookie(REFRESH_TOKEN_COOKIE, clearCookieCommonOptions);
}

// ---------------------------------------------------------------------------
// Controllers
// ---------------------------------------------------------------------------

export async function loginController(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const result = await loginService(email, password, {
      ip: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);

    res.status(200).json({
      message: 'Login successful',
      user: result.user,
      mustChangePassword: result.mustChangePassword,
    });
  } catch (err) {
    next(err);
  }
}

export async function refreshController(req: Request, res: Response, next: NextFunction) {
  try {
    // Prefer cookie; fall back to body for non-browser clients (e.g. mobile).
    const refreshToken =
      (req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined) ||
      req.body?.refreshToken;

    if (!refreshToken) {
      res.status(401).json({ message: 'No refresh token provided.' });
      return;
    }

    const tokens = await refreshService(refreshToken);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    res.status(200).json({ message: 'Tokens refreshed.' });
  } catch (err) {
    // If the refresh failed, clear cookies so the client re-authenticates.
    clearAuthCookies(res);
    next(err);
  }
}

export async function logoutController(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken =
      (req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined) ||
      req.body?.refreshToken;

    await logoutService(refreshToken);
    clearAuthCookies(res);

    res.status(200).json({ message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
}

export async function changePasswordController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user!.sub; // `authenticate` middleware guarantees this
    const result = await changePasswordService(userId, oldPassword, newPassword);

    // After password change, all refresh tokens are revoked. Clear cookies.
    clearAuthCookies(res);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/auth/register — self-registration (public, checks allowRegistration setting)
// ---------------------------------------------------------------------------
export async function registerController(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, firstName, lastName } = req.body;
    const result = await registerService({ email, password, firstName, lastName });
    // Set auth cookies on registration (auto-login)
    setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
    res.status(201).json({
      message: 'Registration successful.',
      user: result.user,
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/auth/forgot-password — request password reset email (public)
// ---------------------------------------------------------------------------
export async function forgotPasswordController(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;
    const result = await forgotPasswordService(email);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/auth/reset-password — reset password with token (public)
// ---------------------------------------------------------------------------
export async function resetPasswordController(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, newPassword } = req.body;
    const result = await resetPasswordService(token, newPassword);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Error handler for AuthError — converts service errors to HTTP responses.
// Mount this AFTER the auth router so it catches only auth errors.
// ---------------------------------------------------------------------------

export function authErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (err instanceof AuthError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }
  next(err);
}
