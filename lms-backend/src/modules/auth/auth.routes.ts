// src/modules/auth/auth.routes.ts
import { Router } from 'express';
import {
  loginController,
  refreshController,
  logoutController,
  changePasswordController,
  authErrorHandler,
} from './auth.controller';
import { authenticate } from '../../common/middlewares/auth.middleware';
import { validate } from '../../common/middlewares/validation.middleware';
import { loginSchema, changePasswordSchema, refreshSchema } from './auth.schemas';

const router = Router();

/**
 * POST /api/v1/auth/login
 * Body: { email, password }
 * Public endpoint.
 */
router.post('/login', validate({ body: loginSchema }), loginController);

/**
 * POST /api/v1/auth/refresh
 * Reads refresh token from cookie, falls back to body.refreshToken.
 * Public endpoint.
 */
router.post('/refresh', validate({ body: refreshSchema }), refreshController);

/**
 * POST /api/v1/auth/logout
 * Reads refresh token from cookie, falls back to body.refreshToken.
 * Public endpoint (always succeeds; clears cookies regardless).
 */
router.post('/logout', logoutController);

/**
 * POST /api/v1/auth/change-password
 * Requires valid access token. Body: { oldPassword, newPassword }.
 */
router.post(
  '/change-password',
  authenticate,
  validate({ body: changePasswordSchema }),
  changePasswordController,
);

// Convert AuthError instances into HTTP responses.
router.use(authErrorHandler);

export default router;
