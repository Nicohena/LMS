// src/modules/quizzes/quiz.service.ts
import { Prisma, Role } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError, ForbiddenError, ValidationError, ConflictError } from '../../common/errors';
import { gradeQuestion, isAutoGradable, requiresManualGrading } from './grading-engine.service';
import { recalculateOverallProgress } from '../enrollments/progress-calculator.service';
import { cacheDelete } from '../../common/services/cache.service';
import { CACHE_KEYS } from '../enrollments/enrollment.types';
import type {
  QuestionResponse,
  QuizAnalyticsResponse,
  QuizFilters,
  QuizListResponse,
  QuizResultResponse,
  QuizResponse,
  QuestionResult,
  QuestionBankItem,
} from './quiz.types';
import type {
  AddQuestionInput,
  CreateQuizInput,
  ManualGradeInput,
  QuestionBankQueryInput,
  SaveProgressInput,
  StartAttemptInput,
  SubmitAttemptInput,
  UpdateQuestionInput,
  UpdateQuizInput,
} from './quiz.schemas';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

function assertValidObjectId(id: string, what = 'Resource'): void {
  if (!OBJECT_ID_RE.test(id)) {
    throw new NotFoundError(`${what} not found`);
  }
}

async function assertCanManageQuiz(
  quizId: string,
  viewer: { id: string; role: Role },
): Promise<{ id: string; createdBy: string; title: string }> {
  assertValidObjectId(quizId, 'Quiz');
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { id: true, createdBy: true, title: true },
  });
  if (!quiz) throw new NotFoundError('Quiz not found');
  if (viewer.role === 'ADMIN') return quiz;
  if (viewer.role === 'TEACHER' && quiz.createdBy === viewer.id) return quiz;
  throw new ForbiddenError('You can only manage quizzes you own');
}

async function assertCanManageQuestion(
  questionId: string,
  viewer: { id: string; role: Role },
): Promise<{ id: string; quizId: string }> {
  assertValidObjectId(questionId, 'Question');
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { id: true, quizId: true, quiz: { select: { createdBy: true } } },
  });
  if (!question) throw new NotFoundError('Question not found');
  if (viewer.role === 'ADMIN') return { id: question.id, quizId: question.quizId };
  if (viewer.role === 'TEACHER' && question.quiz.createdBy === viewer.id) {
    return { id: question.id, quizId: question.quizId };
  }
  throw new ForbiddenError('You can only manage questions in quizzes you own');
}

function toQuizResponse(
  quiz: any,
): QuizResponse {
  const { _count, ...rest } = quiz;
  return {
    ...rest,
    questionCount: _count?.questions ?? 0,
    attemptCount: _count?.attempts ?? 0,
  };
}

function buildQuizWhere(
  filters: QuizFilters,
  viewer?: { id: string; role: Role },
): Prisma.QuizWhereInput {
  const where: Prisma.QuizWhereInput = {};

  // Visibility: STUDENT and anonymous see only PUBLISHED.
  // TEACHER sees PUBLISHED + their own (DRAFT/ARCHIVED).
  // ADMIN sees everything.
  const isAuthor = viewer && (viewer.role === 'ADMIN' || viewer.role === 'TEACHER');
  if (filters.status) {
    where.status = filters.status;
  } else if (isAuthor) {
    where.OR = [{ status: 'PUBLISHED' }, { createdBy: viewer!.id }];
  } else {
    where.status = 'PUBLISHED';
  }

  if (filters.contentId) where.contentId = filters.contentId;
  if (filters.createdBy) where.createdBy = filters.createdBy;
  if (filters.search) {
    where.AND = [
      ...(where.AND ? (Array.isArray(where.AND) ? where.AND : [where.AND]) : []),
      {
        OR: [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ],
      },
    ];
  }
  return where;
}

// ---------------------------------------------------------------------------
// Quiz CRUD
// ---------------------------------------------------------------------------

