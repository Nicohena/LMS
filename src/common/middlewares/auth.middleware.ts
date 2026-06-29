// src/common/middlewares/auth.middleware.ts
import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.utils';
import { ACCESS_TOKEN_COOKIE } from '../utils/cookie.utils';

/**
 * Authenticate middleware.
 *
 * Reads the access token from the `accessToken` HTTP-only cookie.
 * On success, attaches the decoded payload to `req.user` and calls next().
 * On failure, responds with 401.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.[ACCESS_TOKEN_COOKIE] as string | undefined;

  if (!token) {
    res.status(401).json({ message: 'Unauthorized: no access token provided.' });
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Auth middleware: invalid access token', err);
    res.status(401).json({ message: 'Unauthorized: invalid or expired access token.' });
  }
}

/**
 * Optional-authentication middleware.
 *
 * Like `authenticate`, but never fails — if a valid token is present, it is
 * attached to `req.user`; if not, the request continues anonymously.
 *
 * Useful for public endpoints that behave differently based on whether the
 * caller is logged in (e.g. course list/detail views where logged-in
 * admins/teachers see DRAFT courses but anonymous users only see PUBLISHED).
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[ACCESS_TOKEN_COOKIE] as string | undefined;

  if (!token) {
    next();
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    // Invalid/expired token — treat as anonymous, don't fail.
  }

  next();
}
