// src/modules/gamification/leaderboard.service.ts
import { LeaderboardScope, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { cacheGet, cacheSet, cacheDeleteByPrefix } from '../../common/services/cache.service';
import type { LeaderboardEntry, LeaderboardResponse } from './gamification.types';
import type { LeaderboardQueryInput } from './gamification.schemas';

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

const CACHE_PREFIX = 'leaderboard:';
const CACHE_TTL = 5 * 60; // 5 minutes

// ---------------------------------------------------------------------------
// Get leaderboard
// ---------------------------------------------------------------------------

export async function getLeaderboard(
  filters: LeaderboardQueryInput,
): Promise<LeaderboardResponse> {
  const cacheKey = `${CACHE_PREFIX}${filters.scope}:${filters.scopeId || 'global'}:${filters.period}`;

  // Try cache
  const cached = await cacheGet<LeaderboardResponse>(cacheKey);
  if (cached) return cached;

  const entries = await computeLeaderboard(filters.scope, filters.scopeId, filters.limit);

  const response: LeaderboardResponse = {
    scope: filters.scope,
    scopeId: filters.scopeId || null,
    period: filters.period,
    entries: entries.slice(0, filters.limit),
    totalUsers: entries.length,
  };

  await cacheSet(cacheKey, response, CACHE_TTL);
  return response;
}

/**
 * Compute leaderboard by querying UserLevel + User tables.
 * For COURSE scope, filters to users enrolled in the specified course.
 */
async function computeLeaderboard(scope: string, scopeId: string | undefined, limit: number): Promise<LeaderboardEntry[]> {
  const where: Prisma.UserLevelWhereInput = {};

  if (scope === 'COURSE' && scopeId) {
    // Filter to users enrolled in this course
    where.user = {
      enrollments: { some: { courseId: scopeId, status: 'ACTIVE' } },
    };
  }

  const levels = await prisma.userLevel.findMany({
    where,
    orderBy: { totalXP: 'desc' },
    take: limit * 2, // fetch a bit more to handle ties
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true, profilePicture: true } },
    },
  });

  const entries: LeaderboardEntry[] = levels.map((ul, idx) => ({
    rank: idx + 1,
    userId: ul.user.id,
    displayName: `${ul.user.firstName} ${ul.user.lastName}`,
    email: ul.user.email,
    profilePicture: ul.user.profilePicture,
    totalXP: ul.totalXP,
    level: ul.level,
  }));

  return entries;
}

// ---------------------------------------------------------------------------
// User rank
// ---------------------------------------------------------------------------

export async function getUserRank(userId: string, scope: string, scopeId?: string): Promise<{ rank: number | null; totalXP: number; level: number; totalUsers: number }> {
  if (!OBJECT_ID_RE.test(userId)) return { rank: null, totalXP: 0, level: 1, totalUsers: 0 };

  const userLevel = await prisma.userLevel.findUnique({ where: { userId } });
  if (!userLevel) return { rank: null, totalXP: 0, level: 1, totalUsers: 0 };

  // Count users with more XP than this user
  const where: Prisma.UserLevelWhereInput = {
    totalXP: { gt: userLevel.totalXP },
  };
  if (scope === 'COURSE' && scopeId) {
    where.user = { enrollments: { some: { courseId: scopeId, status: 'ACTIVE' } } };
  }

  const higherCount = await prisma.userLevel.count({ where });
  const totalUsers = await prisma.userLevel.count({
    where: scope === 'COURSE' && scopeId
      ? { user: { enrollments: { some: { courseId: scopeId, status: 'ACTIVE' } } } }
      : {},
  });

  return {
    rank: higherCount + 1,
    totalXP: userLevel.totalXP,
    level: userLevel.level,
    totalUsers,
  };
}

// ---------------------------------------------------------------------------
// Invalidate cache (called when XP is updated)
// ---------------------------------------------------------------------------

export async function invalidateLeaderboardCache(): Promise<void> {
  await cacheDeleteByPrefix(CACHE_PREFIX);
}