export async function createQuiz(
  userId: string,
  role: Role,
  data: CreateQuizInput,
): Promise<QuizResponse> {
  if (role !== 'ADMIN' && role !== 'TEACHER') {
    throw new ForbiddenError('Only admins and teachers can create quizzes');
  }

  // If contentId provided, validate it exists and user has permission
  if (data.contentId) {
    assertValidObjectId(data.contentId, 'Content');
    const content = await prisma.content.findUnique({
      where: { id: data.contentId },
      select: { id: true, module: { select: { course: { select: { createdBy: true } } } } },
    });
    if (!content) throw new NotFoundError('Content not found');
    if (role === 'TEACHER' && content.module.course.createdBy !== userId) {
      throw new ForbiddenError('You can only link quizzes to content in courses you own');
    }
  }

  const quiz = await prisma.quiz.create({
    data: {
      ...(data.contentId ? { contentId: data.contentId } : {}),
      title: data.title,
      description: data.description,
      instructions: data.instructions,
      timeLimit: data.timeLimit,
      passingScore: data.passingScore,
      maxAttempts: data.maxAttempts,
      shuffleQuestions: data.shuffleQuestions,
      shuffleAnswers: data.shuffleAnswers,
      showFeedback: data.showFeedback,
      showCorrectAnswers: data.showCorrectAnswers,
      status: data.status,
      quizPassword: data.quizPassword || null,
      studentInfoRequired: data.studentInfoRequired || false,
      createdBy: userId,
    },
    include: { _count: { select: { questions: true, attempts: true } } },
  });

  return toQuizResponse(quiz);
}

export async function getQuiz(
  quizId: string,
  viewer?: { id: string; role: Role },
): Promise<{
  quiz: QuizResponse;
  questions: QuestionResponse[];
}> {
  assertValidObjectId(quizId, 'Quiz');
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { _count: { select: { questions: true, attempts: true } } },
  });
  if (!quiz) throw new NotFoundError('Quiz not found');

  // Visibility check
  const isAuthor = viewer && (viewer.role === 'ADMIN' || viewer.role === 'TEACHER');
  const isOwner = viewer && quiz.createdBy === viewer.id;
  if (!isAuthor && quiz.status !== 'PUBLISHED' && !isOwner) {
    throw new NotFoundError('Quiz not found');
  }

  const questions = await prisma.question.findMany({
    where: { quizId },
    orderBy: { order: 'asc' },
  });

  // Hide correctAnswer unless viewer is the quiz owner/admin AND explicitly allowed
  // (showCorrectAnswers controls post-completion display, not pre-attempt viewing).
  const canSeeAnswers = isAuthor && isOwner;
  const visibleQuestions: QuestionResponse[] = questions.map((q) => {
    if (canSeeAnswers) return q as QuestionResponse;
    const { correctAnswer: _drop, ...rest } = q;
    return rest as QuestionResponse;
  });

  return {
    quiz: toQuizResponse(quiz),
    questions: visibleQuestions,
  };
}

export async function getQuizzes(
  filters: QuizFilters,
  viewer?: { id: string; role: Role },
): Promise<QuizListResponse> {
  const where = buildQuizWhere(filters, viewer);
  const skip = (filters.page - 1) * filters.limit;
  const take = filters.limit;

  const [rows, total] = await Promise.all([
    prisma.quiz.findMany({
      where,
      skip,
      take,
      orderBy: { [filters.sortBy]: filters.sortOrder },
      include: { _count: { select: { questions: true, attempts: true } } },
    }),
    prisma.quiz.count({ where }),
  ]);

  return {
    data: rows.map(toQuizResponse),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  };
}

export async function updateQuiz(
  quizId: string,
  viewer: { id: string; role: Role },
  data: UpdateQuizInput,
): Promise<QuizResponse> {
  await assertCanManageQuiz(quizId, viewer);

  // Validate contentId if provided
  if (data.contentId) {
    assertValidObjectId(data.contentId, 'Content');
    const content = await prisma.content.findUnique({
      where: { id: data.contentId },
      select: { id: true, module: { select: { course: { select: { createdBy: true } } } } },
    });
    if (!content) throw new NotFoundError('Content not found');
    if (viewer.role === 'TEACHER' && content.module.course.createdBy !== viewer.id) {
      throw new ForbiddenError('You can only link quizzes to content in courses you own');
    }
  }

  // Don't set contentId to null/undefined — MongoDB unique constraint treats null as a value
  const updateData: any = { ...data };
  if (updateData.contentId === null || updateData.contentId === undefined) {
    delete updateData.contentId;
  }
  const updated = await prisma.quiz.update({
    where: { id: quizId },
    data: updateData,
    include: { _count: { select: { questions: true, attempts: true } } },
  });

  return toQuizResponse(updated);
}

