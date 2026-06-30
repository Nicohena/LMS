// src/modules/escalations/escalation.service.ts
import { prisma } from '../../lib/prisma';
import { NotFoundError, ForbiddenError, ValidationError } from '../../common/errors';
import type { Role } from '@prisma/client';

// ---------------------------------------------------------------------------
// Student escalates an issue (assignment submission or quiz attempt)
// ---------------------------------------------------------------------------

export async function createEscalation(
  userId: string,
  data: {
    submissionId?: string;
    attemptId?: string;
    reason: string;
  },
) {
  if (!data.submissionId && !data.attemptId) {
    throw new ValidationError('Either submissionId or attemptId is required.');
  }
  if (!data.reason.trim()) {
    throw new ValidationError('Reason is required.');
  }

  // Check for existing open escalation
  const existing = await prisma.escalation.findFirst({
    where: {
      userId,
      status: { in: ['OPEN', 'TEACHER_REVIEW', 'FORWARDED_TO_ADMIN'] },
      OR: [
        ...(data.submissionId ? [{ submissionId: data.submissionId }] : []),
        ...(data.attemptId ? [{ attemptId: data.attemptId }] : []),
      ],
    },
  });
  if (existing) throw new ValidationError('You already have an open escalation for this item.');

  // Determine teacher: find the course creator from the submission's assignment
  let teacherId: string | undefined;
  if (data.submissionId) {
    const submission = await prisma.submission.findUnique({
      where: { id: data.submissionId },
      select: { assignment: { select: { createdBy: true } } },
    });
    if (!submission) throw new NotFoundError('Submission not found.');
    if (submission.assignment?.createdBy) teacherId = submission.assignment.createdBy;
  } else if (data.attemptId) {
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: data.attemptId },
      select: { quiz: { select: { createdBy: true } } },
    });
    if (!attempt) throw new NotFoundError('Quiz attempt not found.');
    if (attempt.quiz?.createdBy) teacherId = attempt.quiz.createdBy;
  }

  const escalation = await prisma.escalation.create({
    data: {
      userId,
      submissionId: data.submissionId,
      attemptId: data.attemptId,
      teacherId,
      reason: data.reason,
      status: 'OPEN',
    },
  });

  // Send notification to teacher
  if (teacherId) {
    try {
      const teacher = await prisma.user.findUnique({ where: { id: teacherId }, select: { email: true, firstName: true } });
      if (teacher) {
        const { sendEmail } = await import('../notifications/email.service');
        await sendEmail({
          to: teacher.email,
          subject: 'New Escalation Received',
          template: 'generic',
          data: {
            title: 'New Student Escalation',
            content: `Hi ${teacher.firstName}, a student has submitted an escalation that requires your review. Reason: "${data.reason}". Please review it in your dashboard.`,
            link: `${process.env.CLIENT_URL || 'http://localhost:3000'}/admin`,
          },
        });
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[escalations] Failed to send teacher notification:', (err as Error).message);
    }
  }

  // eslint-disable-next-line no-console
  console.log(`[escalations] New escalation: user=${userId}, teacher=${teacherId ?? 'none'}`);
  return { message: 'Escalation submitted. The teacher will review it.', escalation };
}

// ---------------------------------------------------------------------------
// Teacher resolves or forwards to admin
// ---------------------------------------------------------------------------

