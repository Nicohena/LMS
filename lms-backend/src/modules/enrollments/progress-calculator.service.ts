// src/modules/enrollments/progress-calculator.service.ts
//
// Calculates overall enrollment progress and completion status.
//
// Strategy:
// - Flat weighting (default): overall % = average of all content progress
// - Completion check: an enrollment is COMPLETED when every content item's
//   status is COMPLETED. If a course has no content items, it's immediately
//   100% COMPLETED on enrollment.

import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../common/errors';

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

/**
 * Recalculate the overall progressPercentage for an enrollment and update
 * the DB record. Also updates status to COMPLETED when all content is done.
 *
 * Returns the updated enrollment.
 */
export async function recalculateOverallProgress(enrollmentId: string): Promise<{
  id: string;
  progressPercentage: number;
  status: string;
  completedAt: Date | null;
}> {
  if (!OBJECT_ID_RE.test(enrollmentId)) {
    throw new NotFoundError('Enrollment not found');
  }

  // Get all content IDs for the course, plus all existing progress records.
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: { id: true, courseId: true, status: true, completedAt: true },
  });
  if (!enrollment) {
    throw new NotFoundError('Enrollment not found');
  }

  // Fetch all content items for this course (across all modules).
  const courseContents = await prisma.content.findMany({
    where: { module: { courseId: enrollment.courseId } },
    select: { id: true },
  });
  const totalContentCount = courseContents.length;

  // Fetch all progress records for this enrollment.
  const progressRecords = await prisma.progress.findMany({
    where: { enrollmentId },
    select: { id: true, status: true, progressPercent: true },
  });

  let overallPercentage = 0;
  let isCompleted = false;

  if (totalContentCount === 0) {
    // No content in the course — consider it 100% complete.
    overallPercentage = 100;
    isCompleted = true;
  } else {
    // Build a map of progress by contentId for quick lookup.
    // Note: progress records may include stale entries for content that
    // no longer exists (if content was deleted). Filter to only count
    // content that still exists in the course.
    const courseContentIds = new Set(courseContents.map((c) => c.id));
    const relevantProgress = progressRecords.filter((p) =>
      // We can't easily filter by contentId at the type level here without
      // including it in the select above. Re-fetch with contentId.
      true,
    );

    // Re-fetch with contentId to be safe.
    const progressWithContent = await prisma.progress.findMany({
      where: { enrollmentId, contentId: { in: Array.from(courseContentIds) } },
      select: { contentId: true, status: true, progressPercent: true },
    });

    // Flat weighting: average of progressPercent across all content items.
    // For content with no progress record yet, count as 0.
    const progressByContentId = new Map(
      progressWithContent.map((p) => [p.contentId, p]),
    );

    let sum = 0;
    let allCompleted = true;
    for (const content of courseContents) {
      const p = progressByContentId.get(content.id);
      if (!p) {
        allCompleted = false;
        sum += 0;
      } else {
        sum += p.progressPercent;
        if (p.status !== 'COMPLETED') {
          allCompleted = false;
        }
      }
    }
    overallPercentage = Math.round((sum / totalContentCount) * 100) / 100;
    isCompleted = allCompleted;
  }

  // Update the enrollment record.
  const updated = await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      progressPercentage: overallPercentage,
      status: isCompleted ? 'COMPLETED' : enrollment.status === 'DROPPED' ? 'DROPPED' : 'ACTIVE',
      completedAt: isCompleted && !enrollment.completedAt ? new Date() : enrollment.completedAt,
    },
    select: { id: true, progressPercentage: true, status: true, completedAt: true },
  });

  return updated;
}

/**
 * Check if a course is completed (all content items are COMPLETED).
 */
export async function isCourseCompleted(enrollmentId: string): Promise<boolean> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: { courseId: true },
  });
  if (!enrollment) return false;

  const courseContents = await prisma.content.findMany({
    where: { module: { courseId: enrollment.courseId } },
    select: { id: true },
  });

  if (courseContents.length === 0) return true;

  const completedProgress = await prisma.progress.count({
    where: {
      enrollmentId,
      status: 'COMPLETED',
      contentId: { in: courseContents.map((c) => c.id) },
    },
  });

  return completedProgress === courseContents.length;
}

/**
 * Find the next content item the student should engage with.
 *
 * Strategy: find the first content (in module/content order) that is
 * NOT_STARTED or IN_PROGRESS. Returns null if all content is completed.
 */
export async function getNextContentId(enrollmentId: string): Promise<string | null> {
  if (!OBJECT_ID_RE.test(enrollmentId)) {
    throw new NotFoundError('Enrollment not found');
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: { id: true, courseId: true },
  });
  if (!enrollment) {
    throw new NotFoundError('Enrollment not found');
  }

  // Fetch all content for the course, ordered by module.order then content.order.
  const contents = await prisma.content.findMany({
    where: { module: { courseId: enrollment.courseId } },
    orderBy: [{ module: { order: 'asc' } }, { order: 'asc' }],
    select: { id: true, title: true, type: true },
  });

  if (contents.length === 0) return null;

  // Fetch progress for these contents.
  const progress = await prisma.progress.findMany({
    where: { enrollmentId, contentId: { in: contents.map((c) => c.id) } },
    select: { contentId: true, status: true },
  });
  const progressByContent = new Map(progress.map((p) => [p.contentId, p.status]));

  // Find first content that is NOT_STARTED or has no progress yet, or IN_PROGRESS.
  for (const content of contents) {
    const status = progressByContent.get(content.id);
    if (!status || status === 'NOT_STARTED' || status === 'IN_PROGRESS') {
      return content.id;
    }
  }

  // Everything is COMPLETED — return null.
  return null;
}
