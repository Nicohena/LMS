// test/helpers.ts
// Utility functions for integration tests.

import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/common/utils/password.utils';

export { app };

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

export interface AuthCookies {
  accessToken: string;
  refreshToken: string;
  cookieHeader: string;
}

/**
 * Login as a user and return the auth cookies.
 */
export async function login(email: string, password: string): Promise<AuthCookies> {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });

  if (res.status !== 200) {
    throw new Error(`Login failed for ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  }

  // Extract cookies from Set-Cookie header
  const setCookies = res.headers['set-cookie'] as unknown as string[];
  const accessTokenCookie = setCookies?.find((c) => c.startsWith('accessToken=')) || '';
  const refreshTokenCookie = setCookies?.find((c) => c.startsWith('refreshToken=')) || '';

  const accessToken = accessTokenCookie.split(';')[0].replace('accessToken=', '');
  const refreshToken = refreshTokenCookie.split(';')[0].replace('refreshToken=', '');

  return {
    accessToken,
    refreshToken,
    cookieHeader: `accessToken=${accessToken}; refreshToken=${refreshToken}`,
  };
}

/**
 * Login as the seeded admin user.
 */
export async function loginAsAdmin(): Promise<AuthCookies> {
  return login('admin@test.com', 'Admin123!');
}

/**
 * Login as the seeded teacher user.
 */
export async function loginAsTeacher(): Promise<AuthCookies> {
  return login('teacher@test.com', 'Teacher123!');
}

/**
 * Login as the seeded student user.
 */
export async function loginAsStudent(): Promise<AuthCookies> {
  return login('student@test.com', 'Student123!');
}

// ---------------------------------------------------------------------------
// User creation helpers
// ---------------------------------------------------------------------------

/**
 * Create a test user directly in the DB (bypasses API).
 */
export async function createTestUser(opts: {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: 'ADMIN' | 'TEACHER' | 'STUDENT';
  isActive?: boolean;
}) {
  const email = opts.email || `testuser${Date.now()}${Math.random().toString(36).slice(2, 6)}@test.com`;
  const password = opts.password || 'TestPass123!';
  const hash = await hashPassword(password);

  return prisma.user.create({
    data: {
      email,
      passwordHash: hash,
      firstName: opts.firstName || 'Test',
      lastName: opts.lastName || 'User',
      role: opts.role || 'STUDENT',
      isActive: opts.isActive ?? true,
      mustChangePassword: false,
    },
  });
}

// ---------------------------------------------------------------------------
// Database helpers
// ---------------------------------------------------------------------------

/**
 * Get the seeded admin user.
 */
export async function getAdmin() {
  return prisma.user.findUnique({ where: { email: 'admin@test.com' } });
}

/**
 * Get the seeded teacher user.
 */
export async function getTeacher() {
  return prisma.user.findUnique({ where: { email: 'teacher@test.com' } });
}

/**
 * Get the seeded student user.
 */
export async function getStudent() {
  return prisma.user.findUnique({ where: { email: 'student@test.com' } });
}

/**
 * Get the seeded course (searches by description since title may be changed by tests).
 */
export async function getTestCourse() {
  return prisma.course.findFirst({ where: { description: 'A test course for integration testing' } });
}

/**
 * Get the seeded enrollment for the student.
 */
export async function getTestEnrollment() {
  const student = await getStudent();
  if (!student) return null;
  return prisma.enrollment.findFirst({ where: { userId: student.id } });
}

// ---------------------------------------------------------------------------
// Request helper with cookies
// ---------------------------------------------------------------------------

/**
 * Make an authenticated GET request.
 */
export function authGet(url: string, cookies: AuthCookies) {
  return request(app).get(url).set('Cookie', cookies.cookieHeader);
}

/**
 * Make an authenticated POST request.
 */
export function authPost(url: string, cookies: AuthCookies, body?: unknown) {
  return request(app).post(url).set('Cookie', cookies.cookieHeader).send(body || {});
}

/**
 * Make an authenticated PATCH request.
 */
export function authPatch(url: string, cookies: AuthCookies, body?: unknown) {
  return request(app).patch(url).set('Cookie', cookies.cookieHeader).send(body || {});
}

/**
 * Make an authenticated DELETE request.
 */
export function authDelete(url: string, cookies: AuthCookies) {
  return request(app).delete(url).set('Cookie', cookies.cookieHeader);
}