export async function teacherResolve(
  teacherId: string,
  escalationId: string,
  data: {
    action: 'RESOLVE' | 'FORWARD';
    notes: string;
    newGrade?: number;
  },
) {
  const escalation = await prisma.escalation.findUnique({
    where: { id: escalationId },
    select: { id: true, userId: true, teacherId: true, submissionId: true, attemptId: true, status: true },
  });
  if (!escalation) throw new NotFoundError('Escalation not found.');

  // Teacher can only handle escalations assigned to them (or any if admin)
  if (escalation.teacherId && escalation.teacherId !== teacherId) {
    throw new ForbiddenError('This escalation is assigned to a different teacher.');
  }

  if (escalation.status === 'RESOLVED') throw new ValidationError('Escalation already resolved.');

  if (data.action === 'RESOLVE') {
    const updated = await prisma.escalation.update({
      where: { id: escalationId },
      data: {
        status: 'RESOLVED',
        teacherNotes: data.notes,
        resolution: data.notes,
        resolvedBy: teacherId,
      },
    });

    // If new grade provided, update the submission
    if (data.newGrade !== undefined && escalation.submissionId) {
      const submission = await prisma.submission.findUnique({
        where: { id: escalation.submissionId },
        select: { grade: true, assignmentId: true },
      });
      if (submission) {
        const oldGrade = submission.grade;
        await prisma.submission.update({
          where: { id: escalation.submissionId },
          data: {
            grade: data.newGrade,
            feedback: data.notes,
            gradedAt: new Date(),
            gradedBy: teacherId,
            gradingStatus: 'GRADED',
            status: 'GRADED',
          },
        });
        // Record grade history
        await prisma.gradeHistory.create({
          data: {
            submissionId: escalation.submissionId,
            previousGrade: oldGrade,
            newGrade: data.newGrade,
            changedBy: teacherId,
            reason: `Escalation resolution: ${data.notes}`,
          },
        }).catch(() => {});
      }
    }

    // Notify student
    await notifyStudent(escalation.userId, 'Escalation Resolved', `Your escalation has been resolved by the teacher. Resolution: ${data.notes}`);
    // eslint-disable-next-line no-console
    console.log(`[escalations] Teacher resolved: ${escalationId}`);
    return { message: 'Escalation resolved.', escalation: updated };
  }

  // Forward to admin
  const updated = await prisma.escalation.update({
    where: { id: escalationId },
    data: {
      status: 'FORWARDED_TO_ADMIN',
      teacherNotes: data.notes,
    },
  });

  // Notify all admins
  try {
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN', isActive: true }, select: { email: true, firstName: true } });
    const { sendEmail } = await import('../notifications/email.service');
    for (const admin of admins) {
      await sendEmail({
        to: admin.email,
        subject: 'Escalation Forwarded to Admin',
        template: 'generic',
        data: {
          title: 'Escalation Requires Admin Review',
          content: `Hi ${admin.firstName}, a teacher has forwarded an escalation that requires admin review. Teacher notes: "${data.notes}".`,
          link: `${process.env.CLIENT_URL || 'http://localhost:3000'}/admin`,
        },
      }).catch(() => {});
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[escalations] Failed to notify admins:', (err as Error).message);
  }

  // eslint-disable-next-line no-console
  console.log(`[escalations] Teacher forwarded to admin: ${escalationId}`);
  return { message: 'Escalation forwarded to admin.', escalation: updated };
}

// ---------------------------------------------------------------------------
// Admin final resolution
// ---------------------------------------------------------------------------

export async function adminResolve(
  adminId: string,
  escalationId: string,
  data: {
    resolution: string;
    newGrade?: number;
  },
) {
  const escalation = await prisma.escalation.findUnique({
    where: { id: escalationId },
    select: { id: true, userId: true, submissionId: true, status: true },
  });
  if (!escalation) throw new NotFoundError('Escalation not found.');
  if (escalation.status === 'RESOLVED') throw new ValidationError('Escalation already resolved.');

  const updated = await prisma.escalation.update({
    where: { id: escalationId },
    data: {
      status: 'RESOLVED',
      adminNotes: data.resolution,
      resolution: data.resolution,
      adminId,
      resolvedBy: adminId,
    },
  });

  // If new grade provided, override
  if (data.newGrade !== undefined && escalation.submissionId) {
    const submission = await prisma.submission.findUnique({
      where: { id: escalation.submissionId },
      select: { grade: true },
    });
    if (submission) {
      await prisma.submission.update({
        where: { id: escalation.submissionId },
        data: {
          grade: data.newGrade,
          feedback: data.resolution,
          gradedAt: new Date(),
          gradedBy: adminId,
          gradingStatus: 'GRADED',
          status: 'GRADED',
        },
      });
      await prisma.gradeHistory.create({
        data: {
          submissionId: escalation.submissionId,
          previousGrade: submission.grade,
          newGrade: data.newGrade,
          changedBy: adminId,
          reason: `Admin escalation resolution: ${data.resolution}`,
        },
      }).catch(() => {});
    }
  }

  // Notify student
  await notifyStudent(escalation.userId, 'Escalation Resolved by Admin', `Your escalation has been resolved by an administrator. Resolution: ${data.resolution}`);
  // eslint-disable-next-line no-console
  console.log(`[escalations] Admin resolved: ${escalationId}`);
  return { message: 'Escalation resolved by admin.', escalation: updated };
}

// ---------------------------------------------------------------------------
// Get escalations (role-based)
// ---------------------------------------------------------------------------

export async function getEscalations(
  viewer: { id: string; role: Role },
  filters?: { status?: string; page?: number; limit?: number },
) {
  const page = filters?.page ?? 1;
  const limit = Math.min(filters?.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const where: any = {};
  if (filters?.status) where.status = filters.status;

  // Students see only their own escalations
  if (viewer.role === 'STUDENT') {
    where.userId = viewer.id;
  }
  // Teachers see escalations assigned to them
  if (viewer.role === 'TEACHER') {
    where.teacherId = viewer.id;
  }
  // Admins see all

  const [data, total] = await Promise.all([
    prisma.escalation.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.escalation.count({ where }),
  ]);

  // Enrich with user/teacher/submission data (manual fetch for MongoDB)
  const enrichedData = await Promise.all(data.map(async (e) => {
    const [user, teacher] = await Promise.all([
      prisma.user.findUnique({ where: { id: e.userId }, select: { id: true, firstName: true, lastName: true, email: true } }),
      e.teacherId ? prisma.user.findUnique({ where: { id: e.teacherId }, select: { id: true, firstName: true, lastName: true } }) : null,
    ]);
    let submission: any = null;
    if (e.submissionId) {
      submission = await prisma.submission.findUnique({
        where: { id: e.submissionId },
        select: { id: true, grade: true, status: true, assignment: { select: { title: true } } },
      });
    }
    return { ...e, user, teacher, submission };
  }));

  return {
    data: enrichedData,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ---------------------------------------------------------------------------
// Helper: notify student
// ---------------------------------------------------------------------------

async function notifyStudent(userId: string, subject: string, content: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, firstName: true } });
    if (user) {
      const { sendEmail } = await import('../notifications/email.service');
      await sendEmail({
        to: user.email,
        subject,
        template: 'generic',
        data: { title: subject, content: `Hi ${user.firstName}, ${content}`, link: `${process.env.CLIENT_URL || 'http://localhost:3000'}/profile` },
      });
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[escalations] Failed to notify student:', (err as Error).message);
  }
}
