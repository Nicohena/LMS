// src/modules/quizzes/quiz.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import {
  createQuiz as createQuizService,
  getQuiz as getQuizService,
  getQuizzes as getQuizzesService,
  updateQuiz as updateQuizService,
  deleteQuiz as deleteQuizService,
  addQuestion as addQuestionService,
  updateQuestion as updateQuestionService,
  deleteQuestion as deleteQuestionService,
  getQuestionBank,
  startAttempt as startAttemptService,
  saveProgress as saveProgressService,
  submitAttempt as submitAttemptService,
  getAttempt as getAttemptService,
  getAttempts as getAttemptsService,
  manualGrade as manualGradeService,
  getResults as getResultsService,
} from './quiz.service';
import { getQuizAnalytics } from './analytics.service';
import { logAction } from '../../common/services/audit.service';
import { getClientIp, getUserAgent } from '../../common/services/upload.service';
import { isHttpError } from '../../common/errors';
import type { QuizFilters, QuizAnalyticsResponse } from './quiz.types';
import type { QuizQueryInput, QuestionBankQueryInput } from './quiz.schemas';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toQuizFilters(query: QuizQueryInput): QuizFilters {
  return {
    page: query.page,
    limit: query.limit,
    search: query.search,
    status: query.status,
    contentId: query.contentId,
    createdBy: query.createdBy,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  };
}

function viewerFromReq(req: Request): { id: string; role: Role } | undefined {
  if (!req.user) return undefined;
  return { id: req.user.sub, role: req.user.role };
}

function paramId(req: Request, key: string): string {
  const v = req.params[key];
  return Array.isArray(v) ? v[0] : v;
}

function auditCtx(req: Request) {
  return { ip: getClientIp(req), userAgent: getUserAgent(req) };
}

// ---------------------------------------------------------------------------
// Quiz CRUD
// ---------------------------------------------------------------------------

export async function createQuizController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;
    const role = req.user!.role;
    const quiz = await createQuizService(userId, role, req.body);

    await logAction({
      userId,
      action: 'QUIZ_CREATE',
      entityType: 'Quiz',
      entityId: quiz.id,
      details: { title: quiz.title, status: quiz.status },
      context: auditCtx(req),
    });

    res.status(201).json({ message: 'Quiz created.', quiz });
  } catch (err) {
    next(err);
  }
}

export async function getQuizController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req, 'quizId');
    const viewer = viewerFromReq(req);
    const result = await getQuizService(id, viewer);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getQuizzesController(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = toQuizFilters(req.validated!.query as unknown as QuizQueryInput);
    const viewer = viewerFromReq(req);
    const result = await getQuizzesService(filters, viewer);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateQuizController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req, 'quizId');
    const viewer = { id: req.user!.sub, role: req.user!.role };
    const quiz = await updateQuizService(id, viewer, req.body);

    await logAction({
      userId: viewer.id,
      action: 'QUIZ_UPDATE',
      entityType: 'Quiz',
      entityId: quiz.id,
      details: req.body,
      context: auditCtx(req),
    });

    res.status(200).json({ message: 'Quiz updated.', quiz });
  } catch (err) {
    next(err);
  }
}

export async function deleteQuizController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req, 'quizId');
    const viewer = { id: req.user!.sub, role: req.user!.role };
    const result = await deleteQuizService(id, viewer);

    await logAction({
      userId: viewer.id,
      action: 'QUIZ_ARCHIVE',
      entityType: 'Quiz',
      entityId: result.id,
      context: auditCtx(req),
    });

    res.status(200).json({ message: 'Quiz archived.', ...result });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Question CRUD
// ---------------------------------------------------------------------------

export async function addQuestionController(req: Request, res: Response, next: NextFunction) {
  try {
    const quizId = paramId(req, 'quizId');
    const viewer = { id: req.user!.sub, role: req.user!.role };
    const question = await addQuestionService(quizId, viewer, req.body);

    await logAction({
      userId: viewer.id,
      action: 'QUESTION_CREATE',
      entityType: 'Question',
      entityId: question.id,
      details: { quizId, type: question.type, points: question.points },
      context: auditCtx(req),
    });

    res.status(201).json({ message: 'Question added.', question });
  } catch (err) {
    next(err);
  }
}

export async function updateQuestionController(req: Request, res: Response, next: NextFunction) {
  try {
    const questionId = paramId(req, 'questionId');
    const viewer = { id: req.user!.sub, role: req.user!.role };
    const question = await updateQuestionService(questionId, viewer, req.body);

    await logAction({
      userId: viewer.id,
      action: 'QUESTION_UPDATE',
      entityType: 'Question',
      entityId: question.id,
      details: req.body,
      context: auditCtx(req),
    });

    res.status(200).json({ message: 'Question updated.', question });
  } catch (err) {
    next(err);
  }
}

