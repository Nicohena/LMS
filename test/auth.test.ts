// test/auth.test.ts
// Tests for the authentication module: login, refresh, logout, change-password, RBAC.

import request from 'supertest';
import {
  app, login, loginAsAdmin, loginAsStudent, authPost, authPatch,
} from './helpers';
import { prisma } from '../src/lib/prisma';

describe('Auth Module', () => {
  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@test.com', password: 'Admin123!' });

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('admin@test.com');
      expect(res.body.mustChangePassword).toBe(false);
      expect(res.headers['set-cookie']).toBeDefined();

      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies.some((c) => c.startsWith('accessToken='))).toBe(true);
      expect(cookies.some((c) => c.startsWith('refreshToken='))).toBe(true);
    });

    it('should return 401 for invalid password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@test.com', password: 'WrongPassword!' });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/invalid email or password/i);
    });

    it('should return 401 for non-existent user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@test.com', password: 'SomePassword!' });

      expect(res.status).toBe(401);
    });

    it('should return 400 for invalid email format', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'not-an-email', password: 'short' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/validation failed/i);
    });

    it('should return 400 for missing fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@test.com' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh tokens successfully', async () => {
      const adminCookies = await loginAsAdmin();

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', adminCookies.cookieHeader);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/tokens refreshed/i);
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should return 401 without a refresh token', async () => {
      const res = await request(app).post('/api/v1/auth/refresh');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully and clear cookies', async () => {
      const adminCookies = await loginAsAdmin();

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', adminCookies.cookieHeader);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/logged out/i);
    });
  });

  describe('POST /api/v1/auth/change-password', () => {
    it('should change password successfully', async () => {
      // Use admin to change password since student password may have been
      // changed in previous test runs — re-login as admin (stable)
      const adminCookies = await loginAsAdmin();

      const res = await authPost(
        '/api/v1/auth/change-password',
        adminCookies,
        { oldPassword: 'Admin123!', newPassword: 'NewAdmin123!' },
      );

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/password updated/i);

      // Revert the password back so other tests can still login as admin
      const newCookies = await login('admin@test.com', 'NewAdmin123!');
      await authPost(
        '/api/v1/auth/change-password',
        newCookies,
        { oldPassword: 'NewAdmin123!', newPassword: 'Admin123!' },
      );
    });

    it('should reject change with wrong old password', async () => {
      const adminCookies = await loginAsAdmin();

      const res = await authPost(
        '/api/v1/auth/change-password',
        adminCookies,
        { oldPassword: 'WrongOld123!', newPassword: 'NewPassword123!' },
      );

      expect(res.status).toBe(401);
    });

    it('should reject without authentication', async () => {
      const res = await request(app)
        .post('/api/v1/auth/change-password')
        .send({ oldPassword: 'Student123!', newPassword: 'NewPassword123!' });

      expect(res.status).toBe(401);
    });
  });

  describe('RBAC — protected endpoints', () => {
    it('should allow admin to access /api/v1/admin-only', async () => {
      const adminCookies = await loginAsAdmin();
      const res = await request(app)
        .get('/api/v1/admin-only')
        .set('Cookie', adminCookies.cookieHeader);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/admin access granted/i);
    });

    it('should block student from /api/v1/admin-only (403)', async () => {
      const studentCookies = await loginAsStudent();
      const res = await request(app)
        .get('/api/v1/admin-only')
        .set('Cookie', studentCookies.cookieHeader);

      expect(res.status).toBe(403);
    });

    it('should block unauthenticated from /api/v1/admin-only (401)', async () => {
      const res = await request(app).get('/api/v1/admin-only');
      expect(res.status).toBe(401);
    });
  });
});
