// src/modules/gamification/xp.service.ts
import { XPSource, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../common/errors';
import { awardBadge } from './badge.service';
import { trackActivity } from './streak.service';
import { createNotification } from '../notifications/notification.service';
import type { UserLevelResponse, XPTransactionResponse, XPRuleResponse } from './gamification.types';

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

// Default XP rules (seeded if no rules exist)
const DEFAULT_XP_RULES: Array<{ source: XPSource; points: number; description: string }> = [
  { source: 'COURSE_COMPLETION', points: 500, description: 'Complete a course' },
  { source: 'QUIZ_PASSED', points: 100, description: 'Pass a quiz' },
  { source: 'QUIZ_PERFECT_SCORE', points: 200, description: 'Get 100% on a quiz' },
  { source: 'ASSIGNMENT_GRADED', points: 150, description: 'Get assignment graded' },
  { source: 'DISCUSSION_CREATED', points: 20, description: 'Create a discussion' },
  { source: 'DISCUSSION_REPLY', points: 10, description: 'Reply to a discussion' },
  { source: 'PEER_REVIEW_COMPLETED', points: 50, description: 'Complete a peer review' },
  { source: 'DAILY_LOGIN', points: 5, description: 'Daily login bonus' },
  { source: 'PROFILE_COMPLETION', points: 50, description: 'Complete your profile' },
  { source: 'CERTIFICATE_ISSUED', points: 300, description: 'Earn a certificate' },
  { source: 'ADMIN_AWARD', points: 0, description: 'Manual admin award' },
];

// Default level thresholds (geometric progression: level N requires N*1000 XP)
const DEFAULT_LEVELS = 100;

/**
 * Seed default XP rules and level thresholds if they don't exist.
 * Called once at server startup.
 */
export async function seedDefaults(): Promise<void> {
  // Seed XP rules
  const existingRules = await prisma.xPRule.count();
  if (existingRules === 0) {
    await prisma.xPRule.createMany({
      data: DEFAULT_XP_RULES.map((r) => ({ source: r.source, points: r.points, description: r.description, isActive: true })),
    });
    // eslint-disable-next-line no-console
    console.log('[xp] Seeded default XP rules');
  }

  // Seed level thresholds
  const existingLevels = await prisma.levelThreshold.count();
  if (existingLevels === 0) {
    const levels = [];
    let cumulative = 0;
    for (let i = 1; i <= DEFAULT_LEVELS; i++) {
      cumulative += i * 1000; // Level 1: 1000, Level 2: 3000, Level 3: 6000, etc.
      levels.push({ level: i, xpRequired: cumulative });
    }
    await prisma.levelThreshold.createMany({ data: levels });
    // eslint-disable-next-line no-console
    console.log(`[xp] Seeded ${DEFAULT_LEVELS} level thresholds`);
  }
}

// ---------------------------------------------------------------------------
// Add XP (the central function called by event hooks)
// ---------------------------------------------------------------------------

export async function addXP(
  userId: string,
  source: XPSource,
  points?: number, // if not provided, look up from XPRule
  sourceId?: string,
  metadata?: Record<string, unknown>,
): Promise<{ transaction: XPTransactionResponse; leveledUp: boolean; newLevel: number } | null> {
  if (!OBJECT_ID_RE.test(userId)) return null;

  // If points not provided, look up from XPRule
  let xpPoints = points;
  if (xpPoints === undefined) {
    const rule = await prisma.xPRule.findFirst({ where: { source, isActive: true } });
    if (!rule) return null; // No rule configured for this source
    xpPoints = rule.points;
  }
  if (xpPoints === 0) return null; // No-op

  // Create the XP transaction
  const transaction = await prisma.xPTransaction.create({
    data: {
      userId,
      source,
      points: xpPoints,
      sourceId,
      metadata: metadata as Prisma.InputJsonValue | undefined,
    },
  });

  // Update user level
  const result = await updateLevel(userId, xpPoints);

  // Track activity for streaks
  await trackActivity(userId);

  return { transaction, leveledUp: result.leveledUp, newLevel: result.level };
}

/**
 * Update the user's level after XP change.
 * Creates UserLevel if it doesn't exist.
 */
async function updateLevel(userId: string, xpDelta: number): Promise<{ leveledUp: boolean; level: number }> {
  let userLevel = await prisma.userLevel.findUnique({ where: { userId } });

  if (!userLevel) {
    userLevel = await prisma.userLevel.create({
      data: { userId, level: 1, totalXP: 0, currentLevelXP: 0 },
    });
  }

  const newTotalXP = userLevel.totalXP + xpDelta;

  // Find the highest level threshold where xpRequired <= newTotalXP
  const thresholds = await prisma.levelThreshold.findMany({
    orderBy: { level: 'asc' },
  });

  let newLevel = 1;
  let currentLevelXP = newTotalXP;
  let nextLevelXP: number | null = null;

  for (let i = 0; i < thresholds.length; i++) {
    if (newTotalXP >= thresholds[i].xpRequired) {
      newLevel = thresholds[i].level;
      if (i + 1 < thresholds.length) {
        nextLevelXP = thresholds[i + 1].xpRequired;
        currentLevelXP = newTotalXP - thresholds[i].xpRequired;
      } else {
        nextLevelXP = null;
        currentLevelXP = newTotalXP - thresholds[i].xpRequired;
      }
    } else {
      break;
    }
  }

  // Handle level 1 edge case (before first threshold)
  if (thresholds.length > 0 && newTotalXP < thresholds[0].xpRequired) {
    newLevel = 1;
    currentLevelXP = newTotalXP;
    nextLevelXP = thresholds[0].xpRequired;
  }

  const leveledUp = newLevel > userLevel.level;

  await prisma.userLevel.update({
    where: { userId },
    data: { level: newLevel, totalXP: newTotalXP, currentLevelXP, nextLevelXP },
  });

  // If leveled up, check for level-up badge + send notification
  if (leveledUp) {
    const threshold = thresholds.find((t) => t.level === newLevel);
    if (threshold?.badgeTemplateId) {
      await awardBadge(userId, threshold.badgeTemplateId, `Reached level ${newLevel}`).catch(() => null);
    }
    await createNotification({
      userId,
      type: 'SYSTEM',
      title: `Level Up! You reached level ${newLevel}`,
      content: `Congratulations! You've reached level ${newLevel}. Keep up the great work!`,
      priority: 'HIGH',
      metadata: { newLevel, totalXP: newTotalXP },
    }).catch(() => null);
  }

  return { leveledUp, level: newLevel };
}

// ---------------------------------------------------------------------------
// Get XP info
// ---------------------------------------------------------------------------

export async function getUserLevel(userId: string): Promise<UserLevelResponse | null> {
  if (!OBJECT_ID_RE.test(userId)) return null;
  let userLevel = await prisma.userLevel.findUnique({ where: { userId } });
  if (!userLevel) {
    userLevel = await prisma.userLevel.create({
      data: { userId, level: 1, totalXP: 0, currentLevelXP: 0 },
    });
  }

  // Calculate progress to next level
  let progressToNextLevel = 0;
  if (userLevel.nextLevelXP && userLevel.nextLevelXP > 0) {
    const thresholds = await prisma.levelThreshold.findMany({ orderBy: { level: 'asc' } });
    const currentThreshold = thresholds.find((t) => t.level === userLevel!.level);
    const nextThreshold = thresholds.find((t) => t.level === userLevel!.level + 1);
    if (currentThreshold && nextThreshold) {
      const levelRange = nextThreshold.xpRequired - currentThreshold.xpRequired;
      progressToNextLevel = levelRange > 0 ? Math.round((userLevel.currentLevelXP / levelRange) * 100) : 0;
    }
  }

  return { ...userLevel, progressToNextLevel };
}

export async function getXPHistory(
  userId: string,
  page: number,
  limit: number,
): Promise<{ data: XPTransactionResponse[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  const where: Prisma.XPTransactionWhereInput = { userId };
  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    prisma.xPTransaction.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.xPTransaction.count({ where }),
  ]);
  return {
    data: rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ---------------------------------------------------------------------------
// XP rules management (admin)
// ---------------------------------------------------------------------------

export async function getXPRules(): Promise<XPRuleResponse[]> {
  const rules = await prisma.xPRule.findMany({ orderBy: { source: 'asc' } });
  return rules;
}

export async function updateXPRule(ruleId: string, points: number, isActive?: boolean, description?: string): Promise<XPRuleResponse> {
  if (!OBJECT_ID_RE.test(ruleId)) throw new NotFoundError('XP rule not found');
  const rule = await prisma.xPRule.findUnique({ where: { id: ruleId } });
  if (!rule) throw new NotFoundError('XP rule not found');
  return prisma.xPRule.update({
    where: { id: ruleId },
    data: { points, ...(isActive !== undefined && { isActive }), ...(description !== undefined && { description }) },
  });
}
