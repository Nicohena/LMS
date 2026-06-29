// src/modules/assignments/assignment.schemas.ts
import { z } from 'zod';
import { AssignmentStatus } from '@prisma/client';

// ---------------------------------------------------------------------------
// Assignment CRUD
// ---------------------------------------------------------------------------

export const createAssignmentSchema = z.object({
  contentId: z.string().min(1).optional(),
  title: z.string().min(1, 'Title is required').max(200).trim(),
  description: z.string().max(10000).optional(),
  instructions: z.string().max(10000).optional(),
  dueDate: z.string().datetime().optional().transform((v) => (v ? new Date(v) : undefined)),
  lateSubmissionDeadline: z.string().datetime().optional().transform((v) => (v ? new Date(v) : undefined)),
  latePenaltyPercentage: z.number().min(0).max(100).default(0),
  maxPoints: z.number().positive().max(10000).default(100),
  allowResubmissions: z.boolean().default(true),
  maxResubmissions: z.number().int().nonnegative().max(100).default(3),
  allowPeerReview: z.boolean().default(false),
  peerReviewDeadline: z.string().datetime().optional().transform((v) => (v ? new Date(v) : undefined)),
  peerReviewCount: z.number().int().positive().max(20).default(2),
  requiresFileUpload: z.boolean().default(true),
  allowedFileTypes: z.array(z.string().min(1).max(20)).max(20).default(['pdf', 'docx', 'zip']),
  maxFileSizeMB: z.number().int().positive().max(500).default(10),
  status: z.nativeEnum(AssignmentStatus).default('DRAFT'),
}).strict();

export const updateAssignmentSchema = z.object({
  contentId: z.string().min(1).nullable().optional(),
  title: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(10000).nullable().optional(),
  instructions: z.string().max(10000).nullable().optional(),
  dueDate: z.string().datetime().nullable().optional().transform((v) => (v ? new Date(v) : undefined)),
  lateSubmissionDeadline: z.string().datetime().nullable().optional().transform((v) => (v ? new Date(v) : undefined)),
  latePenaltyPercentage: z.number().min(0).max(100).optional(),
  maxPoints: z.number().positive().max(10000).optional(),
  allowResubmissions: z.boolean().optional(),
  maxResubmissions: z.number().int().nonnegative().max(100).optional(),
  allowPeerReview: z.boolean().optional(),
  peerReviewDeadline: z.string().datetime().nullable().optional().transform((v) => (v ? new Date(v) : undefined)),
  peerReviewCount: z.number().int().positive().max(20).optional(),
  requiresFileUpload: z.boolean().optional(),
  allowedFileTypes: z.array(z.string().min(1).max(20)).max(20).optional(),
  maxFileSizeMB: z.number().int().positive().max(500).optional(),
  status: z.nativeEnum(AssignmentStatus).optional(),
}).strict();

export const assignmentQuerySchema = z.object({
  page: z.string().optional().transform((v) => (v ? Math.max(1, Number(v)) : 1)),
  limit: z.string().optional().transform((v) => {
    if (!v) return 10;
    return Math.min(100, Math.max(1, Number(v)));
  }),
  search: z.string().trim().optional(),
  status: z.nativeEnum(AssignmentStatus).optional(),
  contentId: z.string().min(1).optional(),
  createdBy: z.string().min(1).optional(),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'title', 'dueDate'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
}).strict();

// ---------------------------------------------------------------------------
// Rubric
// ---------------------------------------------------------------------------

export const rubricCriterionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  levels: z
    .array(
      z.object({
        points: z.number().min(0),
        description: z.string().min(1).max(2000),
      }),
    )
    .min(1, 'At least one level is required per criterion'),
});

export const createRubricSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  criteria: z.array(rubricCriterionSchema).min(1, 'At least one criterion is required'),
  totalPoints: z.number().positive().max(10000).default(100),
}).strict();

export const updateRubricSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).nullable().optional(),
  criteria: z.array(rubricCriterionSchema).optional(),
  totalPoints: z.number().positive().max(10000).optional(),
}).strict();

// ---------------------------------------------------------------------------
// Submissions
// ---------------------------------------------------------------------------

export const submissionFileSchema = z.object({
  public_id: z.string().min(1),
  secure_url: z.string().url(),
  original_filename: z.string().min(1),
  size: z.number().int().nonnegative(),
  format: z.string().optional(),
});

export const createSubmissionSchema = z.object({
  enrollmentId: z.string().min(1, 'enrollmentId is required'),
  content: z.object({
    text: z.string().max(50000).optional(),
    files: z.array(submissionFileSchema).max(10).optional(),
    links: z.array(z.string().url()).max(10).optional(),
  }),
}).strict();

export const updateSubmissionSchema = z.object({
  content: z.object({
    text: z.string().max(50000).optional(),
    files: z.array(submissionFileSchema).max(10).optional(),
    links: z.array(z.string().url()).max(10).optional(),
  }),
}).strict();

export const gradeSubmissionSchema = z.object({
  grade: z.number().min(0),
  feedback: z.string().max(10000).optional(),
  revisionRequested: z.boolean().optional().default(false),
  revisionComments: z.string().max(10000).optional(),
}).strict();

export const requestRevisionSchema = z.object({
  comments: z.string().min(1, 'Revision comments are required').max(10000),
}).strict();

export const submitRevisionSchema = z.object({
  content: z.object({
    text: z.string().max(50000).optional(),
    files: z.array(submissionFileSchema).max(10).optional(),
    links: z.array(z.string().url()).max(10).optional(),
  }),
}).strict();

// ---------------------------------------------------------------------------
// Peer review
// ---------------------------------------------------------------------------

export const peerReviewSchema = z.object({
  score: z.number().min(0).optional(),
  feedback: z.string().max(10000).optional(),
  comments: z.record(z.string(), z.unknown()).optional(),
}).strict();

// ---------------------------------------------------------------------------
// Submission query (for list endpoint)
// ---------------------------------------------------------------------------

export const submissionQuerySchema = z.object({
  page: z.string().optional().transform((v) => (v ? Math.max(1, Number(v)) : 1)),
  limit: z.string().optional().transform((v) => {
    if (!v) return 20;
    return Math.min(100, Math.max(1, Number(v)));
  }),
  status: z.string().optional(), // SubmissionStatus enum
  gradingStatus: z.string().optional(),
  userId: z.string().min(1).optional(),
}).strict();

// ---------------------------------------------------------------------------
// Derived types
// ---------------------------------------------------------------------------

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
export type AssignmentQueryInput = z.infer<typeof assignmentQuerySchema>;
export type CreateRubricInput = z.infer<typeof createRubricSchema>;
export type UpdateRubricInput = z.infer<typeof updateRubricSchema>;
export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
export type UpdateSubmissionInput = z.infer<typeof updateSubmissionSchema>;
export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>;
export type RequestRevisionInput = z.infer<typeof requestRevisionSchema>;
export type SubmitRevisionInput = z.infer<typeof submitRevisionSchema>;
export type PeerReviewInput = z.infer<typeof peerReviewSchema>;
export type SubmissionQueryInput = z.infer<typeof submissionQuerySchema>;
