// test/courses.test.ts
// Tests for the course management module: CRUD, visibility, modules, content.

import request from 'supertest';
import {
  app, loginAsAdmin, loginAsTeacher, loginAsStudent,
  authGet, authPost, authPatch, authDelete,
  getTeacher, getTestCourse,
} from './helpers';

describe('Courses Module', () => {
  describe('GET /api/v1/courses (public list)', () => {
    it('should list published courses for anonymous users', async () => {
      const res = await request(app).get('/api/v1/courses');

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
      // All visible courses should be PUBLISHED
      res.body.data.forEach((c: any) => {
        expect(c.status).toBe('PUBLISHED');
      });
    });

    it('should support search filter', async () => {
      const res = await request(app).get('/api/v1/courses?search=Test');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should support pagination', async () => {
      const res = await request(app).get('/api/v1/courses?page=1&limit=5');
      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(5);
    });
  });

  describe('POST /api/v1/courses (create)', () => {
    it('should create a course as teacher', async () => {
      const teacherCookies = await loginAsTeacher();
      const res = await authPost('/api/v1/courses', teacherCookies, {
        title: 'New Test Course',
        description: 'Created by teacher',
        category: 'Testing',
        difficulty: 'INTERMEDIATE',
      });

      expect(res.status).toBe(201);
      expect(res.body.course).toBeDefined();
      expect(res.body.course.title).toBe('New Test Course');
      expect(res.body.course.status).toBe('DRAFT'); // default
      expect(res.body.course.createdBy.email).toBe('teacher@test.com');
    });

    it('should block students from creating courses (403)', async () => {
      const studentCookies = await loginAsStudent();
      const res = await authPost('/api/v1/courses', studentCookies, {
        title: 'Should Fail',
      });

      expect(res.status).toBe(403);
    });

    it('should reject missing title (400)', async () => {
      const teacherCookies = await loginAsTeacher();
      const res = await authPost('/api/v1/courses', teacherCookies, {
        description: 'No title',
      });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/courses/:id (detail)', () => {
    it('should get course detail with modules and content', async () => {
      const course = await getTestCourse();
      const res = await request(app).get(`/api/v1/courses/${course!.id}`);

      expect(res.status).toBe(200);
      expect(res.body.course).toBeDefined();
      expect(res.body.course.title).toBeDefined();
      expect(res.body.course.modules).toBeDefined();
      expect(Array.isArray(res.body.course.modules)).toBe(true);
    });

    it('should return 404 for non-existent course', async () => {
      const res = await request(app).get('/api/v1/courses/000000000000000000000000');
      expect(res.status).toBe(404);
    });

    it('should return 404 for malformed ID', async () => {
      const res = await request(app).get('/api/v1/courses/not-valid');
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/courses/:id (update)', () => {
    it('should update course as owner (teacher)', async () => {
      const teacherCookies = await loginAsTeacher();
      const course = await getTestCourse();
      const res = await authPatch(`/api/v1/courses/${course!.id}`, teacherCookies, {
        title: 'Updated Test Course',
        status: 'PUBLISHED',
      });

      expect(res.status).toBe(200);
      expect(res.body.course.title).toBe('Updated Test Course');
      expect(res.body.course.status).toBe('PUBLISHED');
    });

    it('should block teacher from updating another teacher\'s course (403)', async () => {
      const adminCookies = await loginAsAdmin();
      // Admin creates a course
      const createRes = await authPost('/api/v1/courses', adminCookies, {
        title: 'Admin Course',
        status: 'PUBLISHED',
      });
      const courseId = createRes.body.course.id;

      // Teacher tries to update it
      const teacherCookies = await loginAsTeacher();
      const res = await authPatch(`/api/v1/courses/${courseId}`, teacherCookies, {
        title: 'Hacked',
      });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/v1/courses/:id (archive)', () => {
    it('should archive course as admin', async () => {
      const adminCookies = await loginAsAdmin();
      // Create a course to archive
      const createRes = await authPost('/api/v1/courses', adminCookies, {
        title: 'To Archive',
      });
      const courseId = createRes.body.course.id;

      const res = await authDelete(`/api/v1/courses/${courseId}`, adminCookies);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ARCHIVED');
    });
  });

  describe('Course modules + content', () => {
    it('should add a module to a course', async () => {
      const teacherCookies = await loginAsTeacher();
      const course = await getTestCourse();
      const res = await authPost(`/api/v1/courses/${course!.id}/modules`, teacherCookies, {
        title: 'New Module',
        description: 'Test module',
      });

      expect(res.status).toBe(201);
      expect(res.body.module.title).toBe('New Module');
      expect(res.body.module.order).toBe(1); // auto-append after existing module
    });

    it('should add content to a module', async () => {
      const teacherCookies = await loginAsTeacher();
      const course = await getTestCourse();
      // Get course to find module ID
      const detailRes = await authGet(`/api/v1/courses/${course!.id}`, teacherCookies);
      const moduleId = detailRes.body.course.modules[0].id;

      const res = await authPost(`/api/v1/courses/modules/${moduleId}/contents`, teacherCookies, {
        type: 'VIDEO',
        title: 'Test Video',
        videoUrl: 'https://example.com/video.mp4',
        duration: 300,
      });

      expect(res.status).toBe(201);
      expect(res.body.content.title).toBe('Test Video');
      expect(res.body.content.type).toBe('VIDEO');
    });

    it('should block students from adding modules (403)', async () => {
      const studentCookies = await loginAsStudent();
      const course = await getTestCourse();
      const res = await authPost(`/api/v1/courses/${course!.id}/modules`, studentCookies, {
        title: 'Hack Module',
      });

      expect(res.status).toBe(403);
    });
  });
});
