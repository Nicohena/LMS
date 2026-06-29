// test/health.test.ts
// Tests for system health, maintenance mode, and basic platform settings.

import request from 'supertest';
import {
  app, loginAsAdmin, loginAsStudent,
  authGet, authPost, authPatch,
} from './helpers';

describe('Health & Settings', () => {
  describe('GET /api/v1/health (basic health check)', () => {
    it('should return health status with database connected', async () => {
      const res = await request(app).get('/api/v1/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.database).toBe('connected');
      expect(res.body.timestamp).toBeDefined();
    });

    it('should return pong on ping', async () => {
      const res = await request(app).get('/api/v1/ping');
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('pong');
    });
  });

  describe('System health check', () => {
    it('should return detailed system info for admin', async () => {
      const adminCookies = await loginAsAdmin();
      const res = await authGet('/api/v1/health/system', adminCookies);

      expect(res.status).toBe(200);
      expect(res.body.uptime).toBeDefined();
    });
  });

  describe('GET /api/v1/maintenance/status', () => {
    it('should return maintenance status (disabled by default)', async () => {
      const res = await request(app).get('/api/v1/maintenance/status');

      expect(res.status).toBe(200);
      expect(res.body.enabled).toBe(false);
    });
  });

  describe('POST /api/v1/maintenance/enable (admin only)', () => {
    it('should enable maintenance mode as admin', async () => {
      const adminCookies = await loginAsAdmin();
      const res = await authPost('/api/v1/maintenance/enable', adminCookies, {
        message: 'System maintenance',
        whitelist: ['127.0.0.1'],
      });

      expect(res.status).toBe(200);
      expect(res.body.enabled).toBe(true);

      // Verify status
      const statusRes = await request(app).get('/api/v1/maintenance/status');
      expect(statusRes.body.enabled).toBe(true);
    });

    it('should block students from enabling maintenance (403)', async () => {
      const studentCookies = await loginAsStudent();
      const res = await authPost('/api/v1/maintenance/enable', studentCookies, {
        message: 'Hack',
      });

      expect(res.status).toBe(403);
    });

    it('should disable maintenance mode as admin', async () => {
      const adminCookies = await loginAsAdmin();
      const res = await authPost('/api/v1/maintenance/disable', adminCookies);

      expect(res.status).toBe(200);
      expect(res.body.enabled).toBe(false);
    });
  });

  describe('GET /api/v1/settings (platform settings)', () => {
    it('should list settings as admin', async () => {
      const adminCookies = await loginAsAdmin();
      const res = await authGet('/api/v1/settings', adminCookies);

      expect(res.status).toBe(200);
      expect(res.body.settings).toBeDefined();
      expect(Array.isArray(res.body.settings)).toBe(true);
      expect(res.body.settings.length).toBeGreaterThan(0);
    });

    it('should block students from settings (403)', async () => {
      const studentCookies = await loginAsStudent();
      const res = await authGet('/api/v1/settings', studentCookies);
      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/v1/settings (update setting)', () => {
    it('should update a platform setting as admin', async () => {
      const adminCookies = await loginAsAdmin();
      const res = await authPatch('/api/v1/settings', adminCookies, {
        key: 'siteName',
        value: 'Test LMS Platform',
        category: 'general',
      });

      expect(res.status).toBe(200);
      expect(res.body.setting.value).toBe('Test LMS Platform');
    });
  });

  describe('GET /api/v1/health/system (system info)', () => {
    it('should return system info as admin', async () => {
      const adminCookies = await loginAsAdmin();
      const res = await authGet('/api/v1/health/system', adminCookies);

      expect(res.status).toBe(200);
      expect(res.body.uptime).toBeDefined();
      expect(res.body.memory).toBeDefined();
      expect(res.body.nodeVersion).toBeDefined();
    });

    it('should block students from system info (403)', async () => {
      const studentCookies = await loginAsStudent();
      const res = await authGet('/api/v1/health/system', studentCookies);
      expect(res.status).toBe(403);
    });
  });
});
