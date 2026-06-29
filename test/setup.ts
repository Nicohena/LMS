// test/setup.ts
// Global test setup — runs before all test files.
// Loads test env vars, cleans the test database, and seeds baseline data.

import dotenv from 'dotenv';
import path from 'node:path';

// Load .env.test BEFORE importing anything that reads process.env
dotenv.config({ path: path.resolve(__dirname, '../.env.test'), override: true });

import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/common/utils/password.utils';
import { seedDefaultSettings } from '../src/modules/settings/setting.service';
import { seedDefaultTemplates } from '../src/modules/settings/email-template.service';

// Seed baseline data that most tests rely on
export async function seedBaselineData() {
  // Create admin user
  const adminHash = await hashPassword('Admin123!');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      passwordHash: adminHash,
      firstName: 'Test',
      lastName: 'Admin',
      role: 'ADMIN',
      isActive: true,
      mustChangePassword: false,
    },
  });

  // Create teacher user
  const teacherHash = await hashPassword('Teacher123!');
  const teacher = await prisma.user.create({
    data: {
      email: 'teacher@test.com',
      passwordHash: teacherHash,
      firstName: 'Test',
      lastName: 'Teacher',
      role: 'TEACHER',
      isActive: true,
      mustChangePassword: false,
    },
  });

  // Create student user
  const studentHash = await hashPassword('Student123!');
  const student = await prisma.user.create({
    data: {
      email: 'student@test.com',
      passwordHash: studentHash,
      firstName: 'Test',
      lastName: 'Student',
      role: 'STUDENT',
      isActive: true,
      mustChangePassword: false,
    },
  });

  // Create a published course owned by the teacher
  const course = await prisma.course.create({
    data: {
      title: 'Test Course',
      description: 'A test course for integration testing',
      status: 'PUBLISHED',
      difficulty: 'BEGINNER',
      createdBy: teacher.id,
    },
  });

  // Create a module with content
  const module1 = await prisma.module.create({
    data: { courseId: course.id, title: 'Test Module 1', order: 0 },
  });

  await prisma.content.create({
    data: { moduleId: module1.id, type: 'PAGE', title: 'Test Page', order: 0 },
  });

  // Enroll the student
  await prisma.enrollment.create({
    data: { userId: student.id, courseId: course.id, status: 'ACTIVE' },
  });

  return { admin, teacher, student, course, module1 };
}

// Clean all data from the test database (preserves nothing)
export async function clearDatabase() {
  // Delete in dependency order (children first) — wrap each in try/catch
  // since some collections may not exist yet in a fresh test DB
  const models = [
    'answer', 'manualGrading', 'quizAttempt', 'question', 'quiz',
    'peerReview', 'gradeHistory', 'submission', 'rubric', 'assignment',
    'progress', 'enrollment', 'autoEnrollmentRule',
    'certificate', 'certificateTemplate',
    'userBadge', 'badgeTemplate', 'xPTransaction', 'userLevel', 'learningStreak',
    'notificationPreference', 'notification',
    'discussionReply', 'discussion',
    'message', 'messageGroupMember', 'messageGroup',
    'announcement',
    'reportHistory', 'scheduledReport', 'reportTemplate',
    'auditLog', 'platformSetting', 'emailTemplate', 'gradingScale', 'academicYear',
    'leaderboardSnapshot', 'levelThreshold', 'xPRule',
    'content', 'module', 'course',
    'refreshToken', 'user',
  ];

  for (const model of models) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma as any)[model].deleteMany({});
    } catch {
      // Collection may not exist yet — ignore
    }
  }
}

// Global setup — runs once before all test files
beforeAll(async () => {
  await clearDatabase();
  await seedBaselineData();
  // Seed default platform settings + email templates (normally done in server.ts startup)
  await seedDefaultSettings().catch(() => null);
  await seedDefaultTemplates().catch(() => null);
}, 120000); // 2 minute timeout for setup

// Global teardown — runs once after all test files
afterAll(async () => {
  await clearDatabase();
  await prisma.$disconnect();
}, 120000);
