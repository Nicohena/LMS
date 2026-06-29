// src/modules/gamification/gamification.types.ts
import type { BadgeTemplate, UserBadge, XPTransaction, XPSource, UserLevel, LearningStreak } from '@prisma/client';

export interface BadgeTemplateResponse extends BadgeTemplate {
  awardedCount?: number;
}

export interface UserBadgeResponse extends UserBadge {
  badgeTemplate: BadgeTemplate;
}

export interface UserLevelResponse extends UserLevel {
  levelName?: string;
  progressToNextLevel?: number; // 0-100 percentage
}

export interface XPTransactionResponse extends XPTransaction {}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  email: string;
  profilePicture?: string | null;
  totalXP: number;
  level: number;
}

export interface LeaderboardResponse {
  scope: string;
  scopeId: string | null;
  period: string;
  entries: LeaderboardEntry[];
  totalUsers: number;
}

export interface StreakResponse {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
  isActiveToday: boolean;
}

export interface XPRuleResponse {
  id: string;
  source: XPSource;
  points: number;
  isActive: boolean;
  description: string | null;
}
