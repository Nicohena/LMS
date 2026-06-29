// src/modules/enrollments/enrollment.controller.ts
import type { Request, Response, NextFunction } from 'express';
import {
  enrollUser,
  bulkEnroll,
  cancelEnrollment,
  getEnrollments,
  getEnrollment,
  updateProgress,
  getStudentDashboard,
  getTeacherDashboard,
  getNextContentForEnrollment,
} from './enrollment.service';
import {
  createRule,
  listRules,
  updateRule,
  deleteRule,
  applyRules,
  triggerAutoEnrollment,
} from './auto-enrollment.service';
import { logAction } from '../../common/services/audit.service';
import { getClientIp, getUserAgent } from '../../common/services/upload.service';
import { isHttpError } from '../../common/errors';
import type { EnrollmentFilters } from './enrollment.types';
import type { EnrollmentQueryInput } from './enrollment.schemas';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toEnrollmentFilters(query: EnrollmentQueryInput): EnrollmentFilters {
  return {
    page: query.page,
    limit: query.limit,
    status: query.status,
    courseId: query.courseId,
    userId: query.userId,
    search: query.search,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  };
}

function paramId(req: Request, key: string): string {
  const v = req.params[key];
  return Array.isArray(v) ? v[0] : v;
}

function auditCtx(req: Request) {
  return { ip: getClientIp(req), userAgent: getUserAgent(req) };
}

// ---------------------------------------------------------------------------
// Enrollment endpoints
// ---------------------------------------------------------------------------

export async function enrollUserController(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, courseId } = req.body;
    const enrollerId = req.user!.sub;
    const enrollerRole = req.user!.role;
    const enrollment = await enrollUser(userId, courseId, enrollerId, enrollerRole);

    await logAction({
      userId: enrollerId,
      action: 'ENROLLMENT_CREATE',
      entityType: 'Enrollment',
      entityId: enrollment.id,
      details: { enrolledUserId: userId, courseId },
      context: auditCtx(req),
    });

    res.status(201).json({ message: 'User enrolled.', enrollment });
  } catch (err) {
    next(err);
  }
}

