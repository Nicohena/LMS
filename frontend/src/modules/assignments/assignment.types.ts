// src/modules/assignments/assignment.types.ts
import type {
  Assignment,
  AssignmentStatus,
  Enrollment,
  GradingStatus,
  PeerReview,
  PeerReviewStatus,
  Prisma,
  Rubric,
  Submission,
  SubmissionStatus,
  User,
} from '@prisma/client';

// ---------------------------------------------------------------------------
// Filters / pagination
// ---------------------------------------------------------------------------

export interface AssignmentFilters {
  page: number;
  limit: number;
  search?: string;
  status?: AssignmentStatus;
  contentId?: string;
  createdBy?: string;
  sortBy: 'createdAt' | 'updatedAt' | 'title' | 'dueDate';
  sortOrder: 'asc' | 'desc';
}

export interface SubmissionFilters {
  page: number;
  limit: number;
  status?: SubmissionStatus;
  gradingStatus?: GradingStatus;
  userId?: string;
}

// ---------------------------------------------------------------------------
// API response shapes
// ---------------------------------------------------------------------------

export interface CreatorSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export type AssignmentResponse = Omit<Assignment, 'createdBy'> & {
  createdBy: CreatorSummary;
  submissionCount?: number;
  hasRubric?: boolean;
};

export interface AssignmentDetailResponse extends AssignmentResponse {
  rubric: Rubric | null;
}

export interface AssignmentListResponse {
  data: AssignmentResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type RubricResponse = Rubric;

export interface SubmissionFile {
  public_id: string;
  secure_url: string;
  original_filename: string;
  size: number;
  format?: string;
}

export interface SubmissionContent {
  text?: string;
  files?: SubmissionFile[];
  links?: string[];
}

export type SubmissionResponse = Submission & {
  user?: CreatorSummary;
  grader?: CreatorSummary | null;
};

export interface SubmissionListResponse {
  data: SubmissionResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type PeerReviewResponse = PeerReview & {
  reviewer?: CreatorSummary;
  submission?: {
    id: string;
    userId: string;
    assignmentId: string;
  };
};

export type GradeHistoryResponse = {
  id: string;
  submissionId: string;
  previousGrade: number | null;
  newGrade: number;
  changedBy: CreatorSummary;
  reason: string | null;
  createdAt: Date;
};

export interface AssignmentAnalyticsResponse {
  assignmentId: string;
  assignmentTitle: string;
  totalEnrolled: number;
  totalSubmissions: number;
  submissionRate: number;
  averageScore: number;
  medianScore: number;
  gradeDistribution: Array<{ range: string; count: number }>;
  lateSubmissions: number;
  pendingGrading: number;
}
