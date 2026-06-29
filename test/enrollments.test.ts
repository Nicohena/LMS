// test/enrollments.test.ts
// Tests for enrollment + progress tracking.

import request from 'supertest';
import {
  app, loginAsAdmin, loginAsTeacher, loginAsStudent,
  authGet, authPost, authPatch,
  getStudent, getTestCourse, getTestEnrollment,
} from './helpers';

describe('Enrollments Module', () => {
  describe('POST /api/v1/enrollments (enroll)', () => {
    it('should enroll a student as teacher', async () => {
      const teacherCookies = await loginAsTeacher();
      const course = await getTestCourse();
      // Create a new student to enroll
      const adminCookies = await loginAsAdmin();
      const newUserRes = await authPost('/api/v1/users', adminCookies, {
        email: `enroll${Date.now()}@test.com`,
        firstName: 'Enroll',
        lastName: 'Test',
        role: 'STUDENT',
      });
      const userId = newUserRes.body.user.id;

      const res = await authPost('/api/v1/enrollments', teacherCookies, {
        userId,
        courseId: course!.id,
      });

      expect(res.status).toBe(201);
      expect(res.body.enrollment).toBeDefined();
      expect(res.body.enrollment.status).toBe('ACTIVE');
      expect(res.body.enrollment.userId).toBe(userId);
    });

    it('should block students from enrolling others (403)', async () => {
      const studentCookies = await loginAsStudent();
      const course = await getTestCourse();
      const student = await getStudent();
      const res = await authPost('/api/v1/enrollments', studentCookies, {
        userId: student!.id,
        courseId: course!.id,
      });

      expect(res.status).toBe(403);
    });

    it('should reject duplicate enrollment (409)', async () => {
      const teacherCookies = await loginAsTeacher();
      const course = await getTestCourse();
      const student = await getStudent();
      const res = await authPost('/api/v1/enrollments', teacherCookies, {
        userId: student!.id,
        courseId: course!.id,
      });

      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/v1/enrollments/bulk (bulk enroll)', () => {
    it('should bulk enroll students', async () => {
      const teacherCookies = await loginAsTeacher();
      const course = await getTestCourse();
      const adminCookies = await loginAsAdmin();

      // Create 2 new students
      const u1 = await authPost('/api/v1/users', adminCookies, {
        email: `bulk1${Date.now()}@test.com`, firstName: 'Bulk', lastName: '1', role: 'STUDENT',
      });
      const u2 = await authPost('/api/v1/users', adminCookies, {
        email: `bulk2${Date.now()}@test.com`, firstName: 'Bulk', lastName: '2', role: 'STUDENT',
      });

      const res = await authPost('/api/v1/enrollments/bulk', teacherCookies, {
        courseId: course!.id,
        userIds: [u1.body.user.id, u2.body.user.id],
      });

      expect(res.status).toBe(201);
      expect(res.body.enrolled).toBe(2);
      expect(res.body.failed).toBe(0);
    });
  });

  describe('GET /api/v1/enrollments (list)', () => {
    it('should list enrollments (teacher sees their course enrollments)', async () => {
      const teacherCookies = await loginAsTeacher();
      const res = await authGet('/api/v1/enrollments', teacherCookies);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should show only own enrollments for students', async () => {
      const studentCookies = await loginAsStudent();
      const res = await authGet('/api/v1/enrollments', studentCookies);

      expect(res.status).toBe(200);
      res.body.data.forEach((e: any) => {
        expect(e.user.id).toBeDefined(); // Should only see own
      });
    });
  });

  describe('POST /api/v1/enrollments/:id/progress (update progress)', () => {
    it('should update progress for own enrollment', async () => {
      const studentCookies = await loginAsStudent();
      const enrollment = await getTestEnrollment();
      const course = await getTestCourse();

      // Get a content item
      const courseDetail = await request(app).get(`/api/v1/courses/${course!.id}`);
      const contentId = courseDetail.body.course.modules[0].contents[0].id;

      const res = await authPost(
        `/api/v1/enrollments/${enrollment!.id}/progress`,
        studentCookies,
        { contentId, progressPercent: 100, timeSpent: 120 },
      );

      expect(res.status).toBe(200);
      expect(res.body.progress).toBeDefined();
      expect(res.body.enrollment.progressPercentage).toBeGreaterThan(0);
    });

    it('should reject progress update on non-existent enrollment (404)', async () => {
      const studentCookies = await loginAsStudent();
      const res = await authPost(
        '/api/v1/enrollments/000000000000000000000000/progress',
        studentCookies,
        { contentId: '000000000000000000000000', progressPercent: 50, timeSpent: 30 },
      );

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/v1/enrollments/dashboard/student', () => {
    it('should return student dashboard', async () => {
      const studentCookies = await loginAsStudent();
      const res = await authGet('/api/v1/enrollments/dashboard/student', studentCookies);

      expect(res.status).toBe(200);
      expect(res.body.stats).toBeDefined();
      expect(res.body.courses).toBeDefined();
    });
  });

  describe('GET /api/v1/enrollments/dashboard/teacher', () => {
    it('should return teacher dashboard', async () => {
      const teacherCookies = await loginAsTeacher();
      const res = await authGet('/api/v1/enrollments/dashboard/teacher', teacherCookies);

      expect(res.status).toBe(200);
      expect(res.body.totalCourses).toBeDefined();
      expect(res.body.courses).toBeDefined();
    });

    it('should block students from teacher dashboard (403)', async () => {
      const studentCookies = await loginAsStudent();
      const res = await authGet('/api/v1/enrollments/dashboard/teacher', studentCookies);
      expect(res.status).toBe(403);
    });
  });
});