export async function deleteQuestionController(req: Request, res: Response, next: NextFunction) {
  try {
    const questionId = paramId(req, 'questionId');
    const viewer = { id: req.user!.sub, role: req.user!.role };
    const result = await deleteQuestionService(questionId, viewer);

    await logAction({
      userId: viewer.id,
      action: 'QUESTION_DELETE',
      entityType: 'Question',
      entityId: result.id,
      context: auditCtx(req),
    });

    res.status(200).json({ message: 'Question deleted.', ...result });
  } catch (err) {
    next(err);
  }
}

export async function getQuestionBankController(req: Request, res: Response, next: NextFunction) {
  try {
    const viewer = { id: req.user!.sub, role: req.user!.role };
    const filters: QuestionBankQueryInput = {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
      ...(req.query.type ? { type: req.query.type as any } : {}),
      ...(req.query.search ? { search: String(req.query.search) } : {}),
    };
    const result = await getQuestionBank(viewer, filters);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Attempts
// ---------------------------------------------------------------------------

export async function startAttemptController(req: Request, res: Response, next: NextFunction) {
  try {
    const quizId = paramId(req, 'quizId');
    const userId = req.user!.sub;
    const role = req.user!.role;
    const result = await startAttemptService(quizId, userId, role, req.body);

    await logAction({
      userId,
      action: 'QUIZ_ATTEMPT_START',
      entityType: 'QuizAttempt',
      entityId: result.attempt.id,
      details: { quizId, attemptNumber: result.attempt.attemptNumber },
      context: auditCtx(req),
    });

    res.status(201).json({ message: 'Attempt started.', attempt: result.attempt });
  } catch (err) {
    next(err);
  }
}

export async function saveProgressController(req: Request, res: Response, next: NextFunction) {
  try {
    const attemptId = paramId(req, 'attemptId');
    const userId = req.user!.sub;
    const result = await saveProgressService(attemptId, userId, req.body);
    res.status(200).json({ message: 'Progress saved.', ...result });
  } catch (err) {
    next(err);
  }
}

export async function submitAttemptController(req: Request, res: Response, next: NextFunction) {
  try {
    const attemptId = paramId(req, 'attemptId');
    const userId = req.user!.sub;
    const role = req.user!.role;
    const result = await submitAttemptService(attemptId, userId, role, req.body);

    await logAction({
      userId,
      action: 'QUIZ_ATTEMPT_SUBMIT',
      entityType: 'QuizAttempt',
      entityId: result.attempt.id,
      details: {
        score: result.attempt.score,
        scorePercentage: result.attempt.scorePercentage,
        passed: result.attempt.passed,
        status: result.attempt.status,
      },
      context: auditCtx(req),
    });

    res.status(200).json({
      message: 'Attempt submitted.',
      attempt: result.attempt,
      results: result.results,
    });
  } catch (err) {
    next(err);
  }
}

export async function getAttemptController(req: Request, res: Response, next: NextFunction) {
  try {
    const attemptId = paramId(req, 'attemptId');
    const viewer = { id: req.user!.sub, role: req.user!.role };
    const result = await getAttemptService(attemptId, viewer);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getAttemptsController(req: Request, res: Response, next: NextFunction) {
  try {
    const quizId = paramId(req, 'quizId');
    const viewer = { id: req.user!.sub, role: req.user!.role };
    const result = await getAttemptsService(quizId, viewer);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function manualGradeController(req: Request, res: Response, next: NextFunction) {
  try {
    const attemptId = paramId(req, 'attemptId');
    const viewer = { id: req.user!.sub, role: req.user!.role };
    const result = await manualGradeService(attemptId, viewer, req.body);

    await logAction({
      userId: viewer.id,
      action: 'QUIZ_MANUAL_GRADE',
      entityType: 'QuizAttempt',
      entityId: attemptId,
      details: { grades: req.body.grades },
      context: auditCtx(req),
    });

    res.status(200).json({ message: 'Manual grading applied.', attempt: result.attempt });
  } catch (err) {
    next(err);
  }
}

export async function getResultsController(req: Request, res: Response, next: NextFunction) {
  try {
    const attemptId = paramId(req, 'attemptId');
    const viewer = { id: req.user!.sub, role: req.user!.role };
    const results = await getResultsService(attemptId, viewer);
    res.status(200).json({ results });
  } catch (err) {
    next(err);
  }
}

export async function getAnalyticsController(req: Request, res: Response, next: NextFunction) {
  try {
    const quizId = paramId(req, 'quizId');
    const viewer = { id: req.user!.sub, role: req.user!.role };
    if (viewer.role !== 'ADMIN' && viewer.role !== 'TEACHER') {
      res.status(403).json({ message: 'Only admins and teachers can view analytics.' });
      return;
    }
    const analytics = await getQuizAnalytics(quizId);
    res.status(200).json({ analytics });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Service error handler
// ---------------------------------------------------------------------------

export function quizErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (isHttpError(err)) {
    res.status(err.statusCode).json({ message: err.message, code: err.code });
    return;
  }
  next(err);
}
