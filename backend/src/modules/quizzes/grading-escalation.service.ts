// src/modules/quizzes/grading-escalation.service.ts
import { prisma } from '../../lib/prisma';
import { NotFoundError, ForbiddenError, ValidationError } from '../../common/errors';
import type { Role } from '@prisma/client';

// ---------------------------------------------------------------------------
// Admin override — force a grade change on any attempt
// ---------------------------------------------------------------------------

export async function adminOverrideGrade(
  adminId: string,
  attemptId: string,
  data: { newScore: number; reason: string },
) {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    select: { id: true, score: true, maxPossibleScore: true, scorePercentage: true, quizId: true, userId: true },
  });
  if (!attempt) throw new NotFoundError('Attempt not found');

  const oldScore = attempt.score;
  const maxScore = attempt.maxPossibleScore ?? 100;
  const newScore = Math.min(Math.max(data.newScore, 0), maxScore);
  const newPercentage = maxScore > 0 ? Math.round((newScore / maxScore) * 10000) / 100 : 0;

  // Check if quiz has a passing score
  const quiz = await prisma.quiz.findUnique({
    where: { id: attempt.quizId },
    select: { passingScore: true },
  });
  const passed = newPercentage >= (quiz?.passingScore ?? 70);

  const updated = await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: {
      score: newScore,
      scorePercentage: newPercentage,
      passed,
      gradedAt: new Date(),
      gradedBy: adminId,
    },
  });

  // Send notification to the student
  try {
    const { sendEmail } = await import('../notifications/email.service');
    const user = await prisma.user.findUnique({ where: { id: attempt.userId }, select: { email: true, firstName: true } });
    if (user) {
      await sendEmail({
        to: user.email,
        subject: 'Quiz Grade Updated',
        template: 'quizGraded',
        data: {
          firstName: user.firstName,
          scorePercentage: newPercentage,
          passed,
          link: `${process.env.CLIENT_URL || 'http://localhost:3000'}/quiz-results`,
        },
      });
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[grading] Failed to send grade notification:', (err as Error).message);
  }

  // eslint-disable-next-line no-console
  console.log(`[grading] Admin override: attempt ${attemptId} score ${oldScore} → ${newScore} (reason: ${data.reason})`);

  return {
    message: 'Grade overridden successfully.',
    attempt: updated,
    previousScore: oldScore,
    newScore,
  };
}

// ---------------------------------------------------------------------------
// Student escalates a grade dispute
// ---------------------------------------------------------------------------

export async function escalateGrade(
  userId: string,
  attemptId: string,
  reason: string,
) {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    select: { id: true, userId: true, status: true, score: true, quizId: true },
  });
  if (!attempt) throw new NotFoundError('Attempt not found');
  if (attempt.userId !== userId) throw new ForbiddenError('You can only dispute your own grades.');
  if (attempt.status !== 'COMPLETED' && attempt.status !== 'TIMED_OUT') {
    throw new ValidationError('Can only dispute completed attempts.');
  }

  // Check for existing open dispute
  const existing = await prisma.gradeDispute.findFirst({
    where: { attemptId, userId, status: { in: ['OPEN', 'UNDER_REVIEW', 'ESCALATED'] } },
  });
  if (existing) throw new ValidationError('You already have an open dispute for this attempt.');

  const dispute = await prisma.gradeDispute.create({
    data: {
      attemptId,
      userId,
      reason,
      status: 'OPEN',
    },
  });

  // eslint-disable-next-line no-console
  console.log(`[grading] Grade dispute opened: attempt ${attemptId} by user ${userId}`);

  return { message: 'Grade dispute submitted.', dispute };
}

// ---------------------------------------------------------------------------
// Get disputes (teacher sees their quizzes' disputes, admin sees all)
// ---------------------------------------------------------------------------

export async function getDisputes(viewer: { id: string; role: Role }, filters?: { status?: string; page?: number; limit?: number }) {
  const page = filters?.page ?? 1;
  const limit = Math.min(filters?.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const where: any = {};
  if (filters?.status) where.status = filters.status;

  // Teachers only see disputes for their quizzes
  if (viewer.role === 'TEACHER') {
    // Get quiz IDs owned by this teacher
    const teacherQuizzes = await prisma.quiz.findMany({
      where: { createdBy: viewer.id },
      select: { id: true },
    });
    const quizIds = teacherQuizzes.map(q => q.id);
    // Get attempt IDs for those quizzes
    const teacherAttempts = await prisma.quizAttempt.findMany({
      where: { quizId: { in: quizIds } },
      select: { id: true },
    });
    const attemptIds = teacherAttempts.map(a => a.id);
    where.attemptId = { in: attemptIds };
  }

  const [data, total] = await Promise.all([
    prisma.gradeDispute.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.gradeDispute.count({ where }),
  ]);

  // Manually fetch related data (MongoDB nested includes can be unreliable)
  const enrichedData = await Promise.all(data.map(async (d) => {
    const [attempt, user] = await Promise.all([
      prisma.quizAttempt.findUnique({
        where: { id: d.attemptId },
        select: { id: true, score: true, scorePercentage: true, quizId: true },
      }),
      prisma.user.findUnique({
        where: { id: d.userId },
        select: { id: true, firstName: true, lastName: true, email: true },
      }),
    ]);
    const quiz = attempt ? await prisma.quiz.findUnique({
      where: { id: attempt.quizId },
      select: { id: true, title: true, createdBy: true },
    }) : null;
    return { ...d, attempt: attempt ? { ...attempt, quiz } : null, user };
  }));

  return {
    data: enrichedData,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ---------------------------------------------------------------------------
// Resolve a dispute (teacher or admin)
// ---------------------------------------------------------------------------

export async function resolveDispute(
  resolverId: string,
  role: Role,
  disputeId: string,
  data: { resolution: string; status: 'RESOLVED' | 'ESCALATED'; newScore?: number },
) {
  const dispute = await prisma.gradeDispute.findUnique({
    where: { id: disputeId },
    include: { attempt: { select: { id: true, quiz: { select: { createdBy: true } } } } },
  });
  if (!dispute) throw new NotFoundError('Dispute not found');

  // Teachers can only resolve disputes for their own quizzes
  if (role === 'TEACHER' && dispute.attempt.quiz.createdBy !== resolverId) {
    throw new ForbiddenError('You can only resolve disputes for your own quizzes.');
  }

  // If escalating, only admin can resolve an already-escalated dispute
  if (dispute.status === 'ESCALATED' && role !== 'ADMIN') {
    throw new ForbiddenError('Escalated disputes can only be resolved by an admin.');
  }

  const updated = await prisma.gradeDispute.update({
    where: { id: disputeId },
    data: {
      status: data.status,
      resolution: data.resolution,
      resolvedBy: resolverId,
    },
  });

  // If a new score is provided, override the grade
  if (data.newScore !== undefined && data.status === 'RESOLVED') {
    await adminOverrideGrade(resolverId, dispute.attemptId, {
      newScore: data.newScore,
      reason: `Dispute resolution: ${data.resolution}`,
    });
  }

  // eslint-disable-next-line no-console
  console.log(`[grading] Dispute ${disputeId} ${data.status} by ${resolverId}`);

  return { message: 'Dispute updated.', dispute: updated };
}
