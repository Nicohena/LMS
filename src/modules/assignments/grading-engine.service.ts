// src/modules/assignments/grading-engine.service.ts
//
// Assignment grading helpers: rubric application, grade validation, and
// late-penalty calculation.

import type { Prisma } from '@prisma/client';
import { ValidationError } from '../../common/errors';

// ---------------------------------------------------------------------------
// Types (mirror the rubric.criteria JSON shape)
// ---------------------------------------------------------------------------

export interface RubricCriterion {
  id: string;
  name: string;
  description?: string;
  levels: Array<{
    points: number;
    description: string;
  }>;
}

export interface RubricShape {
  id: string;
  assignmentId: string;
  name: string;
  criteria: RubricCriterion[];
  totalPoints: number;
}

export interface GradeBreakdownItem {
  criterionId: string;
  criterionName: string;
  pointsAwarded: number;
  pointsPossible: number;
  levelDescription?: string;
}

export interface ApplyRubricResult {
  totalPoints: number;
  maxPossible: number;
  percentage: number;
  breakdown: GradeBreakdownItem[];
}

// ---------------------------------------------------------------------------
// Rubric application
// ---------------------------------------------------------------------------

/**
 * Apply a rubric to a submission.
 *
 * `selectedLevels` is a map of { criterionId: levelIndex } indicating which
 * level the student achieved for each criterion.
 *
 * Returns the total points, max possible, percentage, and per-criterion
 * breakdown.
 */
export function applyRubric(
  rubric: RubricShape,
  selectedLevels: Record<string, number>,
): ApplyRubricResult {
  const breakdown: GradeBreakdownItem[] = [];
  let totalPoints = 0;
  let maxPossible = 0;

  for (const criterion of rubric.criteria) {
    // Find the highest-point level as the "possible" for this criterion.
    const maxLevelPoints = Math.max(...criterion.levels.map((l) => l.points));
    maxPossible += maxLevelPoints;

    const levelIdx = selectedLevels[criterion.id];
    if (levelIdx === undefined || levelIdx === null) {
      // No level selected — award 0.
      breakdown.push({
        criterionId: criterion.id,
        criterionName: criterion.name,
        pointsAwarded: 0,
        pointsPossible: maxLevelPoints,
      });
      continue;
    }

    if (typeof levelIdx !== 'number' || levelIdx < 0 || levelIdx >= criterion.levels.length) {
      throw new ValidationError(
        `Invalid level index ${levelIdx} for criterion "${criterion.name}"`,
      );
    }

    const level = criterion.levels[levelIdx];
    totalPoints += level.points;
    breakdown.push({
      criterionId: criterion.id,
      criterionName: criterion.name,
      pointsAwarded: level.points,
      pointsPossible: maxLevelPoints,
      levelDescription: level.description,
    });
  }

  const percentage = maxPossible > 0 ? Math.round((totalPoints / maxPossible) * 10000) / 100 : 0;

  return { totalPoints, maxPossible, percentage, breakdown };
}

// ---------------------------------------------------------------------------
// Grade validation
// ---------------------------------------------------------------------------

/**
 * Validate that a grade is within [0, maxPoints]. Throws ValidationError
 * if out of range.
 */
export function validateGrade(grade: number, maxPoints: number): void {
  if (typeof grade !== 'number' || Number.isNaN(grade)) {
    throw new ValidationError('Grade must be a number');
  }
  if (grade < 0) {
    throw new ValidationError(`Grade cannot be negative (got ${grade})`);
  }
  if (grade > maxPoints) {
    throw new ValidationError(
      `Grade ${grade} exceeds maximum allowed ${maxPoints}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Late penalty calculation
// ---------------------------------------------------------------------------

/**
 * Calculate the late penalty for a submission.
 *
 * @param submittedAt When the submission was submitted
 * @param dueDate Assignment due date (null = no due date, no penalty)
 * @param lateSubmissionDeadline Final deadline for late submissions (null = no hard cutoff)
 * @param latePenaltyPercentage Percentage penalty per day late (e.g., 10 = 10% per day)
 * @returns { daysLate, penaltyPercent, penaltyApplied } where penaltyApplied is
 *          the fraction of the grade to KEEP (e.g., 0.8 = 20% penalty applied).
 *          Returns null if no penalty applies.
 */
export function calculateLatePenalty(
  submittedAt: Date,
  dueDate: Date | null | undefined,
  lateSubmissionDeadline: Date | null | undefined,
  latePenaltyPercentage: number,
): { daysLate: number; penaltyPercent: number; penaltyApplied: number } | null {
  if (!dueDate) return null;
  if (submittedAt <= dueDate) return null;
  if (latePenaltyPercentage <= 0) {
    // Still mark as late, but no penalty.
    const daysLate = Math.ceil((submittedAt.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000));
    return { daysLate, penaltyPercent: 0, penaltyApplied: 1 };
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysLate = Math.ceil((submittedAt.getTime() - dueDate.getTime()) / msPerDay);

  // If past the late deadline, the submission may be rejected entirely
  // (handled by the caller). Here we just compute the penalty.
  let penaltyPercent = daysLate * latePenaltyPercentage;
  // Cap penalty at 100%
  penaltyPercent = Math.min(penaltyPercent, 100);
  const penaltyApplied = (100 - penaltyPercent) / 100;

  return { daysLate, penaltyPercent, penaltyApplied };
}

/**
 * Apply the late penalty to a grade and return the new grade + penalty info.
 */
export function applyLatePenalty(
  grade: number,
  submittedAt: Date,
  assignment: {
    dueDate: Date | null;
    lateSubmissionDeadline: Date | null;
    latePenaltyPercentage: number;
  },
): { grade: number; penalty: ReturnType<typeof calculateLatePenalty> } {
  const penalty = calculateLatePenalty(
    submittedAt,
    assignment.dueDate,
    assignment.lateSubmissionDeadline,
    assignment.latePenaltyPercentage,
  );

  if (!penalty) {
    return { grade, penalty: null };
  }

  const newGrade = Math.round(grade * penalty.penaltyApplied * 100) / 100;
  return { grade: newGrade, penalty };
}