export async function deleteQuiz(
  quizId: string,
  viewer: { id: string; role: Role },
): Promise<{ id: string; status: string }> {
  await assertCanManageQuiz(quizId, viewer);

  // Actually delete the quiz and all related data (questions, attempts cascade)
  await prisma.quiz.delete({ where: { id: quizId } });

  return { id: quizId, status: 'DELETED' };
}

// ---------------------------------------------------------------------------
// Question CRUD
// ---------------------------------------------------------------------------

export async function addQuestion(
  quizId: string,
  viewer: { id: string; role: Role },
  data: AddQuestionInput,
): Promise<QuestionResponse> {
  await assertCanManageQuiz(quizId, viewer);

  // Validate correctAnswer/options per type
  validateQuestionData(data.type, data.options, data.correctAnswer);

  // Auto-append order
  let order = data.order;
  if (order === undefined) {
    const max = await prisma.question.aggregate({
      where: { quizId },
      _max: { order: true },
    });
    order = (max._max.order ?? -1) + 1;
  }

  const question = await prisma.question.create({
    data: {
      quizId,
      type: data.type,
      questionText: data.questionText,
      questionImage: data.questionImage,
      explanation: data.explanation,
      options: data.options as Prisma.InputJsonValue | undefined,
      correctAnswer: data.correctAnswer as Prisma.InputJsonValue | undefined,
      points: data.points,
      order,
      isRequired: data.isRequired ?? true,
      metadata: data.metadata as Prisma.InputJsonValue | undefined,
    },
  });

  return question as QuestionResponse;
}

export async function updateQuestion(
  questionId: string,
  viewer: { id: string; role: Role },
  data: UpdateQuestionInput,
): Promise<QuestionResponse> {
  await assertCanManageQuestion(questionId, viewer);

  // If type or options or correctAnswer is being changed, validate
  if (data.type || data.options || data.correctAnswer) {
    const existing = await prisma.question.findUnique({
      where: { id: questionId },
      select: { type: true, options: true, correctAnswer: true },
    });
    if (!existing) throw new NotFoundError('Question not found');
    const newType = data.type ?? existing.type;
    const newOptions = data.options !== undefined ? data.options : existing.options;
    const newCorrect = data.correctAnswer !== undefined ? data.correctAnswer : existing.correctAnswer;
    validateQuestionData(newType as string, newOptions as any, newCorrect as any);
  }

  const updated = await prisma.question.update({
    where: { id: questionId },
    data: {
      ...(data.type !== undefined && { type: data.type }),
      ...(data.questionText !== undefined && { questionText: data.questionText }),
      ...(data.questionImage !== undefined && { questionImage: data.questionImage }),
      ...(data.explanation !== undefined && { explanation: data.explanation }),
      ...(data.options !== undefined && { options: data.options as Prisma.InputJsonValue }),
      ...(data.correctAnswer !== undefined && { correctAnswer: data.correctAnswer as Prisma.InputJsonValue }),
      ...(data.points !== undefined && { points: data.points }),
      ...(data.order !== undefined && { order: data.order }),
      ...(data.isRequired !== undefined && { isRequired: data.isRequired }),
      ...(data.metadata !== undefined && { metadata: data.metadata as Prisma.InputJsonValue }),
    },
  });

  return updated as QuestionResponse;
}

export async function deleteQuestion(
  questionId: string,
  viewer: { id: string; role: Role },
): Promise<{ id: string; deleted: boolean }> {
  const { id, quizId } = await assertCanManageQuestion(questionId, viewer);

  // Check if any attempts have answers for this question
  const answerCount = await prisma.answer.count({ where: { questionId: id } });
  if (answerCount > 0) {
    throw new ConflictError(
      `Cannot delete question: ${answerCount} student answers reference it. Consider archiving the quiz instead.`,
    );
  }

  await prisma.question.delete({ where: { id } });

  // Reorder remaining questions
  const remaining = await prisma.question.findMany({
    where: { quizId },
    orderBy: { order: 'asc' },
    select: { id: true },
  });
  await Promise.all(
    remaining.map((q, idx) =>
      prisma.question.update({ where: { id: q.id }, data: { order: idx } }),
    ),
  );

  return { id, deleted: true };
}

