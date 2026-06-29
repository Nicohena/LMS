// src/modules/audit/audit.service.ts
//
// Extended audit log service for Step 11 — provides querying, filtering,
// and GDPR compliance (user audit trail export).
// (The existing src/common/services/audit.service.ts handles the logAction()
// writes — this module handles read/query operations.)

import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../common/errors';
import type { AuditLogResponse } from '../reports/report.types';
import type { AuditLogQueryInput } from '../reports/report.schemas';

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

// ---------------------------------------------------------------------------
// Query audit logs (admin only)
// ---------------------------------------------------------------------------

export async function getAuditLogs(filters: AuditLogQueryInput): Promise<{
  data: AuditLogResponse[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const where: Prisma.AuditLogWhereInput = {};

  if (filters.userId) {
    if (!OBJECT_ID_RE.test(filters.userId)) throw new NotFoundError('User not found');
    where.userId = filters.userId;
  }
  if (filters.action) where.action = { contains: filters.action, mode: 'insensitive' };
  if (filters.entityType) where.entityType = filters.entityType;
  if (filters.entityId) where.entityId = filters.entityId;

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  const skip = (filters.page - 1) * filters.limit;
  const take = filters.limit;

  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    data: rows as unknown as AuditLogResponse[],
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  };
}

// ---------------------------------------------------------------------------
// User audit trail (GDPR compliance — right to access)
// ---------------------------------------------------------------------------

export async function getUserAuditTrail(userId: string): Promise<{
  userId: string;
  totalActions: number;
  actions: AuditLogResponse[];
}> {
  if (!OBJECT_ID_RE.test(userId)) throw new NotFoundError('User not found');
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) throw new NotFoundError('User not found');

  const actions = await prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 500,
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  });

  return {
    userId,
    totalActions: actions.length,
    actions: actions as unknown as AuditLogResponse[],
  };
}
