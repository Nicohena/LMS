// src/modules/gamification/streak.service.ts
import { prisma } from '../../lib/prisma';
import type { StreakResponse } from './gamification.types';

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Track user activity — called by other services (xp.service, quiz submit, etc.)
 * Updates the learning streak:
 *   - If last activity was yesterday → increment streak
 *   - If last activity was today → no change (already counted)
 *   - If last activity was >1 day ago → reset streak to 1
 *   - If first activity ever → streak = 1
 */
export async function trackActivity(userId: string): Promise<void> {
  if (!OBJECT_ID_RE.test(userId)) return;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // midnight today

  let streak = await prisma.learningStreak.findUnique({ where: { userId } });
  if (!streak) {
    await prisma.learningStreak.create({
      data: { userId, currentStreak: 1, longestStreak: 1, lastActivityDate: today },
    });
    return;
  }

  const lastDate = new Date(streak.lastActivityDate);
  const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
  const diffDays = Math.round((today.getTime() - lastDay.getTime()) / MS_PER_DAY);

  let newCurrentStreak: number;
  if (diffDays === 0) {
    // Already active today — no change
    return;
  } else if (diffDays === 1) {
    // Yesterday → increment streak
    newCurrentStreak = streak.currentStreak + 1;
  } else {
    // Streak broken → reset to 1
    newCurrentStreak = 1;
  }

  const newLongestStreak = Math.max(streak.longestStreak, newCurrentStreak);

  await prisma.learningStreak.update({
    where: { userId },
    data: { currentStreak: newCurrentStreak, longestStreak: newLongestStreak, lastActivityDate: today },
  });
}

/**
 * Get the user's current streak info.
 */
export async function getStreak(userId: string): Promise<StreakResponse | null> {
  if (!OBJECT_ID_RE.test(userId)) return null;

  let streak = await prisma.learningStreak.findUnique({ where: { userId } });
  if (!streak) {
    streak = await prisma.learningStreak.create({
      data: { userId, currentStreak: 0, longestStreak: 0, lastActivityDate: new Date(0) },
    });
  }

  // Check if active today
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastDate = new Date(streak.lastActivityDate);
  const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
  const isActiveToday = lastDay.getTime() === today.getTime();

  return {
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    lastActivityDate: streak.lastActivityDate,
    isActiveToday,
  };
}