export async function getQuestionBank(
  viewer: { id: string; role: Role },
  filters: QuestionBankQueryInput,
): Promise<{ data: QuestionBankItem[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  if (viewer.role !== 'ADMIN' && viewer.role !== 'TEACHER') {
    throw new ForbiddenError('Only admins and teachers can access the question bank');
  }

  const where: Prisma.QuestionWhereInput = {};
  // TEACHER sees only their own questions; ADMIN sees all
  if (viewer.role === 'TEACHER') {
    where.quiz = { createdBy: viewer.id };
  }
  if (filters.type) where.type = filters.type;
  if (filters.search) {
    where.questionText = { contains: filters.search, mode: 'insensitive' };
  }

  const skip = (filters.page - 1) * filters.limit;
  const take = filters.limit;

  const [rows, total] = await Promise.all([
    prisma.question.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, type: true, questionText: true, options: true, points: true,
        metadata: true, createdAt: true,
        quiz: { select: { id: true, title: true } },
      },
    }),
    prisma.question.count({ where }),
  ]);

  return {
    data: rows.map((r) => ({
      id: r.id,
      type: r.type,
      questionText: r.questionText,
      options: r.options,
      points: r.points,
      metadata: r.metadata,
      quizId: r.quiz.id,
      quizTitle: r.quiz.title,
      createdAt: r.createdAt,
    })),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  };
}

// ---------------------------------------------------------------------------
// Question data validation (per type)
// ---------------------------------------------------------------------------

function validateQuestionData(
  type: string,
  options: unknown,
  correctAnswer: unknown,
): void {
  // For subjective types, options/correctAnswer are optional but may carry rubric info
  if (requiresManualGrading(type)) {
    return;
  }

  if (correctAnswer === undefined || correctAnswer === null) {
    throw new ValidationError(`correctAnswer is required for ${type} questions`);
  }

  switch (type) {
    case 'MULTIPLE_CHOICE_SINGLE':
    case 'TRUE_FALSE':
      // Single value (string for MCQ-Single, boolean/string for T/F)
      if (typeof correctAnswer !== 'string' && typeof correctAnswer !== 'boolean') {
        throw new ValidationError(`${type} correctAnswer must be a string or boolean`);
      }
      break;
    case 'MULTIPLE_CHOICE_MULTIPLE':
    case 'SORTING':
      if (!Array.isArray(correctAnswer)) {
        throw new ValidationError(`${type} correctAnswer must be an array`);
      }
      break;
    case 'FILL_IN_BLANK':
      if (typeof correctAnswer !== 'string' && !Array.isArray(correctAnswer)) {
        throw new ValidationError('FILL_IN_BLANK correctAnswer must be a string or array');
      }
      break;
    case 'MATCHING':
      if (typeof correctAnswer !== 'object' || Array.isArray(correctAnswer)) {
        throw new ValidationError('MATCHING correctAnswer must be an object (left→right map)');
      }
      break;
    default:
      break;
  }
}

// ---------------------------------------------------------------------------
// Attempts
// ---------------------------------------------------------------------------

export async function startAttempt(
  quizId: string,
  userId: string,
  role: Role,
  data: StartAttemptInput,
): Promise<{ attempt: any }> {
  assertValidObjectId(quizId, 'Quiz');
  assertValidObjectId(data.enrollmentId, 'Enrollment');

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { id: true, status: true, maxAttempts: true, timeLimit: true },
  });
  if (!quiz) throw new NotFoundError('Quiz not found');
  if (quiz.status !== 'PUBLISHED') {
    throw new ValidationError('Can only attempt PUBLISHED quizzes');
  }

  // Verify enrollment belongs to this user
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: data.enrollmentId },
    select: { id: true, userId: true, status: true, courseId: true },
  });
  if (!enrollment) throw new NotFoundError('Enrollment not found');
  if (enrollment.userId !== userId) {
    throw new ForbiddenError('You can only start attempts for your own enrollments');
  }
  if (enrollment.status !== 'ACTIVE') {
    throw new ValidationError('Cannot start attempts on a non-active enrollment');
  }

  // If quiz is linked to content, verify content belongs to enrolled course
  // (handled implicitly — students can only see the quiz via their course content)

  // Count existing attempts by this user on this quiz
  const existingAttempts = await prisma.quizAttempt.count({
    where: { quizId, userId },
  });
  if (existingAttempts >= quiz.maxAttempts) {
    throw new ConflictError(
      `Maximum attempts (${quiz.maxAttempts}) reached for this quiz`,
    );
  }

  // Check if there's an IN_PROGRESS attempt that hasn't been abandoned
  const inProgress = await prisma.quizAttempt.findFirst({
    where: { quizId, userId, status: 'IN_PROGRESS' },
    orderBy: { createdAt: 'desc' },
  });
  if (inProgress) {
    // Return the existing in-progress attempt
    return { attempt: inProgress };
  }

  const attempt = await prisma.quizAttempt.create({
    data: {
      quizId,
      userId,
      enrollmentId: data.enrollmentId,
      attemptNumber: existingAttempts + 1,
      status: 'IN_PROGRESS',
      startTime: new Date(),
    },
  });

  return { attempt };
}

