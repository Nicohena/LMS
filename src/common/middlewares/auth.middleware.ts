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
