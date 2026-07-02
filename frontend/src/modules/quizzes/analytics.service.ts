// src/modules/quizzes/analytics.service.ts
//
// Quiz analytics: aggregate attempt data into statistics, item analysis,
// difficulty/discrimination indices, and score distributions.

import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../common/errors';
import type { QuizAnalyticsResponse } from './quiz.types';

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

/**
 * Compute comprehensive analytics for a quiz, including:
 * - Total/unique attempts
 * - Average, median scores + pass rate
 * - Score distribution (0-20, 20-40, ..., 80-100)
 * - Per-question item analysis: difficulty index (p-value, proportion correct),
 *   discrimination index (point-biserial approximation), correct/incorrect counts
 */
export async function getQuizAnalytics(quizId: string): Promise<QuizAnalyticsResponse> {
  if (!OBJECT_ID_RE.test(quizId)) {
    throw new NotFoundError('Quiz not found');
  }

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { id: true, title: true },
  });
  if (!quiz) throw new NotFoundError('Quiz not found');

  // Only count COMPLETED or TIMED_OUT attempts (those that have a score).
  const attempts = await prisma.quizAttempt.findMany({
    where: { quizId, status: { in: ['COMPLETED', 'TIMED_OUT'] } },
    select: {
      id: true,
      userId: true,
      scorePercentage: true,
      timeSpent: true,
      passed: true,
    },
  });

  const totalAttempts = attempts.length;
  const uniqueStudents = new Set(attempts.map((a) => a.userId)).size;

  const scores = attempts
    .map((a) => a.scorePercentage ?? 0)
    .sort((a, b) => a - b);
  const times = attempts.map((a) => a.timeSpent);

  const averageScore = totalAttempts > 0
    ? Math.round((scores.reduce((s, v) => s + v, 0) / totalAttempts) * 100) / 100
    : 0;
  const medianScore = totalAttempts > 0 ? scores[Math.floor(totalAttempts / 2)] : 0;
  const passRate = totalAttempts > 0
    ? Math.round((attempts.filter((a) => a.passed).length / totalAttempts) * 10000) / 100
    : 0;
  const averageTimeSpentSeconds = totalAttempts > 0
    ? Math.round(times.reduce((s, v) => s + v, 0) / totalAttempts)
    : 0;

  // Score distribution in 20-point buckets
  const buckets = [
    { range: '0-20', count: 0 },
    { range: '20-40', count: 0 },
    { range: '40-60', count: 0 },
    { range: '60-80', count: 0 },
    { range: '80-100', count: 0 },
  ];
  for (const s of scores) {
    const idx = Math.min(Math.floor(s / 20), 4);
    buckets[idx].count++;
  }

  // Per-question analysis
  const questions = await prisma.question.findMany({
    where: { quizId },
    orderBy: { order: 'asc' },
    select: { id: true, questionText: true, type: true, points: true },
  });

  const questionAnalysis = await Promise.all(
    questions.map(async (q) => {
      const answers = await prisma.answer.findMany({
        where: { attempt: { quizId, status: { in: ['COMPLETED', 'TIMED_OUT'] } }, questionId: q.id },
        select: { isCorrect: true, pointsAwarded: true },
      });

      const totalAttemptsForQ = answers.length;
      const correctCount = answers.filter((a) => a.isCorrect === true).length;
      const incorrectCount = answers.filter((a) => a.isCorrect === false).length;
      const ungradedCount = answers.filter((a) => a.isCorrect === null).length;

      // Difficulty index: proportion of students who got it right (0-1).
      // Higher = easier. Only counts graded answers.
      const gradedCount = correctCount + incorrectCount;
      const difficultyIndex = gradedCount > 0
        ? Math.round((correctCount / gradedCount) * 100) / 100
        : 0;

      // Discrimination index: point-biserial correlation between getting this
      // question right and total quiz score. We approximate using the simple
      // formula: (correctGroup's avg % - incorrectGroup's avg %) / 100.
      // Range: -1 to +1. Higher = better discriminator.
      let discriminationIndex = 0;
      if (gradedCount > 0) {
        // Need to fetch each answer's attempt scorePercentage
        const detailed = await prisma.answer.findMany({
          where: { attempt: { quizId, status: { in: ['COMPLETED', 'TIMED_OUT'] } }, questionId: q.id },
          select: {
            isCorrect: true,
            attempt: { select: { scorePercentage: true } },
          },
        });
        const correctPercents = detailed
          .filter((a) => a.isCorrect === true)
          .map((a) => a.attempt.scorePercentage ?? 0);
        const incorrectPercents = detailed
          .filter((a) => a.isCorrect === false)
          .map((a) => a.attempt.scorePercentage ?? 0);
        const avgCorrect = correctPercents.length > 0
          ? correctPercents.reduce((s, v) => s + v, 0) / correctPercents.length
          : 0;
        const avgIncorrect = incorrectPercents.length > 0
          ? incorrectPercents.reduce((s, v) => s + v, 0) / incorrectPercents.length
          : 0;
        discriminationIndex = Math.round(((avgCorrect - avgIncorrect) / 100) * 100) / 100;
      }

      return {
        questionId: q.id,
        questionText: q.questionText,
        type: q.type,
        pointsPossible: q.points,
        difficultyIndex,
        discriminationIndex,
        correctCount,
        incorrectCount,
        ungradedCount,
        totalAttempts: totalAttemptsForQ,
      };
    }),
  );

  return {
    quizId: quiz.id,
    quizTitle: quiz.title,
    totalAttempts,
    uniqueStudents,
    averageScore,
    medianScore,
    passRate,
    averageTimeSpentSeconds,
    scoreDistribution: buckets,
    questionAnalysis,
  };
}