export async function saveProgress(
  attemptId: string,
  userId: string,
  data: SaveProgressInput,
): Promise<{ id: string; status: string; timeSpent: number }> {
  assertValidObjectId(attemptId, 'Attempt');
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    select: { id: true, userId: true, status: true, timeSpent: true },
  });
  if (!attempt) throw new NotFoundError('Attempt not found');
  if (attempt.userId !== userId) {
    throw new ForbiddenError('You can only save progress on your own attempts');
  }
  if (attempt.status !== 'IN_PROGRESS') {
    throw new ValidationError(`Cannot save progress on an attempt with status ${attempt.status}`);
  }

  // Check time limit if applicable
  await enforceTimeLimit(attempt.id);

  const updated = await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: {
      answers: data.answers as Prisma.InputJsonValue,
      timeSpent: Math.max(attempt.timeSpent, data.timeSpent),
    },
    select: { id: true, status: true, timeSpent: true },
  });

  return updated;
}

export async function submitAttempt(
  attemptId: string,
  userId: string,
  role: Role,
  data: SubmitAttemptInput,
): Promise<{ attempt: any; results: QuizResultResponse }> {
  assertValidObjectId(attemptId, 'Attempt');
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    select: { id: true, userId: true, status: true, timeSpent: true, quizId: true, enrollmentId: true, attemptNumber: true, startTime: true },
  });
  if (!attempt) throw new NotFoundError('Attempt not found');
  if (attempt.userId !== userId) {
    throw new ForbiddenError('You can only submit your own attempts');
  }
  if (attempt.status !== 'IN_PROGRESS') {
    throw new ValidationError(`Attempt already ${attempt.status}`);
  }

  // Check time limit (auto-transition to TIMED_OUT if exceeded)
  const timedOut = await enforceTimeLimit(attempt.id);
  const finalStatus = timedOut ? 'TIMED_OUT' : 'COMPLETED';

  // Fetch all questions for this quiz
  const questions = await prisma.question.findMany({
    where: { quizId: attempt.quizId },
    orderBy: { order: 'asc' },
  });

  // Auto-grade objective questions; create Answer records for all submitted answers
  let totalScore = 0;
  let maxPossibleScore = 0;
  const hasManualGrading = questions.some((q) => requiresManualGrading(q.type));

  // Delete any previous Answer records for this attempt (in case of re-submit)
  await prisma.answer.deleteMany({ where: { attemptId } });

  for (const question of questions) {
    maxPossibleScore += question.points;
    const studentAnswer = data.answers[question.id];

    if (studentAnswer === undefined || studentAnswer === null) {
      // No answer submitted for this question
      if (question.isRequired) {
        // Required but unanswered — counts as incorrect/zero
        await prisma.answer.create({
          data: {
            attemptId,
            questionId: question.id,
            answer: JSON.parse(JSON.stringify({ skipped: true })),
            isCorrect: false,
            pointsAwarded: 0,
            feedback: 'No answer submitted.',
          },
        });
      }
      continue;
    }

    const grade = gradeQuestion(question, studentAnswer);
    await prisma.answer.create({
      data: {
        attemptId,
        questionId: question.id,
        answer: JSON.parse(JSON.stringify(studentAnswer ?? { skipped: true })),
        isCorrect: grade.isCorrect,
        pointsAwarded: grade.pointsAwarded,
        feedback: grade.feedback,
      },
    });

    if (grade.pointsAwarded !== null) {
      totalScore += grade.pointsAwarded;
    }
  }

  // Compute score percentage
  const scorePercentage = maxPossibleScore > 0
    ? Math.round((totalScore / maxPossibleScore) * 10000) / 100
    : 0;

  // Fetch quiz passingScore
  const quiz = await prisma.quiz.findUnique({
    where: { id: attempt.quizId },
    select: { passingScore: true },
  });
  // If manual grading is needed, result is 'pending' not pass/fail
  const passed = hasManualGrading ? null : (scorePercentage >= (quiz?.passingScore ?? 70));

  // If manual grading needed, score is provisional
  const finalScore = hasManualGrading ? totalScore : totalScore;
  const finalScorePercentage = hasManualGrading ? scorePercentage : scorePercentage;

  // Update attempt
  const updated = await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: {
      status: finalStatus,
      endTime: new Date(),
      timeSpent: Math.max(attempt.timeSpent, data.timeSpent),
      score: finalScore,
      maxPossibleScore,
      scorePercentage: finalScorePercentage,
      passed: hasManualGrading ? null : passed,
      answers: data.answers as Prisma.InputJsonValue,
      gradedAt: hasManualGrading ? null : new Date(),
    },
  });

  // Update progress on the linked content (if quiz is linked to content)
  if (quiz) {
    const quizWithContent = await prisma.quiz.findUnique({
      where: { id: attempt.quizId },
      select: { contentId: true },
    });
    if (quizWithContent?.contentId) {
      // Update or create progress record
      const existingProgress = await prisma.progress.findUnique({
        where: {
          enrollmentId_contentId: {
            enrollmentId: attempt.enrollmentId,
            contentId: quizWithContent.contentId,
          },
        },
      });
      const progressPercent = passed ? 100 : Math.round(scorePercentage);
      const newStatus = passed ? 'COMPLETED' : 'IN_PROGRESS';
      if (existingProgress) {
        // Only move forward
        await prisma.progress.update({
          where: { id: existingProgress.id },
          data: {
            progressPercent: Math.max(existingProgress.progressPercent, progressPercent),
            status: newStatus === 'COMPLETED' ? 'COMPLETED' : existingProgress.status,
            timeSpent: existingProgress.timeSpent + data.timeSpent,
            lastAccessedAt: new Date(),
            completedAt: passed ? (existingProgress.completedAt ?? new Date()) : existingProgress.completedAt,
          },
        });
      } else {
        await prisma.progress.create({
          data: {
            enrollmentId: attempt.enrollmentId,
            contentId: quizWithContent.contentId,
            progressPercent,
            status: newStatus,
            timeSpent: data.timeSpent,
            completedAt: passed ? new Date() : null,
          },
        });
      }

      // Recalculate overall enrollment progress
      await recalculateOverallProgress(attempt.enrollmentId);

      // Invalidate student dashboard cache
      await cacheDelete(CACHE_KEYS.studentDashboard(userId));
      await cacheDelete(CACHE_KEYS.enrollmentProgress(attempt.enrollmentId));
    }
  }

  // Build results response.
  // Students see correct answers + feedback only if quiz.showCorrectAnswers
  // is true (handled by buildResultsResponse via the quiz's showFeedback/showCorrectAnswers).
  const quizForResults = await prisma.quiz.findUnique({
    where: { id: attempt.quizId },
    select: { showCorrectAnswers: true, showFeedback: true },
  });
  const revealCorrect = quizForResults?.showCorrectAnswers ?? false;
  const showFeedback = quizForResults?.showFeedback ?? true;
  const results = await buildResultsResponse(updated.id, revealCorrect, showFeedback);

  return { attempt: updated, results };
}

