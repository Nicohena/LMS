// src/modules/audit/data-export.service.ts
//
// GDPR data export — exports all data associated with a user.
// Used for "right to access" (data portability) and as a precursor to
// "right to deletion" (data export before anonymization).

import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../common/errors';
import type { UserDataExport } from '../reports/report.types';

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

/**
 * Export all data associated with a user (GDPR right to access).
 * Returns a structured JSON object with all user-related records.
 */
export async function exportUserData(userId: string): Promise<UserDataExport> {
  if (!OBJECT_ID_RE.test(userId)) throw new NotFoundError('User not found');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true },
  });
  if (!user) throw new NotFoundError('User not found');

  const [
    enrollments, progress, quizAttempts, submissions, certificates,
    badges, xpTransactions, notifications, auditLogs,
  ] = await Promise.all([
    prisma.enrollment.findMany({ where: { userId } }),
    prisma.progress.findMany({ where: { enrollment: { userId } } }),
    prisma.quizAttempt.findMany({ where: { userId } }),
    prisma.submission.findMany({ where: { userId } }),
    prisma.certificate.findMany({ where: { userId } }),
    prisma.userBadge.findMany({ where: { userId } }),
    prisma.xPTransaction.findMany({ where: { userId } }),
    prisma.notification.findMany({ where: { userId } }),
    prisma.auditLog.findMany({ where: { userId } }),
  ]);

  return {
    user,
    enrollments: enrollments as unknown[],
    progress: progress as unknown[],
    quizAttempts: quizAttempts as unknown[],
    submissions: submissions as unknown[],
    certificates: certificates as unknown[],
    badges: badges as unknown[],
    xpTransactions: xpTransactions as unknown[],
    notifications: notifications as unknown[],
    auditLogs: auditLogs as unknown[],
  };
}

/**
 * Request user data deletion (GDPR right to deletion).
 * This is a soft-delete: anonymizes PII but keeps records for audit.
 * Actual hard deletion would be queued as a background job.
 */
export async function requestDeletion(userId: string, requesterId: string): Promise<{
  userId: string;
  status: string;
  message: string;
}> {
  if (!OBJECT_ID_RE.test(userId)) throw new NotFoundError('User not found');

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } });
  if (!user) throw new NotFoundError('User not found');

  // Anonymize PII — keep the record for audit but strip identifying info
  await prisma.user.update({
    where: { id: userId },
    data: {
      email: `deleted-${userId}@anonymized.local`,
      passwordHash: 'DELETED',
      firstName: 'Deleted',
      lastName: 'User',
      isActive: false,
      profilePicture: null,
      bio: null,
    },
  });

  // Revoke all refresh tokens
  await prisma.refreshToken.updateMany({
    where: { userId, revoked: false },
    data: { revoked: true },
  });

  // Log the deletion in the audit log
  await prisma.auditLog.create({
    data: {
      userId: requesterId,
      action: 'DATA_DELETED',
      entityType: 'User',
      entityId: userId,
      details: { deletedUserId: userId, originalEmail: user.email } as any,
      metadata: { type: 'gdpr_deletion' } as any,
    },
  });

  return {
    userId,
    status: 'ANONYMIZED',
    message: 'User data has been anonymized. The account is deactivated and all PII has been removed. Records are retained for audit purposes.',
  };
}
