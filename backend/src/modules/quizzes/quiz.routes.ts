// src/modules/quizzes/quiz.routes.ts
import { Router } from 'express';
import { authenticate, optionalAuth } from '../../common/middlewares/auth.middleware';
import { authorize } from '../../common/middlewares/rbac.middleware';
import { validate } from '../../common/middlewares/validation.middleware';
import {
  createQuizController,
  getQuizController,
  getQuizzesController,
  updateQuizController,
  deleteQuizController,
  addQuestionController,
  updateQuestionController,
  deleteQuestionController,
  getQuestionBankController,
  startAttemptController,
  saveProgressController,
  submitAttemptController,
  getAttemptController,
  getAttemptsController,
  manualGradeController,
  getResultsController,
  getAnalyticsController,
  quizErrorHandler,
} from './quiz.controller';
import {
  createQuizSchema,
  updateQuizSchema,
  quizQuerySchema,
  addQuestionSchema,
  updateQuestionSchema,
  startAttemptSchema,
  saveProgressSchema,
  submitAttemptSchema,
  manualGradeSchema,
} from './quiz.schemas';

const router = Router();

// ---------------------------------------------------------------------------
// Public / optional-auth routes (no role gate)
// ---------------------------------------------------------------------------

// Public list + detail (anonymous can see PUBLISHED; logged-in see more based on role)
router.get('/', optionalAuth, validate({ query: quizQuerySchema }), getQuizzesController);

// Static routes MUST come before /:quizId to avoid being matched as a quizId
import {
  adminGradeController,
  escalateGradeController,
  getDisputesController,
  resolveDisputeController,
} from './grading-escalation.controller';

router.get('/disputes', authenticate, authorize('ADMIN', 'TEACHER'), getDisputesController);
router.get('/questions/bank', authenticate, getQuestionBankController);

router.get('/:quizId', optionalAuth, getQuizController);

// ---------------------------------------------------------------------------
// Authenticated routes (any logged-in user)
// ---------------------------------------------------------------------------

// Attempt routes — students can take quizzes; teachers/admins can grade/list
router.post('/:quizId/attempts/start', authenticate, validate({ body: startAttemptSchema }), startAttemptController);
router.patch('/attempts/:attemptId/progress', authenticate, validate({ body: saveProgressSchema }), saveProgressController);
router.post('/attempts/:attemptId/submit', authenticate, validate({ body: submitAttemptSchema }), submitAttemptController);
router.get('/attempts/:attemptId', authenticate, getAttemptController);
router.get('/attempts/:attemptId/results', authenticate, getResultsController);

// Admin/teacher-only attempt routes (grading — admin can grade but NOT create quizzes)
router.get('/:quizId/attempts', authenticate, authorize('ADMIN', 'TEACHER'), getAttemptsController);
router.patch('/attempts/:attemptId/grade', authenticate, authorize('ADMIN', 'TEACHER'), validate({ body: manualGradeSchema }), manualGradeController);

// --- Step 4: Automated Grading — admin override + grade disputes ---
// Admin override (force grade change)
router.patch('/attempts/:attemptId/admin-grade', authenticate, authorize('ADMIN'), adminGradeController);
// Student escalates grade dispute
router.post('/attempts/:attemptId/escalate', authenticate, escalateGradeController);
// Resolve a dispute (admin or teacher)
router.patch('/disputes/:disputeId/resolve', authenticate, authorize('ADMIN', 'TEACHER'), resolveDisputeController);

// ---------------------------------------------------------------------------
// TEACHER-only routes (quiz CRUD + question CRUD)
// Admins do NOT create quizzes — they review them via /content/flagged.
// Admins CAN still view analytics for oversight.
// ---------------------------------------------------------------------------

router.post('/', authenticate, authorize('TEACHER'), validate({ body: createQuizSchema }), createQuizController);
router.patch('/:quizId', authenticate, authorize('TEACHER'), validate({ body: updateQuizSchema }), updateQuizController);
router.delete('/:quizId', authenticate, authorize('TEACHER'), deleteQuizController);

router.post('/:quizId/questions', authenticate, authorize('TEACHER'), validate({ body: addQuestionSchema }), addQuestionController);
router.patch('/questions/:questionId', authenticate, authorize('TEACHER'), validate({ body: updateQuestionSchema }), updateQuestionController);
router.delete('/questions/:questionId', authenticate, authorize('TEACHER'), deleteQuestionController);

// Analytics — admin can view (oversight), teacher can view (own quizzes)
router.get('/:quizId/analytics', authenticate, authorize('ADMIN', 'TEACHER'), getAnalyticsController);

// Service error handler
router.use(quizErrorHandler);

export default router;