// ---------------------------------------------------------------------------
// Manual grading
// ---------------------------------------------------------------------------

export async function manualGrade(
  attemptId: string,
  viewer: { id: string; role: Role },
  data: ManualGradeInput,
): Promise<{ attempt: any }> {
  assertValidObjectId(attemptId, 'Attempt');
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    select: { id: true, quizId: true, status: true, score: true, maxPossibleScore: true },
  });
  if (!attempt) throw new NotFoundError('Attempt not found');
  if (attempt.status !== 'COMPLETED' && attempt.status !== 'TIMED_OUT') {
    throw new ValidationError('Can only grade completed attempts');
  }

  // Permission: admin or quiz owner
  const quiz = await prisma.quiz.findUnique({
    where: { id: attempt.quizId },
    select: { createdBy: true },
  });
  if (!quiz) throw new NotFoundError('Quiz not found');
  if (viewer.role !== 'ADMIN' && quiz.createdBy !== viewer.id) {
    throw new ForbiddenError('You can only grade attempts for quizzes you own');
  }

  // Apply each grade
  let scoreDelta = 0;
  for (const grade of data.grades) {
    assertValidObjectId(grade.questionId, 'Question');
    const answer = await prisma.answer.findUnique({
      where: {
        attemptId_questionId: { attemptId, questionId: grade.questionId },
      },
      select: { id: true, pointsAwarded: true },
    });
    if (!answer) {
      throw new NotFoundError(`No answer found for question ${grade.questionId} in this attempt`);
    }

    const question = await prisma.question.findUnique({
      where: { id: grade.questionId },
      select: { points: true },
    });
    if (!question) throw new NotFoundError('Question not found');

    // Award points (clamped to [0, question.points])
    const clampedPoints = Math.min(Math.max(grade.pointsAwarded, 0), question.points);
    const oldPoints = answer.pointsAwarded ?? 0;
    scoreDelta += clampedPoints - oldPoints;

    // Update the answer
    await prisma.answer.update({
      where: { id: answer.id },
      data: {
        pointsAwarded: clampedPoints,
        feedback: grade.feedback,
        isCorrect: clampedPoints === question.points ? true : clampedPoints === 0 ? false : null,
      },
    });

    // Upsert ManualGrading record
    const existingGrading = await prisma.manualGrading.findUnique({
      where: {
        attemptId_questionId: { attemptId, questionId: grade.questionId },
      },
    });
    if (existingGrading) {
      await prisma.manualGrading.update({
        where: { id: existingGrading.id },
        data: {
          pointsAwarded: clampedPoints,
          pointsPossible: question.points,
          feedback: grade.feedback,
          gradedBy: viewer.id,
          gradedAt: new Date(),
        },
      });
    } else {
      await prisma.manualGrading.create({
        data: {
          attemptId,
          questionId: grade.questionId,
          pointsAwarded: clampedPoints,
          pointsPossible: question.points,
          feedback: grade.feedback,
          gradedBy: viewer.id,
        },
      });
    }
  }

  // Recalculate attempt score
  const newScore = (attempt.score ?? 0) + scoreDelta;
  const newScorePercentage = attempt.maxPossibleScore && attempt.maxPossibleScore > 0
    ? Math.round((newScore / attempt.maxPossibleScore) * 10000) / 100
    : 0;

  // Re-fetch quiz passingScore to recompute `passed`
  const quizWithPass = await prisma.quiz.findUnique({
    where: { id: attempt.quizId },
    select: { passingScore: true },
  });

  // Check if there are still ungraded answers
  const ungradedCount = await prisma.answer.count({
    where: { attemptId, isCorrect: null },
  });

  const updated = await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: {
      score: newScore,
      scorePercentage: newScorePercentage,
      passed: ungradedCount === 0 ? newScorePercentage >= (quizWithPass?.passingScore ?? 70) : null,
      gradedAt: ungradedCount === 0 ? new Date() : null,
      gradedBy: ungradedCount === 0 ? viewer.id : undefined,
    },
  });

  return { attempt: updated };
}

