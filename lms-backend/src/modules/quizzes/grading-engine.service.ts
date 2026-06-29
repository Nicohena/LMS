// src/modules/quizzes/grading-engine.service.ts
//
// Auto-grading engine for objective question types.
// Subjective question types (SHORT_ANSWER, ESSAY, FILE_UPLOAD, HOTSPOT) are
// flagged for manual grading.
//
// Each grader returns a GradeResult:
//   - isCorrect: true/false for objective questions, null for subjective
//   - pointsAwarded: full/partial/zero points, null for subjective
//   - feedback: optional auto-generated message

import type { Prisma } from '@prisma/client';
import type { GradeResult } from './quiz.types';

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export function gradeQuestion(
  question: {
    type: string;
    options: Prisma.JsonValue | null;
    correctAnswer: Prisma.JsonValue | null;
    points: number;
  },
  studentAnswer: unknown,
): GradeResult {
  switch (question.type) {
    case 'MULTIPLE_CHOICE_SINGLE':
      return gradeMultipleChoiceSingle(question, studentAnswer);
    case 'MULTIPLE_CHOICE_MULTIPLE':
      return gradeMultipleChoiceMultiple(question, studentAnswer);
    case 'TRUE_FALSE':
      return gradeTrueFalse(question, studentAnswer);
    case 'FILL_IN_BLANK':
      return gradeFillInBlank(question, studentAnswer);
    case 'MATCHING':
      return gradeMatching(question, studentAnswer);
    case 'SORTING':
      return gradeSorting(question, studentAnswer);
    case 'SHORT_ANSWER':
    case 'ESSAY':
    case 'FILE_UPLOAD':
    case 'HOTSPOT':
      return { isCorrect: null, pointsAwarded: null, feedback: 'Awaiting manual grading.' };
    default:
      return { isCorrect: null, pointsAwarded: null, feedback: `Unknown question type: ${question.type}` };
  }
}

// ---------------------------------------------------------------------------
// Individual graders
// ---------------------------------------------------------------------------

/**
 * MULTIPLE_CHOICE_SINGLE: student answer is a single option key ("A", "B", ...).
 * Correct answer is also a single key.
 */
function gradeMultipleChoiceSingle(
  question: { correctAnswer: Prisma.JsonValue | null; points: number },
  studentAnswer: unknown,
): GradeResult {
  if (typeof studentAnswer !== 'string') {
    return zero('MCQ-Single answer must be a string option key.');
  }
  const correct = question.correctAnswer;
  if (typeof correct !== 'string') {
    return zero('Question is misconfigured (correctAnswer is not a string).');
  }
  const isCorrect = studentAnswer.trim().toUpperCase() === correct.trim().toUpperCase();
  return {
    isCorrect,
    pointsAwarded: isCorrect ? question.points : 0,
    feedback: isCorrect ? 'Correct.' : 'Incorrect.',
  };
}

/**
 * MULTIPLE_CHOICE_MULTIPLE: student answer is an array of option keys.
 * Correct answer is also an array. Full credit only if the sets match exactly
 * (all correct selected, no incorrect selected). Partial credit is NOT awarded
 * to discourage guessing.
 */
function gradeMultipleChoiceMultiple(
  question: { correctAnswer: Prisma.JsonValue | null; points: number },
  studentAnswer: unknown,
): GradeResult {
  if (!Array.isArray(studentAnswer)) {
    return zero('MCQ-Multiple answer must be an array of option keys.');
  }
  const correct = question.correctAnswer;
  if (!Array.isArray(correct)) {
    return zero('Question is misconfigured (correctAnswer is not an array).');
  }
  const studentSet = new Set(studentAnswer.map((s) => String(s).trim().toUpperCase()));
  const correctSet = new Set(correct.map((c) => String(c).trim().toUpperCase()));

  // Exact set match
  const isCorrect =
    studentSet.size === correctSet.size &&
    Array.from(studentSet).every((s) => correctSet.has(s));

  return {
    isCorrect,
    pointsAwarded: isCorrect ? question.points : 0,
    feedback: isCorrect
      ? 'Correct.'
      : `Incorrect. You selected ${studentSet.size}, correct count is ${correctSet.size}.`,
  };
}

