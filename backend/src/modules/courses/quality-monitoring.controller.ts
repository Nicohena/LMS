// src/modules/courses/quality-monitoring.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { getCourseQualityReport, flagCourse, unflagCourse, recalculateAllCourseQuality, calculateCourseQuality } from './quality-monitoring.service';

function paramId(req: Request, key: string): string {
  const v = req.params[key];
  return Array.isArray(v) ? v[0] : (v || '');
}

// GET /api/v1/admin/quality/courses
export async function getQualityReportController(req: Request, res: Response, next: NextFunction) {
  try {
    const flagged = req.query.flagged === 'true';
    const minScore = req.query.minScore ? Number(req.query.minScore) : undefined;
    const maxScore = req.query.maxScore ? Number(req.query.maxScore) : undefined;
    const result = await getCourseQualityReport({ flagged, minScore, maxScore });
    res.status(200).json(result);
  } catch (err) { next(err); }
}

// GET /api/v1/admin/quality/reports
export async function getQualityReportsController(req: Request, res: Response, next: NextFunction) {
  try {
    const all = await getCourseQualityReport({});
    const flagged = await getCourseQualityReport({ flagged: true });
    const lowQuality = await getCourseQualityReport({ maxScore: 40 });
    const goodQuality = await getCourseQualityReport({ minScore: 70 });

    res.status(200).json({
      summary: {
        totalCourses: all.total,
        flaggedCount: flagged.total,
        lowQualityCount: lowQuality.total,
        goodQualityCount: goodQuality.total,
        averageScore: all.data.length > 0
          ? all.data.reduce((sum, c) => sum + (c.qualityScore ?? 0), 0) / all.data.length
          : 0,
      },
      courses: all.data,
    });
  } catch (err) { next(err); }
}

// PATCH /api/v1/admin/quality/courses/:id/flag
export async function flagCourseController(req: Request, res: Response, next: NextFunction) {
  try {
    const courseId = paramId(req, 'id');
    const adminId = req.user!.sub;
    const { flag } = req.body;
    const result = await flagCourse(courseId, flag || 'ADMIN_REVIEW', adminId);
    res.status(200).json(result);
  } catch (err) { next(err); }
}

// PATCH /api/v1/admin/quality/courses/:id/unflag
export async function unflagCourseController(req: Request, res: Response, next: NextFunction) {
  try {
    const courseId = paramId(req, 'id');
    const { flag } = req.body;
    const result = await unflagCourse(courseId, flag || 'ADMIN_REVIEW');
    res.status(200).json(result);
  } catch (err) { next(err); }
}

// POST /api/v1/admin/quality/recalculate — manually trigger recalculation
export async function recalculateQualityController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await recalculateAllCourseQuality();
    res.status(200).json({ message: 'Quality recalculation complete.', ...result });
  } catch (err) { next(err); }
}

// POST /api/v1/admin/quality/courses/:id/calculate — calculate single course
export async function calculateSingleQualityController(req: Request, res: Response, next: NextFunction) {
  try {
    const courseId = paramId(req, 'id');
    const result = await calculateCourseQuality(courseId);
    res.status(200).json({ message: 'Quality calculated.', ...result });
  } catch (err) { next(err); }
}