// ---------------------------------------------------------------------------
// Get attempt / results
// ---------------------------------------------------------------------------

export async function getAttempt(
  attemptId: string,
  viewer: { id: string; role: Role },
): Promise<{ attempt: any }> {
  assertValidObjectId(attemptId, 'Attempt');
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: { select: { id: true, title: true, createdBy: true, showCorrectAnswers: true, showFeedback: true } },
    },
  });
  if (!attempt) throw new NotFoundError('Attempt not found');

  // Permission: admin, quiz owner, or attempt owner
  const isOwner = attempt.userId === viewer.id;
  const isQuizOwner = attempt.quiz.createdBy === viewer.id;
  if (viewer.role !== 'ADMIN' && !isOwner && !isQuizOwner) {
    throw new ForbiddenError('You can only view your own attempts or those for quizzes you own');
  }

  return { attempt };
}

export async function getAttempts(
  quizId: string,
  viewer: { id: string; role: Role },
): Promise<{ attempts: any[] }> {
  assertValidObjectId(quizId, 'Quiz');
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { id: true, createdBy: true },
  });
  if (!quiz) throw new NotFoundError('Quiz not found');

  // STUDENT sees only their own attempts on this quiz
  // TEACHER sees all attempts for their own quiz
  // ADMIN sees all
  const where: Prisma.QuizAttemptWhereInput = { quizId };
  if (viewer.role === 'STUDENT') {
    where.userId = viewer.id;
  } else if (viewer.role === 'TEACHER' && quiz.createdBy !== viewer.id) {
    // Teacher trying to view attempts for a quiz they don't own — restrict to their own
    where.userId = viewer.id;
  }

  const attempts = await prisma.quizAttempt.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  });

  return { attempts };
}

