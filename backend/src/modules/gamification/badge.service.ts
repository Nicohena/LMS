// src/modules/gamification/badge.service.ts
import { Prisma, Role } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError, ForbiddenError, ConflictError } from '../../common/errors';
import { addXP } from './xp.service';
import { createNotification } from '../notifications/notification.service';
import type { BadgeTemplateResponse, UserBadgeResponse } from './gamification.types';
import type { CreateBadgeTemplateInput, UpdateBadgeTemplateInput } from './gamification.schemas';

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

// ---------------------------------------------------------------------------
// Badge template CRUD (admin only)
// ---------------------------------------------------------------------------

export async function createBadgeTemplate(data: CreateBadgeTemplateInput, role: Role): Promise<BadgeTemplateResponse> {
  if (role !== 'ADMIN') throw new ForbiddenError('Only admins can manage badge templates');
  const template = await prisma.badgeTemplate.create({
    data: { ...data, metadata: data.metadata as Prisma.InputJsonValue | undefined },
  });
  return { ...template, awardedCount: 0 };
}

export async function updateBadgeTemplate(id: string, data: UpdateBadgeTemplateInput, role: Role): Promise<BadgeTemplateResponse> {
  if (role !== 'ADMIN') throw new ForbiddenError('Only admins can manage badge templates');
  if (!OBJECT_ID_RE.test(id)) throw new NotFoundError('Badge template not found');
  const template = await prisma.badgeTemplate.findUnique({ where: { id } });
  if (!template) throw new NotFoundError('Badge template not found');
  const updated = await prisma.badgeTemplate.update({
    where: { id },
    data: { ...data, metadata: data.metadata as Prisma.InputJsonValue | undefined },
  });
  return { ...updated, awardedCount: 0 };
}

export async function deleteBadgeTemplate(id: string, role: Role): Promise<{ id: string; deleted: boolean }> {
  if (role !== 'ADMIN') throw new ForbiddenError('Only admins can manage badge templates');
  if (!OBJECT_ID_RE.test(id)) throw new NotFoundError('Badge template not found');
  const count = await prisma.userBadge.count({ where: { badgeTemplateId: id } });
  if (count > 0) throw new ConflictError(`Cannot delete: ${count} users have been awarded this badge`);
  await prisma.badgeTemplate.delete({ where: { id } });
  return { id, deleted: true };
}

export async function getBadgeTemplates(): Promise<BadgeTemplateResponse[]> {
  const templates = await prisma.badgeTemplate.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { awarded: true } } },
  });
  return templates.map((t) => ({ ...t, awardedCount: (t as any)._count?.awarded ?? 0 }));
}

// ---------------------------------------------------------------------------
// Award badges
// ---------------------------------------------------------------------------

export async function awardBadge(
  userId: string,
  badgeTemplateId: string,
  evidence?: string,
): Promise<UserBadgeResponse | null> {
  if (!OBJECT_ID_RE.test(userId) || !OBJECT_ID_RE.test(badgeTemplateId)) return null;

  const template = await prisma.badgeTemplate.findUnique({ where: { id: badgeTemplateId } });
  if (!template || !template.isActive) return null;

  // Check if already awarded (unique constraint on [userId, badgeTemplateId])
  const existing = await prisma.userBadge.findUnique({
    where: { userId_badgeTemplateId: { userId, badgeTemplateId } },
  });
  if (existing) return null; // Already awarded — idempotent

  const userBadge = await prisma.userBadge.create({
    data: {
      userId,
      badgeTemplateId,
      evidence,
      expiresAt: template.expiresAfterDays
        ? new Date(Date.now() + template.expiresAfterDays * 24 * 60 * 60 * 1000)
        : null,
    },
    include: { badgeTemplate: true },
  });

  // Award XP bonus if the badge has points
  if (template.points && template.points > 0) {
    await addXP(userId, 'ADMIN_AWARD', template.points, badgeTemplateId, { badge: template.name }).catch(() => null);
  }

  // Notify user
  await createNotification({
    userId,
    type: 'SYSTEM',
    title: `New badge earned: ${template.name}`,
    content: template.description,
    priority: 'NORMAL',
    metadata: { badgeTemplateId, badgeName: template.name },
  }).catch(() => null);

  return userBadge as UserBadgeResponse;
}

export async function getUserBadges(userId: string): Promise<UserBadgeResponse[]> {
  const badges = await prisma.userBadge.findMany({
    where: { userId },
    orderBy: { awardedAt: 'desc' },
    include: { badgeTemplate: true },
  });
  return badges as UserBadgeResponse[];
}

export async function toggleBadgeDisplay(userId: string, badgeId: string, display: boolean): Promise<{ id: string; isDisplayed: boolean }> {
  if (!OBJECT_ID_RE.test(badgeId)) throw new NotFoundError('Badge not found');
  const badge = await prisma.userBadge.findUnique({ where: { id: badgeId } });
  if (!badge) throw new NotFoundError('Badge not found');
  if (badge.userId !== userId) throw new ForbiddenError('You can only manage your own badges');
  return prisma.userBadge.update({ where: { id: badgeId }, data: { isDisplayed: display }, select: { id: true, isDisplayed: true } });
}
