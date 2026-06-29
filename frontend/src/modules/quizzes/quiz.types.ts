// src/modules/quizzes/quiz.types.ts
import type {
  Answer,
  ManualGrading,
  Prisma,
  Question,
  QuestionType,
  Quiz,
  QuizAttempt,
  QuizStatus,
  Role,
  User,
} from '@prisma/client';

// ---------------------------------------------------------------------------
// Filters / pagination
// ---------------------------------------------------------------------------

export interface QuizFilters {
  page: number;
  limit: number;
  search?: string;
  status?: QuizStatus;
  contentId?: string;
  createdBy?: string;
  sortBy: 'createdAt' | 'updatedAt' | 'title' | 'passingScore';
  sortOrder: 'asc' | 'desc';
}

// ---------------------------------------------------------------------------
// API response shapes
// ---------------------------------------------------------------------------

export type QuizResponse = Quiz & {
  questionCount: number;
  attemptCount?: number;
};

export type QuestionResponse = Omit<Question, 'correctAnswer'> & {
  // `correctAnswer` is only included when the viewer is the quiz owner/admin
  // AND explicitly authorized to see it (NEVER exposed to students taking the quiz).
  correctAnswer?: Prisma.JsonValue | null;
};

export type AttemptResponse = QuizAttempt & {
  questionCount?: number;
};

export interface QuestionResult {
  questionId: string;
  type: QuestionType;
  questionText: string;
  pointsPossible: number;
  pointsAwarded: number | null;
  isCorrect: boolean | null;
  isManualGraded: boolean;
  studentAnswer: unknown;
  correctAnswer?: unknown;
  explanation?: string | null;
  feedback?: string | null;
}

export interface QuizResultResponse {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  status: string;
  score: number | null;
  maxPossibleScore: number | null;
  scorePercentage: number | null;
  passed: boolean | null;
  timeSpent: number;
  attemptNumber: number;
  startedAt: Date | null;
  submittedAt: Date | null;
  questions: QuestionResult[];
  hasUngradedManual: boolean;
}

export interface QuizListResponse {
  data: QuizResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface QuizAnalyticsResponse {
  quizId: string;
  quizTitle: string;
  totalAttempts: number;
  uniqueStudents: number;
  averageScore: number;
  medianScore: number;
  passRate: number;
  averageTimeSpentSeconds: number;
  scoreDistribution: Array<{ range: string; count: number }>;
  questionAnalysis: Array<{
    questionId: string;
    questionText: string;
    type: QuestionType;
    pointsPossible: number;
    difficultyIndex: number; // 0-1 (proportion correct)
    discriminationIndex: number; // -1 to +1
    correctCount: number;
    incorrectCount: number;
    ungradedCount: number;
    totalAttempts: number;
  }>;
}

export interface QuestionBankItem {
  id: string;
  type: QuestionType;
  questionText: string;
  options: Prisma.JsonValue | null;
  points: number;
  metadata: Prisma.JsonValue | null;
  quizId: string;
  quizTitle: string;
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// Grading result (from grading-engine)
// ---------------------------------------------------------------------------

export interface GradeResult {
  isCorrect: boolean | null; // null = requires manual grading
  pointsAwarded: number | null; // null = requires manual grading
  feedback?: string;
}
