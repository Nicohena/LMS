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
// Public / optional-auth routes (no ADMIN/TEACHER gate)
// ---------------------------------------------------------------------------

// Public list + detail (anonymous can see PUBLISHED; logged-in see more based on role)
router.get('/', optionalAuth, validate({ query: quizQuerySchema }), getQuizzesController);
router.get('/:quizId', optionalAuth, getQuizController);

// ---------------------------------------------------------------------------
// Authenticated routes (any logged-in user)
// ---------------------------------------------------------------------------

// Question bank — any authenticated admin/teacher (service checks role)
router.get('/questions/bank', authenticate, getQuestionBankController);

// Attempt routes — students can take quizzes; teachers/admins can grade/list
router.post('/:quizId/attempts/start', authenticate, validate({ body: startAttemptSchema }), startAttemptController);
router.patch('/attempts/:attemptId/progress', authenticate, validate({ body: saveProgressSchema }), saveProgressController);
router.post('/attempts/:attemptId/submit', authenticate, validate({ body: submitAttemptSchema }), submitAttemptController);
router.get('/attempts/:attemptId', authenticate, getAttemptController);
router.get('/attempts/:attemptId/results', authenticate, getResultsController);

// Admin/teacher-only attempt routes
router.get('/:quizId/attempts', authenticate, authorize('ADMIN', 'TEACHER'), getAttemptsController);
router.patch('/attempts/:attemptId/grade', authenticate, authorize('ADMIN', 'TEACHER'), validate({ body: manualGradeSchema }), manualGradeController);

// ---------------------------------------------------------------------------
// Admin/teacher-only routes (quiz CRUD + question CRUD + analytics)
// ---------------------------------------------------------------------------

router.post('/', authenticate, authorize('ADMIN', 'TEACHER'), validate({ body: createQuizSchema }), createQuizController);
router.patch('/:quizId', authenticate, authorize('ADMIN', 'TEACHER'), validate({ body: updateQuizSchema }), updateQuizController);
router.delete('/:quizId', authenticate, authorize('ADMIN', 'TEACHER'), deleteQuizController);

router.post('/:quizId/questions', authenticate, authorize('ADMIN', 'TEACHER'), validate({ body: addQuestionSchema }), addQuestionController);
router.patch('/questions/:questionId', authenticate, authorize('ADMIN', 'TEACHER'), validate({ body: updateQuestionSchema }), updateQuestionController);
router.delete('/questions/:questionId', authenticate, authorize('ADMIN', 'TEACHER'), deleteQuestionController);

router.get('/:quizId/analytics', authenticate, authorize('ADMIN', 'TEACHER'), getAnalyticsController);

// Service error handler
router.use(quizErrorHandler);

export default router;
