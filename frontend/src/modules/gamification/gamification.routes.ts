// src/modules/gamification/gamification.routes.ts
import { Router } from 'express';
import { authenticate, optionalAuth } from '../../common/middlewares/auth.middleware';
import { authorize } from '../../common/middlewares/rbac.middleware';
import { validate } from '../../common/middlewares/validation.middleware';
import {
  getUserLevelController,
  getXPHistoryController,
  getXPRulesController,
  updateXPRuleController,
  awardXPManuallyController,
  createBadgeTemplateController,
  updateBadgeTemplateController,
  deleteBadgeTemplateController,
  getBadgeTemplatesController,
  getUserBadgesController,
  awardBadgeManuallyController,
  toggleBadgeDisplayController,
  getLeaderboardController,
  getUserRankController,
  getStreakController,
  gamificationErrorHandler,
} from './gamification.controller';
import {
  createBadgeTemplateSchema,
  updateBadgeTemplateSchema,
  awardBadgeSchema,
  updateXPRuleSchema,
  manualXPSchema,
} from './gamification.schemas';

const router = Router();

// Public leaderboard (optional auth — anonymous can view)
router.get('/leaderboard', optionalAuth, getLeaderboardController);

// Authenticated routes
router.use(authenticate);

// XP + Level (self-service)
router.get('/level', getUserLevelController);
router.get('/xp/history', getXPHistoryController);
router.get('/rank', getUserRankController);
router.get('/streak', getStreakController);

// Badges (self-service)
router.get('/badges', getUserBadgesController);
router.patch('/badges/:badgeId/display', toggleBadgeDisplayController);

// Badge templates (admin only)
router.get('/badge-templates', getBadgeTemplatesController);
router.post('/badge-templates', authorize('ADMIN'), validate({ body: createBadgeTemplateSchema }), createBadgeTemplateController);
router.patch('/badge-templates/:badgeId', authorize('ADMIN'), validate({ body: updateBadgeTemplateSchema }), updateBadgeTemplateController);
router.delete('/badge-templates/:badgeId', authorize('ADMIN'), deleteBadgeTemplateController);

// XP rules (admin only)
router.get('/xp/rules', authorize('ADMIN'), getXPRulesController);
router.patch('/xp/rules/:ruleId', authorize('ADMIN'), validate({ body: updateXPRuleSchema }), updateXPRuleController);

// Manual XP award (admin only)
router.post('/xp/award', authorize('ADMIN'), validate({ body: manualXPSchema }), awardXPManuallyController);

// Manual badge award (admin only)
router.post('/badges/award', authorize('ADMIN'), validate({ body: awardBadgeSchema }), awardBadgeManuallyController);

router.use(gamificationErrorHandler);

export default router;
