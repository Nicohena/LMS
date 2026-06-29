// test/settings.test.ts
// Tests for settings module: email templates, grading scales, academic years.

import request from 'supertest';
import {
  app, loginAsAdmin, loginAsStudent,
  authGet, authPost, authPatch, authDelete,
} from './helpers';

describe('Settings Module', () => {
  describe('Email Templates', () => {
    it('should list email templates as admin', async () => {
      const adminCookies = await loginAsAdmin();
      const res = await authGet('/api/v1/email-templates', adminCookies);

      expect(res.status).toBe(200);
      expect(res.body.templates).toBeDefined();
      expect(Array.isArray(res.body.templates)).toBe(true);
      // Default templates should be seeded
      expect(res.body.templates.length).toBeGreaterThan(0);
    });

    it('should render an email template', async () => {
      const adminCookies = await loginAsAdmin();
      const res = await authGet(
        '/api/v1/email-templates/WELCOME/render?firstName=John&email=john@test.com&siteName=TestLMS',
        adminCookies,
      );

      expect(res.status).toBe(200);
      expect(res.body.rendered).toBeDefined();
      expect(res.body.rendered.subject).toContain('John');
      expect(res.body.rendered.html).toBeDefined();
    });

    it('should block students from email templates (403)', async () => {
      const studentCookies = await loginAsStudent();
      const res = await authGet('/api/v1/email-templates', studentCookies);
      expect(res.status).toBe(403);
    });
  });

  describe('Grading Scales', () => {
    let scaleId: string;

    it('should create a grading scale as admin', async () => {
      const adminCookies = await loginAsAdmin();
      const res = await authPost('/api/v1/grading-scales', adminCookies, {
        name: 'Test A-F Scale',
        description: 'Standard grading',
        type: 'percentage',
        grades: [
          { letter: 'A', min: 90, max: 100, description: 'Excellent', gpa: 4.0 },
          { letter: 'B', min: 80, max: 89, description: 'Good', gpa: 3.0 },
          { letter: 'C', min: 70, max: 79, description: 'Satisfactory', gpa: 2.0 },
          { letter: 'F', min: 0, max: 69, description: 'Fail', gpa: 0.0 },
        ],
        isDefault: true,
      });

      expect(res.status).toBe(201);
      expect(res.body.scale.name).toBe('Test A-F Scale');
      scaleId = res.body.scale.id;
    });

    it('should convert a score to letter grade (public)', async () => {
      const res = await request(app).get(
        `/api/v1/grading-scales/convert?score=85&scaleId=${scaleId}`,
      );

      expect(res.status).toBe(200);
      expect(res.body.result.letter).toBe('B');
      expect(res.body.result.gpa).toBe(3.0);
    });

    it('should convert a score of 95 to A', async () => {
      const res = await request(app).get(
        `/api/v1/grading-scales/convert?score=95&scaleId=${scaleId}`,
      );

      expect(res.status).toBe(200);
      expect(res.body.result.letter).toBe('A');
    });

    it('should get default grading scale (public)', async () => {
      const res = await request(app).get('/api/v1/grading-scales/default');

      expect(res.status).toBe(200);
      expect(res.body.scale).toBeDefined();
      expect(res.body.scale.isDefault).toBe(true);
    });

    it('should list grading scales as admin', async () => {
      const adminCookies = await loginAsAdmin();
      const res = await authGet('/api/v1/grading-scales', adminCookies);

      expect(res.status).toBe(200);
      expect(res.body.scales.length).toBeGreaterThan(0);
    });
  });

  describe('Academic Years', () => {
    let yearId: string;

    it('should create an academic year as admin', async () => {
      const adminCookies = await loginAsAdmin();
      const res = await authPost('/api/v1/academic-years', adminCookies, {
        name: '2025-2026',
        startDate: '2025-09-01T00:00:00Z',
        endDate: '2026-06-30T00:00:00Z',
        isCurrent: true,
      });

      expect(res.status).toBe(201);
      expect(res.body.year.name).toBe('2025-2026');
      expect(res.body.year.isCurrent).toBe(true);
      yearId = res.body.year.id;
    });

    it('should get current academic year', async () => {
      const adminCookies = await loginAsAdmin();
      const res = await authGet('/api/v1/academic-years/current', adminCookies);

      expect(res.status).toBe(200);
      expect(res.body.year).toBeDefined();
      expect(res.body.year.isCurrent).toBe(true);
    });

    it('should list academic years as admin', async () => {
      const adminCookies = await loginAsAdmin();
      const res = await authGet('/api/v1/academic-years', adminCookies);

      expect(res.status).toBe(200);
      expect(res.body.years.length).toBeGreaterThan(0);
    });

    it('should block students from academic years (403)', async () => {
      const studentCookies = await loginAsStudent();
      const res = await authGet('/api/v1/academic-years', studentCookies);
      expect(res.status).toBe(403);
    });

    it('should reject overlapping academic year', async () => {
      const adminCookies = await loginAsAdmin();
      const res = await authPost('/api/v1/academic-years', adminCookies, {
        name: 'Overlapping 2025',
        startDate: '2025-10-01T00:00:00Z',
        endDate: '2026-01-01T00:00:00Z',
      });

      expect(res.status).toBe(409); // Conflict — overlaps with 2025-2026
    });
  });
});