/**
 * TRUE_FALSE: student answer is a boolean.
 * Correct answer is also a boolean.
 */
function gradeTrueFalse(
  question: { correctAnswer: Prisma.JsonValue | null; points: number },
  studentAnswer: unknown,
): GradeResult {
  // Accept boolean or string "true"/"false"
  let parsedAnswer: boolean;
  if (typeof studentAnswer === 'boolean') {
    parsedAnswer = studentAnswer;
  } else if (typeof studentAnswer === 'string') {
    parsedAnswer = studentAnswer.toLowerCase() === 'true';
  } else {
    return zero('True/False answer must be a boolean or "true"/"false".');
  }

  const correct = question.correctAnswer;
  let correctBool: boolean;
  if (typeof correct === 'boolean') {
    correctBool = correct;
  } else if (typeof correct === 'string') {
    correctBool = correct.toLowerCase() === 'true';
  } else {
    return zero('Question is misconfigured (correctAnswer is not boolean).');
  }

  const isCorrect = parsedAnswer === correctBool;
  return {
    isCorrect,
    pointsAwarded: isCorrect ? question.points : 0,
    feedback: isCorrect ? 'Correct.' : 'Incorrect.',
  };
}

/**
 * FILL_IN_BLANK: student answer is a string (single blank) or array of strings (multiple blanks).
 * Correct answer is a string, array of acceptable variants, or array of arrays (one per blank).
 * Comparison is case-insensitive and trims whitespace.
 *
 * Examples:
 *   single blank, single answer:  correctAnswer = "Paris"
 *   single blank, variants:        correctAnswer = ["Paris", "paris", "PARIS"]
 *   multiple blanks:               correctAnswer = [["Paris"], ["London", "Londres"]]
 */
function gradeFillInBlank(
  question: { correctAnswer: Prisma.JsonValue | null; points: number },
  studentAnswer: unknown,
): GradeResult {
  const correct = question.correctAnswer;
  if (correct === null || correct === undefined) {
    return zero('Question is misconfigured (no correctAnswer).');
  }

  // Normalize student answer into an array of strings (one per blank).
  let studentBlanks: string[];
  if (typeof studentAnswer === 'string') {
    studentBlanks = [studentAnswer.trim().toLowerCase()];
  } else if (Array.isArray(studentAnswer)) {
    studentBlanks = studentAnswer.map((s) => String(s).trim().toLowerCase());
  } else {
    return zero('Fill-in-the-blank answer must be a string or array of strings.');
  }

  // Normalize correct answer into an array of arrays (variants per blank).
  let correctBlanks: string[][];
  if (typeof correct === 'string') {
    correctBlanks = [[correct.trim().toLowerCase()]];
  } else if (Array.isArray(correct)) {
    // Could be either ["Paris"] (single blank, variants) or [["Paris"], ["London"]] (multiple blanks)
    if (correct.length > 0 && Array.isArray(correct[0])) {
      correctBlanks = (correct as unknown[][]).map((variants) =>
        variants.map((v) => String(v).trim().toLowerCase()),
      );
    } else {
      correctBlanks = [correct.map((v) => String(v).trim().toLowerCase())];
    }
  } else {
    return zero('Question is misconfigured (correctAnswer has wrong shape).');
  }

  if (studentBlanks.length !== correctBlanks.length) {
    return {
      isCorrect: false,
      pointsAwarded: 0,
      feedback: `Expected ${correctBlanks.length} blank(s), got ${studentBlanks.length}.`,
    };
  }

  // Each blank must match one of its variants.
  let allCorrect = true;
  let correctCount = 0;
  for (let i = 0; i < correctBlanks.length; i++) {
    if (correctBlanks[i].includes(studentBlanks[i])) {
      correctCount++;
    } else {
      allCorrect = false;
    }
  }

  // Partial credit: proportional to blanks correct.
  const pointsAwarded = (correctCount / correctBlanks.length) * question.points;
  return {
    isCorrect: allCorrect,
    pointsAwarded: Math.round(pointsAwarded * 100) / 100,
    feedback: allCorrect
      ? 'Correct.'
      : `${correctCount}/${correctBlanks.length} blanks correct.`,
  };
}