export async function getResults(
  attemptId: string,
  viewer: { id: string; role: Role },
): Promise<QuizResultResponse> {
  assertValidObjectId(attemptId, 'Attempt');
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: { select: { id: true, title: true, createdBy: true, showCorrectAnswers: true, showFeedback: true } },
    },
  });
  if (!attempt) throw new NotFoundError('Attempt not found');

  // Permission
  const isOwner = attempt.userId === viewer.id;
  const isQuizOwner = attempt.quiz.createdBy === viewer.id;
  if (viewer.role !== 'ADMIN' && !isOwner && !isQuizOwner) {
    throw new ForbiddenError('You can only view results for your own attempts or those for quizzes you own');
  }

  // Students see correct answers only if quiz.showCorrectAnswers is true
  // Teachers/admins always see correct answers
  const revealCorrect = viewer.role === 'ADMIN' || isQuizOwner || attempt.quiz.showCorrectAnswers;
  const showFeedback = attempt.quiz.showFeedback || viewer.role === 'ADMIN' || isQuizOwner;

  return buildResultsResponse(attemptId, revealCorrect, showFeedback);
}

async function buildResultsResponse(
  attemptId: string,
  revealCorrect: boolean,
  showFeedback: boolean = true,
): Promise<QuizResultResponse> {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: { select: { id: true, title: true } },
    },
  });
  if (!attempt) throw new NotFoundError('Attempt not found');

  const answers = await prisma.answer.findMany({
    where: { attemptId },
    include: {
      question: {
        select: {
          id: true, type: true, questionText: true, points: true,
          correctAnswer: true, explanation: true,
        },
      },
    },
  });

  const questions: QuestionResult[] = answers.map((a) => ({
    questionId: a.questionId,
    type: a.question.type,
    questionText: a.question.questionText,
    pointsPossible: a.question.points,
    pointsAwarded: a.pointsAwarded,
    isCorrect: a.isCorrect,
    isManualGraded: requiresManualGrading(a.question.type),
    studentAnswer: a.answer,
    correctAnswer: revealCorrect ? a.question.correctAnswer : undefined,
    explanation: revealCorrect ? a.question.explanation : undefined,
    feedback: showFeedback ? a.feedback : undefined,
  }));

  const hasUngradedManual = questions.some((q) => q.isManualGraded && q.pointsAwarded === null);

  return {
    attemptId: attempt.id,
    quizId: attempt.quizId,
    quizTitle: attempt.quiz.title,
    status: attempt.status,
    score: attempt.score,
    maxPossibleScore: attempt.maxPossibleScore,
    scorePercentage: attempt.scorePercentage,
    passed: attempt.passed,
    timeSpent: attempt.timeSpent,
    attemptNumber: attempt.attemptNumber,
    startedAt: attempt.startTime,
    submittedAt: attempt.endTime,
    questions,
    hasUngradedManual,
  };
}

// ---------------------------------------------------------------------------
// Time limit enforcement
// ---------------------------------------------------------------------------

/**
 * Check if the attempt has exceeded the quiz's time limit. If so, mark it
 * as TIMED_OUT and return true. Returns false if still within the limit.
 */
async function enforceTimeLimit(attemptId: string): Promise<boolean> {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: { quiz: { select: { timeLimit: true } } },
  });
  if (!attempt || !attempt.quiz.timeLimit || !attempt.startTime) {
    return false;
  }
  const elapsedMs = Date.now() - attempt.startTime.getTime();
  const limitMs = attempt.quiz.timeLimit * 60 * 1000;
  if (elapsedMs > limitMs) {
    await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: { status: 'TIMED_OUT', endTime: new Date() },
    });
    return true;
  }
  return false;
}
