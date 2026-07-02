// src/modules/quizzes/quiz.schemas.ts
import { z } from 'zod';
import { QuestionType, QuizStatus } from '@prisma/client';

// ---------------------------------------------------------------------------
// Quiz CRUD
// ---------------------------------------------------------------------------

export const createQuizSchema = z.object({
  contentId: z.string().min(1).optional(),
  title: z.string().min(1, 'Title is required').max(200).trim(),
  description: z.string().max(5000).optional(),
  instructions: z.string().max(5000).optional(),
  timeLimit: z.number().int().positive().max(600).optional(), // minutes
  passingScore: z.number().min(0).max(100).default(70),
  maxAttempts: z.number().int().positive().max(100).default(1),
  shuffleQuestions: z.boolean().default(false),
  shuffleAnswers: z.boolean().default(false),
  showFeedback: z.boolean().default(true),
  showCorrectAnswers: z.boolean().default(false),
  status: z.nativeEnum(QuizStatus).default('DRAFT'),
  quizPassword: z.string().min(1).max(100).optional(),
  studentInfoRequired: z.boolean().optional(),
});

export const updateQuizSchema = z.object({
  contentId: z.string().min(1).nullable().optional(),
  title: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(5000).nullable().optional(),
  instructions: z.string().max(5000).nullable().optional(),
  timeLimit: z.number().int().positive().max(600).nullable().optional(),
  passingScore: z.number().min(0).max(100).optional(),
  maxAttempts: z.number().int().positive().max(100).optional(),
  shuffleQuestions: z.boolean().optional(),
  shuffleAnswers: z.boolean().optional(),
  showFeedback: z.boolean().optional(),
  showCorrectAnswers: z.boolean().optional(),
  status: z.nativeEnum(QuizStatus).optional(),
  quizPassword: z.string().min(1).max(100).nullable().optional(),
  studentInfoRequired: z.boolean().optional(),
});

export const quizQuerySchema = z.object({
  page: z.string().optional().transform((v) => (v ? Math.max(1, Number(v)) : 1)),
  limit: z.string().optional().transform((v) => {
    if (!v) return 10;
    return Math.min(100, Math.max(1, Number(v)));
  }),
  search: z.string().trim().optional(),
  status: z.nativeEnum(QuizStatus).optional(),
  contentId: z.string().min(1).optional(),
  createdBy: z.string().min(1).optional(),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'title', 'passingScore'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// ---------------------------------------------------------------------------
// Question CRUD
// ---------------------------------------------------------------------------

export const addQuestionSchema = z.object({
  type: z.nativeEnum(QuestionType),
  questionText: z.string().min(1, 'Question text is required').max(5000).trim(),
  questionImage: z.string().url().optional(),
  explanation: z.string().max(2000).optional(),
  options: z.any().optional(), // shape validated per-type in the service
  correctAnswer: z.any().optional(),
  points: z.number().int().positive().max(100).default(1),
  order: z.number().int().nonnegative().optional(),
  isRequired: z.boolean().optional().default(true),
  metadata: z.any().optional(),
});

export const updateQuestionSchema = z.object({
  type: z.nativeEnum(QuestionType).optional(),
  questionText: z.string().min(1).max(5000).trim().optional(),
  questionImage: z.string().url().nullable().optional(),
  explanation: z.string().max(2000).nullable().optional(),
  options: z.any().optional(),
  correctAnswer: z.any().optional(),
  points: z.number().int().positive().max(100).optional(),
  order: z.number().int().nonnegative().optional(),
  isRequired: z.boolean().optional(),
  metadata: z.any().optional(),
});

// ---------------------------------------------------------------------------
// Attempts
// ---------------------------------------------------------------------------

export const startAttemptSchema = z.object({
  enrollmentId: z.string().min(1, 'enrollmentId is required'),
});

export const saveProgressSchema = z.object({
  answers: z.record(z.string(), z.unknown()).default({}),
  timeSpent: z.number().int().nonnegative().max(86400).default(0),
});

export const submitAttemptSchema = z.object({
  answers: z.record(z.string(), z.unknown()),
  timeSpent: z.number().int().nonnegative().max(86400).default(0),
});

// ---------------------------------------------------------------------------
// Manual grading
// ---------------------------------------------------------------------------

export const manualGradeSchema = z.object({
  grades: z
    .array(
      z.object({
        questionId: z.string().min(1),
        pointsAwarded: z.number().min(0),
        feedback: z.string().max(2000).optional(),
      }),
    )
    .min(1, 'At least one grade is required'),
});

// ---------------------------------------------------------------------------
// Question bank query
// ---------------------------------------------------------------------------

export const questionBankQuerySchema = z.object({
  page: z.string().optional().transform((v) => (v ? Math.max(1, Number(v)) : 1)),
  limit: z.string().optional().transform((v) => {
    if (!v) return 20;
    return Math.min(100, Math.max(1, Number(v)));
  }),
  type: z.nativeEnum(QuestionType).optional(),
  search: z.string().trim().optional(),
});

// ---------------------------------------------------------------------------
// Derived types
// ---------------------------------------------------------------------------

export type CreateQuizInput = z.infer<typeof createQuizSchema>;
export type UpdateQuizInput = z.infer<typeof updateQuizSchema>;
export type QuizQueryInput = z.infer<typeof quizQuerySchema>;
export type AddQuestionInput = z.infer<typeof addQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type StartAttemptInput = z.infer<typeof startAttemptSchema>;
export type SaveProgressInput = z.infer<typeof saveProgressSchema>;
export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>;
export type ManualGradeInput = z.infer<typeof manualGradeSchema>;
export type QuestionBankQueryInput = z.infer<typeof questionBankQuerySchema>;