export async function bulkEnrollController(req: Request, res: Response, next: NextFunction) {
  try {
    const { courseId, userIds } = req.body;
    const enrollerId = req.user!.sub;
    const enrollerRole = req.user!.role;
    const result = await bulkEnroll(courseId, userIds, enrollerId, enrollerRole);

    await logAction({
      userId: enrollerId,
      action: 'ENROLLMENT_BULK_CREATE',
      entityType: 'Course',
      entityId: courseId,
      details: { userIds, enrolled: result.enrolled, failed: result.failed },
      context: auditCtx(req),
    });

    res.status(201).json({
      message: `Bulk enroll complete: ${result.enrolled} enrolled, ${result.failed} failed (of ${result.total} users).`,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

export async function cancelEnrollmentController(req: Request, res: Response, next: NextFunction) {
  try {
    const enrollmentId = paramId(req, 'enrollmentId');
    const { reason } = req.body ?? {};
    const viewer = { id: req.user!.sub, role: req.user!.role };
    const result = await cancelEnrollment(enrollmentId, reason, viewer);

    await logAction({
      userId: viewer.id,
      action: 'ENROLLMENT_CANCEL',
      entityType: 'Enrollment',
      entityId: enrollmentId,
      details: { reason },
      context: auditCtx(req),
    });

    res.status(200).json({ message: 'Enrollment cancelled (dropped).', ...result });
  } catch (err) {
    next(err);
  }
}

export async function getEnrollmentsController(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = toEnrollmentFilters(req.validated!.query as unknown as EnrollmentQueryInput);
    const viewer = { id: req.user!.sub, role: req.user!.role };
    const result = await getEnrollments(filters, viewer);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getEnrollmentController(req: Request, res: Response, next: NextFunction) {
  try {
    const enrollmentId = paramId(req, 'enrollmentId');
    const viewer = { id: req.user!.sub, role: req.user!.role };
    const enrollment = await getEnrollment(enrollmentId, viewer);
    res.status(200).json({ enrollment });
  } catch (err) {
    next(err);
  }
}

export async function updateProgressController(req: Request, res: Response, next: NextFunction) {
  try {
    const enrollmentId = paramId(req, 'enrollmentId');
    const viewer = { id: req.user!.sub, role: req.user!.role };
    const result = await updateProgress(enrollmentId, req.body, viewer);

    await logAction({
      userId: viewer.id,
      action: 'PROGRESS_UPDATE',
      entityType: 'Content',
      entityId: req.body.contentId,
      details: {
        enrollmentId,
        progressPercent: req.body.progressPercent,
        timeSpent: req.body.timeSpent,
        overallProgress: result.enrollment.progressPercentage,
      },
      context: auditCtx(req),
    });

    res.status(200).json({
      message: 'Progress updated.',
      progress: result.progress,
      enrollment: result.enrollment,
    });
  } catch (err) {
    next(err);
  }
}

export async function getStudentDashboardController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;
    const dashboard = await getStudentDashboard(userId);
    res.status(200).json(dashboard);
  } catch (err) {
    next(err);
  }
}

export async function getTeacherDashboardController(req: Request, res: Response, next: NextFunction) {
  try {
    const teacherId = req.user!.sub;
    const dashboard = await getTeacherDashboard(teacherId);
    res.status(200).json(dashboard);
  } catch (err) {
    next(err);
  }
}

export async function getNextContentController(req: Request, res: Response, next: NextFunction) {
  try {
    const enrollmentId = req.query.enrollmentId as string;
    if (!enrollmentId) {
      res.status(400).json({ message: 'enrollmentId query parameter is required.' });
      return;
    }
    const viewer = { id: req.user!.sub, role: req.user!.role };
    const result = await getNextContentForEnrollment(enrollmentId, viewer);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Auto-enrollment rule endpoints (admin only)
// ---------------------------------------------------------------------------

export async function createRuleController(req: Request, res: Response, next: NextFunction) {
  try {
    const rule = await createRule(req.body, req.user!.sub, req.user!.role);

    await logAction({
      userId: req.user!.sub,
      action: 'AUTO_ENROLL_RULE_CREATE',
      entityType: 'AutoEnrollmentRule',
      entityId: rule.id,
      details: { name: rule.name, courseId: rule.courseId },
      context: auditCtx(req),
    });

    res.status(201).json({ message: 'Auto-enrollment rule created.', rule });
  } catch (err) {
    next(err);
  }
}

export async function listRulesController(_req: Request, res: Response, next: NextFunction) {
  try {
    const rules = await listRules();
    res.status(200).json({ rules });
  } catch (err) {
    next(err);
  }
}

export async function updateRuleController(req: Request, res: Response, next: NextFunction) {
  try {
    const ruleId = paramId(req, 'ruleId');
    const rule = await updateRule(ruleId, req.body, req.user!.role);

    await logAction({
      userId: req.user!.sub,
      action: 'AUTO_ENROLL_RULE_UPDATE',
      entityType: 'AutoEnrollmentRule',
      entityId: ruleId,
      details: req.body,
      context: auditCtx(req),
    });

    res.status(200).json({ message: 'Auto-enrollment rule updated.', rule });
  } catch (err) {
    next(err);
  }
}

export async function deleteRuleController(req: Request, res: Response, next: NextFunction) {
  try {
    const ruleId = paramId(req, 'ruleId');
    const result = await deleteRule(ruleId, req.user!.role);

    await logAction({
      userId: req.user!.sub,
      action: 'AUTO_ENROLL_RULE_DELETE',
      entityType: 'AutoEnrollmentRule',
      entityId: ruleId,
      context: auditCtx(req),
    });

    res.status(200).json({ message: 'Auto-enrollment rule deleted.', ...result });
  } catch (err) {
    next(err);
  }
}

export async function triggerAutoEnrollmentController(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req.body ?? {};
    const result = await triggerAutoEnrollment(userId, req.user!.sub, req.user!.role);

    await logAction({
      userId: req.user!.sub,
      action: 'AUTO_ENROLL_TRIGGER',
      entityType: 'User',
      entityId: userId ?? 'ALL',
      details: { usersProcessed: result.usersProcessed, totalEnrollments: result.totalEnrollments },
      context: auditCtx(req),
    });

    res.status(200).json({
      message: `Auto-enrollment triggered for ${result.usersProcessed} user(s). ${result.totalEnrollments} new enrollments created.`,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Service error handler
// ---------------------------------------------------------------------------

export function enrollmentErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (isHttpError(err)) {
    res.status(err.statusCode).json({ message: err.message, code: err.code });
    return;
  }
  next(err);
}
