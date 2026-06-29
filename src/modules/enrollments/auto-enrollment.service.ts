// src/modules/enrollments/auto-enrollment.service.ts
//
// Auto-enrollment rule engine.
//
// Rules define conditions under which a user should be auto-enrolled in a
// course. Supported rule types:
//   - ROLE: matches if user.role === ruleConfig.role
//   - DEPARTMENT: matches if user has a "department" attribute equal to
//     ruleConfig.department (NOTE: the User model doesn't have a department
//     field yet — this is forward-compatible; rules of this type will be
//     no-ops until departments are added)
//   - CUSTOM: ruleConfig.matches is an object of {field: value} pairs that
//     must all match against user attributes
//
// `applyRules(userId)` evaluates all active rules and enrolls the user in
// matching courses (skipping already-enrolled combinations).

import { Prisma, Role } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError, ValidationError } from '../../common/errors';
import { enrollUser } from './enrollment.service';
import type { CreateRuleInput, UpdateRuleInput } from './enrollment.schemas';

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

// ---------------------------------------------------------------------------
// Rule CRUD (admin only)
// ---------------------------------------------------------------------------

export async function createRule(
  data: CreateRuleInput,
  creatorId: string,
  creatorRole: Role,
): Promise<{ id: string; name: string; courseId: string; isActive: boolean }> {
  if (creatorRole !== 'ADMIN') {
    throw new ValidationError('Only admins can manage auto-enrollment rules');
  }
  if (!OBJECT_ID_RE.test(data.courseId)) {
    throw new NotFoundError('Course not found');
  }
  const course = await prisma.course.findUnique({
    where: { id: data.courseId },
    select: { id: true, status: true },
  });
  if (!course) throw new NotFoundError('Course not found');
  if (course.status !== 'PUBLISHED') {
    throw new ValidationError('Can only auto-enroll in PUBLISHED courses');
  }

  const rule = await prisma.autoEnrollmentRule.create({
    data: {
      name: data.name,
      ruleType: data.ruleType,
      ruleConfig: data.ruleConfig as Prisma.InputJsonValue,
      courseId: data.courseId,
      isActive: data.isActive,
    },
    select: { id: true, name: true, courseId: true, isActive: true },
  });
  return rule;
}

export async function listRules(): Promise<Array<{
  id: string;
  name: string;
  ruleType: string;
  ruleConfig: Prisma.JsonValue;
  courseId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  course: { id: string; title: string };
}>> {
  return prisma.autoEnrollmentRule.findMany({
    orderBy: { createdAt: 'desc' },
    include: { course: { select: { id: true, title: true } } },
  });
}

