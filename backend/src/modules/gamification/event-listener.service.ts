// src/modules/gamification/event-listener.service.ts
//
// Central event-driven gamification system.
// Uses Node's EventEmitter to decouple gamification triggers from the
// modules that emit events (courses, quizzes, assignments, etc.).
//
// Events:
//   course.completed       → award XP + badge + certificate
//   quiz.passed            → award XP
//   quiz.perfect_score     → award XP + badge
//   assignment.graded      → award XP
//   discussion.created     → award XP
//   discussion.reply       → award XP
//   peer_review.completed  → award XP
//   user.login             → track streak + daily login XP
//   certificate.issued     → award XP

import { EventEmitter } from 'node:events';
import { XPSource } from '@prisma/client';
import { addXP } from './xp.service';
import { awardBadge } from './badge.service';
import { trackActivity } from './streak.service';
import { invalidateLeaderboardCache } from './leaderboard.service';

// Increase max listeners since many events fire
EventEmitter.defaultMaxListeners = 50;

export const gamificationEvents = new EventEmitter();

let initialized = false;

/**
 * Register all gamification event listeners. Safe to call multiple times.
 */
export function initGamificationEvents(): void {
  if (initialized) return;
  initialized = true;

  // --- Course completed ---
  gamificationEvents.on('course.completed', async (data: { userId: string; courseId: string; courseTitle?: string }) => {
    await addXP(data.userId, 'COURSE_COMPLETION', undefined, data.courseId, { courseTitle: data.courseTitle });
    await invalidateLeaderboardCache();
    // eslint-disable-next-line no-console
    console.log(`[gamification] course.completed: ${data.userId} +XP`);

    // Auto-generate certificate on course completion
    try {
      const { issueCertificate } = await import('../certificates/certificate.service');
      const { prisma } = await import('../../lib/prisma');
      const templates = await prisma.certificateTemplate.findMany({ take: 1 });
      if (templates.length > 0) {
        await issueCertificate({
          templateId: templates[0].id,
          userId: data.userId,
          courseId: data.courseId,
        }, 'ADMIN' as any);
        // eslint-disable-next-line no-console
        console.log(`[certificates] Auto-generated certificate for user=${data.userId}, course=${data.courseId}`);

        // Send email notification
        try {
          const { sendEmail } = await import('../notifications/email.service');
          const user = await prisma.user.findUnique({ where: { id: data.userId }, select: { email: true, firstName: true } });
          if (user) {
            await sendEmail({
              to: user.email,
              subject: `Certificate Earned: ${data.courseTitle ?? 'Course Completed'}!`,
              template: 'generic',
              data: {
                title: 'Certificate Earned!',
                content: `Congratulations ${user.firstName}! You have successfully completed "${data.courseTitle ?? 'the course'}" and earned a certificate. You can download it from your profile page.`,
                link: `${process.env.CLIENT_URL || 'http://localhost:3000'}/profile`,
              },
            });
          }
        } catch (emailErr) {
          // eslint-disable-next-line no-console
          console.warn('[certificates] Failed to send certificate email:', (emailErr as Error).message);
        }
      }
    } catch (certErr) {
      // Don't fail the course completion if certificate generation fails
      // eslint-disable-next-line no-console
      console.warn('[certificates] Auto-generation failed:', (certErr as Error).message);
    }
  });

  // --- Quiz passed ---
  gamificationEvents.on('quiz.passed', async (data: { userId: string; quizId: string; scorePercentage: number; attemptId: string }) => {
    await addXP(data.userId, 'QUIZ_PASSED', undefined, data.attemptId, { quizId: data.quizId, score: data.scorePercentage });
    await invalidateLeaderboardCache();

    // Perfect score bonus
    if (data.scorePercentage >= 100) {
      await addXP(data.userId, 'QUIZ_PERFECT_SCORE', undefined, data.attemptId, { quizId: data.quizId });
    }

    // eslint-disable-next-line no-console
    console.log(`[gamification] quiz.passed: ${data.userId} +XP (score: ${data.scorePercentage}%)`);
  });

  // --- Assignment graded ---
  gamificationEvents.on('assignment.graded', async (data: { userId: string; assignmentId: string; grade: number; maxPoints: number }) => {
    await addXP(data.userId, 'ASSIGNMENT_GRADED', undefined, data.assignmentId, { grade: data.grade, maxPoints: data.maxPoints });
    await invalidateLeaderboardCache();
    // eslint-disable-next-line no-console
    console.log(`[gamification] assignment.graded: ${data.userId} +XP (grade: ${data.grade}/${data.maxPoints})`);
  });

  // --- Discussion created ---
  gamificationEvents.on('discussion.created', async (data: { userId: string; discussionId: string }) => {
    await addXP(data.userId, 'DISCUSSION_CREATED', undefined, data.discussionId);
    await invalidateLeaderboardCache();
  });

  // --- Discussion reply ---
  gamificationEvents.on('discussion.reply', async (data: { userId: string; replyId: string; discussionId: string }) => {
    await addXP(data.userId, 'DISCUSSION_REPLY', undefined, data.replyId, { discussionId: data.discussionId });
    await invalidateLeaderboardCache();
  });

  // --- Peer review completed ---
  gamificationEvents.on('peer_review.completed', async (data: { userId: string; reviewId: string; assignmentId: string }) => {
    await addXP(data.userId, 'PEER_REVIEW_COMPLETED', undefined, data.reviewId, { assignmentId: data.assignmentId });
    await invalidateLeaderboardCache();
  });

  // --- User login ---
  gamificationEvents.on('user.login', async (data: { userId: string }) => {
    await trackActivity(data.userId);
    await addXP(data.userId, 'DAILY_LOGIN', undefined, undefined, { date: new Date().toISOString() });
  });

  // --- Certificate issued ---
  gamificationEvents.on('certificate.issued', async (data: { userId: string; certificateId: string; courseId?: string }) => {
    await addXP(data.userId, 'CERTIFICATE_ISSUED', undefined, data.certificateId, { courseId: data.courseId });
    await invalidateLeaderboardCache();
  });

  // eslint-disable-next-line no-console
  console.log('[gamification] Event listeners initialized');
}
