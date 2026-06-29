// src/modules/gamification/gamification.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { getUserLevel, getXPHistory, getXPRules, updateXPRule, addXP } from './xp.service';
import { createBadgeTemplate, updateBadgeTemplate, deleteBadgeTemplate, getBadgeTemplates, awardBadge, getUserBadges, toggleBadgeDisplay } from './badge.service';
import { getLeaderboard, getUserRank } from './leaderboard.service';
import { getStreak } from './streak.service';
import { logAction } from '../../common/services/audit.service';
import { getClientIp, getUserAgent } from '../../common/services/upload.service';
import { isHttpError } from '../../common/errors';
import type { LeaderboardQueryInput, XPHistoryQueryInput } from './gamification.schemas';

function paramId(req: Request, key: string): string {
  const v = req.params[key];
  return Array.isArray(v) ? v[0] : v;
}
function auditCtx(req: Request) {
  return { ip: getClientIp(req), userAgent: getUserAgent(req) };
}

// ---------------------------------------------------------------------------
// XP + Level
// ---------------------------------------------------------------------------

export async function getUserLevelController(req: Request, res: Response, next: NextFunction) {
  try {
    const level = await getUserLevel(req.user!.sub);
    res.status(200).json({ level });
  } catch (err) { next(err); }
}

export async function getXPHistoryController(req: Request, res: Response, next: NextFunction) {
  try {
    const filters: XPHistoryQueryInput = {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
    };
    const result = await getXPHistory(req.user!.sub, filters.page, filters.limit);
    res.status(200).json(result);
  } catch (err) { next(err); }
}

export async function getXPRulesController(_req: Request, res: Response, next: NextFunction) {
  try {
    const rules = await getXPRules();
    res.status(200).json({ rules });
  } catch (err) { next(err); }
}

export async function updateXPRuleController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req, 'ruleId');
    const rule = await updateXPRule(id, req.body.points, req.body.isActive, req.body.description);
    await logAction({ userId: req.user!.sub, action: 'XP_RULE_UPDATE', entityType: 'XPTransaction', entityId: id, details: req.body, context: auditCtx(req) });
    res.status(200).json({ message: 'XP rule updated.', rule });
  } catch (err) { next(err); }
}

export async function awardXPManuallyController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await addXP(req.body.userId, 'ADMIN_AWARD', req.body.points, undefined, { reason: req.body.reason, awardedBy: req.user!.sub });
    await logAction({ userId: req.user!.sub, action: 'XP_AWARD', entityType: 'XPTransaction', entityId: result?.transaction.id || '', details: { userId: req.body.userId, points: req.body.points, reason: req.body.reason }, context: auditCtx(req) });
    res.status(200).json({ message: 'XP awarded.', ...result });
  } catch (err) { next(err); }
}

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------

export async function createBadgeTemplateController(req: Request, res: Response, next: NextFunction) {
  try {
    const template = await createBadgeTemplate(req.body, req.user!.role);
    await logAction({ userId: req.user!.sub, action: 'BADGE_TEMPLATE_CREATE', entityType: 'BadgeTemplate', entityId: template.id, context: auditCtx(req) });
    res.status(201).json({ message: 'Badge template created.', template });
  } catch (err) { next(err); }
}

export async function updateBadgeTemplateController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req, 'badgeId');
    const template = await updateBadgeTemplate(id, req.body, req.user!.role);
    res.status(200).json({ message: 'Badge template updated.', template });
  } catch (err) { next(err); }
}

export async function deleteBadgeTemplateController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req, 'badgeId');
    const result = await deleteBadgeTemplate(id, req.user!.role);
    res.status(200).json({ message: 'Badge template deleted.', ...result });
  } catch (err) { next(err); }
}

export async function getBadgeTemplatesController(_req: Request, res: Response, next: NextFunction) {
  try {
    const templates = await getBadgeTemplates();
    res.status(200).json({ templates });
  } catch (err) { next(err); }
}

export async function getUserBadgesController(req: Request, res: Response, next: NextFunction) {
  try {
    const badges = await getUserBadges(req.user!.sub);
    res.status(200).json({ badges });
  } catch (err) { next(err); }
}

export async function awardBadgeManuallyController(req: Request, res: Response, next: NextFunction) {
  try {
    const badge = await awardBadge(req.body.userId, req.body.badgeTemplateId, req.body.evidence);
    if (badge) {
      await logAction({ userId: req.user!.sub, action: 'BADGE_AWARD', entityType: 'UserBadge', entityId: badge.id, details: { userId: req.body.userId, badgeTemplateId: req.body.badgeTemplateId }, context: auditCtx(req) });
    }
    res.status(201).json({ message: badge ? 'Badge awarded.' : 'Badge already awarded or not applicable.', badge });
  } catch (err) { next(err); }
}

export async function toggleBadgeDisplayController(req: Request, res: Response, next: NextFunction) {
  try {
    const badgeId = paramId(req, 'badgeId');
    const display = req.body.display !== false;
    const result = await toggleBadgeDisplay(req.user!.sub, badgeId, display);
    res.status(200).json({ message: 'Badge display updated.', ...result });
  } catch (err) { next(err); }
}

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------

export async function getLeaderboardController(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = {
      scope: (req.query.scope as any) || 'GLOBAL',
      ...(req.query.scopeId ? { scopeId: String(req.query.scopeId) } : {}),
      period: (req.query.period as any) || 'all-time',
      limit: req.query.limit ? Number(req.query.limit) : 20,
    } as LeaderboardQueryInput;
    const result = await getLeaderboard(filters);
    res.status(200).json(result);
  } catch (err) { next(err); }
}

export async function getUserRankController(req: Request, res: Response, next: NextFunction) {
  try {
    const scope = (req.query.scope as string) || 'GLOBAL';
    const scopeId = req.query.scopeId as string | undefined;
    const result = await getUserRank(req.user!.sub, scope, scopeId);
    res.status(200).json(result);
  } catch (err) { next(err); }
}

// ---------------------------------------------------------------------------
// Streak
// ---------------------------------------------------------------------------

export async function getStreakController(req: Request, res: Response, next: NextFunction) {
  try {
    const streak = await getStreak(req.user!.sub);
    res.status(200).json({ streak });
  } catch (err) { next(err); }
}

// ---------------------------------------------------------------------------
// Error handler
// ---------------------------------------------------------------------------

export function gamificationErrorHandler(err: unknown, _req: Request, res: Response, next: NextFunction): void {
  if (isHttpError(err)) { res.status(err.statusCode).json({ message: err.message, code: err.code }); return; }
  next(err);
}