export async function updateRule(
  ruleId: string,
  data: UpdateRuleInput,
  updaterRole: Role,
): Promise<{ id: string; name: string; isActive: boolean }> {
  if (updaterRole !== 'ADMIN') {
    throw new ValidationError('Only admins can manage auto-enrollment rules');
  }
  if (!OBJECT_ID_RE.test(ruleId)) {
    throw new NotFoundError('Rule not found');
  }
  const existing = await prisma.autoEnrollmentRule.findUnique({ where: { id: ruleId } });
  if (!existing) throw new NotFoundError('Rule not found');

  const updated = await prisma.autoEnrollmentRule.update({
    where: { id: ruleId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.ruleType !== undefined && { ruleType: data.ruleType }),
      ...(data.ruleConfig !== undefined && { ruleConfig: data.ruleConfig as Prisma.InputJsonValue }),
      ...(data.courseId !== undefined && { courseId: data.courseId }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    select: { id: true, name: true, isActive: true },
  });
  return updated;
}

export async function deleteRule(ruleId: string, deleterRole: Role): Promise<{ id: string; deleted: boolean }> {
  if (deleterRole !== 'ADMIN') {
    throw new ValidationError('Only admins can manage auto-enrollment rules');
  }
  if (!OBJECT_ID_RE.test(ruleId)) {
    throw new NotFoundError('Rule not found');
  }
  const existing = await prisma.autoEnrollmentRule.findUnique({ where: { id: ruleId } });
  if (!existing) throw new NotFoundError('Rule not found');

  await prisma.autoEnrollmentRule.delete({ where: { id: ruleId } });
  return { id: ruleId, deleted: true };
}

// ---------------------------------------------------------------------------
// Rule evaluation
// ---------------------------------------------------------------------------

interface EvaluableUser {
  id: string;
  role: Role;
  // Forward-compat: any additional attributes the rule may match against.
  // We pull these from the User record directly so future fields like
  // "department" will work without code changes here.
  [key: string]: unknown;
}

function ruleMatchesUser(
  rule: { ruleType: string; ruleConfig: Prisma.JsonValue },
  user: EvaluableUser,
): boolean {
  const config = (rule.ruleConfig ?? {}) as Record<string, unknown>;
  switch (rule.ruleType) {
    case 'ROLE':
      return user.role === config.role;
    case 'DEPARTMENT':
      // Forward-compatible — until the User model gains a "department" field,
      // this always returns false.
      return user.department === config.department;
    case 'CUSTOM': {
      // `matches` is an object of {field: value} pairs.
      const matches = (config.matches ?? {}) as Record<string, unknown>;
      return Object.entries(matches).every(([k, v]) => user[k] === v);
    }
    default:
      return false;
  }
}

/**
 * Evaluate all active auto-enrollment rules for a single user and enroll
 * them in any matching courses (skipping courses they're already enrolled in).
 *
 * Returns the list of course IDs the user was newly enrolled in.
 */
export async function applyRules(
  userId: string,
  enrollerId: string,
  enrollerRole: Role,
): Promise<{ enrolledCourseIds: string[]; skippedCourseIds: string[] }> {
  if (!OBJECT_ID_RE.test(userId)) {
    throw new NotFoundError('User not found');
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, isActive: true },
  });
  if (!user) throw new NotFoundError('User not found');
  if (!user.isActive) throw new ValidationError('Cannot auto-enroll an inactive user');

  const rules = await prisma.autoEnrollmentRule.findMany({
    where: { isActive: true },
    include: { course: { select: { id: true, status: true } } },
  });

  const enrolledCourseIds: string[] = [];
  const skippedCourseIds: string[] = [];

  for (const rule of rules) {
    if (rule.course.status !== 'PUBLISHED') {
      skippedCourseIds.push(rule.courseId);
      continue;
    }
    if (!ruleMatchesUser(rule, user as EvaluableUser)) {
      continue;
    }
    try {
      await enrollUser(user.id, rule.courseId, enrollerId, enrollerRole);
      enrolledCourseIds.push(rule.courseId);
    } catch (err) {
      // Skip on conflict (already enrolled) — that's expected for idempotency.
      if (err instanceof Error && /already/i.test(err.message)) {
        skippedCourseIds.push(rule.courseId);
      } else {
        // eslint-disable-next-line no-console
        console.warn(`[auto-enroll] Rule "${rule.name}" failed for user ${user.id}:`, (err as Error).message);
        skippedCourseIds.push(rule.courseId);
      }
    }
  }

  return { enrolledCourseIds, skippedCourseIds };
}

/**
 * Trigger auto-enrollment for ALL active users (or a specific user if userId
 * is provided). Used by admins to retroactively apply rules.
 */
export async function triggerAutoEnrollment(
  targetUserId: string | undefined,
  enrollerId: string,
  enrollerRole: Role,
): Promise<{ usersProcessed: number; totalEnrollments: number }> {
  if (enrollerRole !== 'ADMIN') {
    throw new ValidationError('Only admins can trigger auto-enrollment');
  }

  const users = targetUserId
    ? await prisma.user.findMany({ where: { id: targetUserId, isActive: true }, select: { id: true } })
    : await prisma.user.findMany({ where: { isActive: true }, select: { id: true } });

  let totalEnrollments = 0;
  for (const u of users) {
    try {
      const result = await applyRules(u.id, enrollerId, enrollerRole);
      totalEnrollments += result.enrolledCourseIds.length;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`[auto-enroll] Failed for user ${u.id}:`, (err as Error).message);
    }
  }

  return { usersProcessed: users.length, totalEnrollments };
}