/**
 * MATCHING: student answer is an object mapping left items to right items.
 * Correct answer is also an object mapping. Both must have the same keys.
 *
 * Example:
 *   options: { left: ["a","b"], right: ["1","2"] }
 *   correctAnswer: { "a": "1", "b": "2" }
 *   studentAnswer: { "a": "1", "b": "2" }
 */
function gradeMatching(
  question: { correctAnswer: Prisma.JsonValue | null; points: number },
  studentAnswer: unknown,
): GradeResult {
  const correct = question.correctAnswer;
  if (correct === null || typeof correct !== 'object' || Array.isArray(correct)) {
    return zero('Question is misconfigured (correctAnswer must be an object).');
  }
  if (studentAnswer === null || typeof studentAnswer !== 'object' || Array.isArray(studentAnswer)) {
    return zero('Matching answer must be an object mapping left items to right items.');
  }

  const correctMap = correct as Record<string, unknown>;
  const studentMap = studentAnswer as Record<string, unknown>;

  const keys = Object.keys(correctMap);
  if (keys.length === 0) {
    return zero('Question is misconfigured (correctAnswer is empty).');
  }

  let correctCount = 0;
  for (const key of keys) {
    const correctVal = String(correctMap[key]).trim().toLowerCase();
    const studentVal = studentMap[key] !== undefined ? String(studentMap[key]).trim().toLowerCase() : '';
    if (correctVal === studentVal) correctCount++;
  }

  const allCorrect = correctCount === keys.length;
  const pointsAwarded = (correctCount / keys.length) * question.points;
  return {
    isCorrect: allCorrect,
    pointsAwarded: Math.round(pointsAwarded * 100) / 100,
    feedback: allCorrect ? 'Correct.' : `${correctCount}/${keys.length} pairs matched.`,
  };
}

/**
 * SORTING: student answer is an array of items in the order the student placed them.
 * Correct answer is the correct order. Comparison is by index.
 *
 * Example:
 *   options: { items: ["wake up", "eat breakfast", "go to work"] }
 *   correctAnswer: ["wake up", "eat breakfast", "go to work"]
 *   studentAnswer: ["wake up", "go to work", "eat breakfast"]  // 2/3 correct
 */
function gradeSorting(
  question: { correctAnswer: Prisma.JsonValue | null; points: number },
  studentAnswer: unknown,
): GradeResult {
  const correct = question.correctAnswer;
  if (!Array.isArray(correct)) {
    return zero('Question is misconfigured (correctAnswer must be an array).');
  }
  if (!Array.isArray(studentAnswer)) {
    return zero('Sorting answer must be an array of items in order.');
  }
  if (studentAnswer.length !== correct.length) {
    return {
      isCorrect: false,
      pointsAwarded: 0,
      feedback: `Expected ${correct.length} items, got ${studentAnswer.length}.`,
    };
  }

  let correctCount = 0;
  for (let i = 0; i < correct.length; i++) {
    if (String(studentAnswer[i]).trim().toLowerCase() === String(correct[i]).trim().toLowerCase()) {
      correctCount++;
    }
  }

  const allCorrect = correctCount === correct.length;
  const pointsAwarded = (correctCount / correct.length) * question.points;
  return {
    isCorrect: allCorrect,
    pointsAwarded: Math.round(pointsAwarded * 100) / 100,
    feedback: allCorrect ? 'Correct order.' : `${correctCount}/${correct.length} items in correct position.`,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function zero(feedback: string): GradeResult {
  return { isCorrect: false, pointsAwarded: 0, feedback };
}

// ---------------------------------------------------------------------------
// Question-type predicates
// ---------------------------------------------------------------------------

/** Returns true if the question type is auto-graded (no manual grading needed). */
export function isAutoGradable(type: string): boolean {
  return [
    'MULTIPLE_CHOICE_SINGLE',
    'MULTIPLE_CHOICE_MULTIPLE',
    'TRUE_FALSE',
    'FILL_IN_BLANK',
    'MATCHING',
    'SORTING',
  ].includes(type);
}

/** Returns true if the question type requires manual grading. */
export function requiresManualGrading(type: string): boolean {
  return ['SHORT_ANSWER', 'ESSAY', 'FILE_UPLOAD', 'HOTSPOT'].includes(type);
}
