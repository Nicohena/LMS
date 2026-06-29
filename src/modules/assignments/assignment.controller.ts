// src/modules/assignments/assignment.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import {
  createAssignment as createAssignmentService,
  getAssignment as getAssignmentService,
  getAssignments as getAssignmentsService,
  updateAssignment as updateAssignmentService,
  deleteAssignment as deleteAssignmentService,
  createRubric as createRubricService,
  getRubricForAssignment,
  updateRubric as updateRubricService,
  deleteRubric as deleteRubricService,
  getAssignmentAnalytics,
} from './assignment.service';
import {
  createSubmission as createSubmissionService,
  updateSubmission as updateSubmissionService,
  getSubmission as getSubmissionService,
  getSubmissions as getSubmissionsService,
  gradeSubmission as gradeSubmissionService,
  requestRevision as requestRevisionService,
  submitRevision as submitRevisionService,
  getGradeHistory as getGradeHistoryService,
} from './submission.service';
import {
  assignPeerReviews,
  getMyPeerReviews,
  getPeerReview,
  getReceivedPeerReviews,
  submitPeerReview,
} from './peer-review.service';
import { logAction } from '../../common/services/audit.service';
import { getClientIp, getUserAgent } from '../../common/services/upload.service';
import { isHttpError } from '../../common/errors';
import type { AssignmentFilters, SubmissionFilters } from './assignment.types';
import type { AssignmentQueryInput, SubmissionQueryInput } from './assignment.schemas';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toAssignmentFilters(query: AssignmentQueryInput): AssignmentFilters {
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

function toSubmissionFilters(query: SubmissionQueryInput): SubmissionFilters {
  return {
    page: query.page,
    limit: query.limit,
    status: query.status as any,
    gradingStatus: query.gradingStatus as any,
    userId: query.userId,
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
// Assignment CRUD
// ---------------------------------------------------------------------------

export async function createAssignmentController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;
    const role = req.user!.role;
    const assignment = await createAssignmentService(userId, role, req.body);

    await logAction({
      userId,
      action: 'ASSIGNMENT_CREATE',
      entityType: 'Assignment',
      entityId: assignment.id,
      details: { title: assignment.title, status: assignment.status },
      context: auditCtx(req),
    });

    res.status(201).json({ message: 'Assignment created.', assignment });
  } catch (err) {
    next(err);
  }
}

export async function getAssignmentController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req, 'assignmentId');
    const viewer = viewerFromReq(req);
    const assignment = await getAssignmentService(id, viewer);
    res.status(200).json({ assignment });
  } catch (err) {
    next(err);
  }
}

export async function getAssignmentsController(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = toAssignmentFilters(req.validated!.query as unknown as AssignmentQueryInput);
    const viewer = viewerFromReq(req);
    const result = await getAssignmentsService(filters, viewer);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateAssignmentController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req, 'assignmentId');
    const viewer = { id: req.user!.sub, role: req.user!.role };
    const assignment = await updateAssignmentService(id, viewer, req.body);

    await logAction({
      userId: viewer.id,
      action: 'ASSIGNMENT_UPDATE',
      entityType: 'Assignment',
      entityId: assignment.id,
      details: req.body,
      context: auditCtx(req),
    });

    res.status(200).json({ message: 'Assignment updated.', assignment });
  } catch (err) {
    next(err);
  }
}

export async function deleteAssignmentController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req, 'assignmentId');
    const viewer = { id: req.user!.sub, role: req.user!.role };
    const result = await deleteAssignmentService(id, viewer);

    await logAction({
      userId: viewer.id,
      action: 'ASSIGNMENT_ARCHIVE',
      entityType: 'Assignment',
      entityId: result.id,
      context: auditCtx(req),
    });

    res.status(200).json({ message: 'Assignment archived.', ...result });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Rubric
// ---------------------------------------------------------------------------

export async function createRubricController(req: Request, res: Response, next: NextFunction) {
  try {
    const assignmentId = paramId(req, 'assignmentId');
    const viewer = { id: req.user!.sub, role: req.user!.role };
    const rubric = await createRubricService(assignmentId, viewer, req.body);

    await logAction({
      userId: viewer.id,
      action: 'RUBRIC_CREATE',
      entityType: 'Rubric',
      entityId: rubric.id,
      details: { assignmentId, name: rubric.name },
      context: auditCtx(req),
    });

    res.status(201).json({ message: 'Rubric created.', rubric });
  } catch (err) {
    next(err);
  }
}

export async function getRubricController(req: Request, res: Response, next: NextFunction) {
  try {
    const assignmentId = paramId(req, 'assignmentId');
    const result = await getRubricForAssignment(assignmentId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateRubricController(req: Request, res: Response, next: NextFunction) {
  try {
    const rubricId = paramId(req, 'rubricId');
    const viewer = { id: req.user!.sub, role: req.user!.role };
    const rubric = await updateRubricService(rubricId, viewer, req.body);

    await logAction({
      userId: viewer.id,
      action: 'RUBRIC_UPDATE',
      entityType: 'Rubric',
      entityId: rubricId,
      details: req.body,
      context: auditCtx(req),
    });

    res.status(200).json({ message: 'Rubric updated.', rubric });
  } catch (err) {
    next(err);
  }
}

export async function deleteRubricController(req: Request, res: Response, next: NextFunction) {
  try {
    const rubricId = paramId(req, 'rubricId');
    const viewer = { id: req.user!.sub, role: req.user!.role };
    const result = await deleteRubricService(rubricId, viewer);

    await logAction({
      userId: viewer.id,
      action: 'RUBRIC_DELETE',
      entityType: 'Rubric',
      entityId: rubricId,
      context: auditCtx(req),
    });

    res.status(200).json({ message: 'Rubric deleted.', ...result });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Submissions
// ---------------------------------------------------------------------------

export async function createSubmissionController(req: Request, res: Response, next: NextFunction) {
  try {
    const assignmentId = paramId(req, 'assignmentId');
    const userId = req.user!.sub;
    const submission = await createSubmissionService(assignmentId, userId, req.body);

    await logAction({
      userId,
      action: 'SUBMISSION_CREATE',
      entityType: 'Submission',
      entityId: submission.id,
      details: { assignmentId, version: submission.version, status: submission.status },
      context: auditCtx(req),
    });

    res.status(201).json({ message: 'Submission created.', submission });
  } catch (err) {
    next(err);
  }
}

export async function updateSubmissionController(req: Request, res: Response, next: NextFunction) {
  try {
    const submissionId = paramId(req, 'submissionId');
    const userId = req.user!.sub;
    const submission = await updateSubmissionService(submissionId, userId, req.body);

    await logAction({
      userId,
      action: 'SUBMISSION_UPDATE',
      entityType: 'Submission',
      entityId: submission.id,
      context: auditCtx(req),
    });

    res.status(200).json({ message: 'Submission updated.', submission });
  } catch (err) {
    next(err);
  }
}

export async function getSubmissionController(req: Request, res: Response, next: NextFunction) {
  try {
    const submissionId = paramId(req, 'submissionId');
    const viewer = { id: req.user!.sub, role: req.user!.role };
    const submission = await getSubmissionService(submissionId, viewer);
    res.status(200).json({ submission });
  } catch (err) {
    next(err);
  }
}

export async function getSubmissionsController(req: Request, res: Response, next: NextFunction) {
  try {
    const assignmentId = paramId(req, 'assignmentId');
    const filters = toSubmissionFilters(req.validated!.query as unknown as SubmissionQueryInput);
    const viewer = { id: req.user!.sub, role: req.user!.role };
    const result = await getSubmissionsService(assignmentId, filters, viewer);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function gradeSubmissionController(req: Request, res: Response, next: NextFunction) {
  try {
    const submissionId = paramId(req, 'submissionId');
    const viewer = { id: req.user!.sub, role: req.user!.role };
    const submission = await gradeSubmissionService(submissionId, viewer, req.body);

    await logAction({
      userId: viewer.id,
      action: 'SUBMISSION_GRADE',
      entityType: 'Submission',
      entityId: submission.id,
      details: {
        grade: submission.grade,
        revisionRequested: submission.revisionRequested,
      },
      context: auditCtx(req),
    });

    res.status(200).json({ message: 'Submission graded.', submission });
  } catch (err) {
    next(err);
  }
}

export async function requestRevisionController(req: Request, res: Response, next: NextFunction) {
  try {
    const submissionId = paramId(req, 'submissionId');
    const viewer = { id: req.user!.sub, role: req.user!.role };
    const submission = await requestRevisionService(submissionId, viewer, req.body.comments);

    await logAction({
      userId: viewer.id,
      action: 'SUBMISSION_REVISION_REQUEST',
      entityType: 'Submission',
      entityId: submission.id,
      details: { comments: req.body.comments },
      context: auditCtx(req),
    });

    res.status(200).json({ message: 'Revision requested.', submission });
  } catch (err) {
    next(err);
  }
}

export async function submitRevisionController(req: Request, res: Response, next: NextFunction) {
  try {
    const submissionId = paramId(req, 'submissionId');
    const userId = req.user!.sub;
    const submission = await submitRevisionService(submissionId, userId, req.body);

    await logAction({
      userId,
      action: 'SUBMISSION_RESUBMIT',
      entityType: 'Submission',
      entityId: submission.id,
      details: { version: submission.version, originalSubmissionId: submissionId },
      context: auditCtx(req),
    });

    res.status(201).json({ message: 'Revision submitted.', submission });
  } catch (err) {
    next(err);
  }
}

export async function getGradeHistoryController(req: Request, res: Response, next: NextFunction) {
  try {
    const submissionId = paramId(req, 'submissionId');
    const viewer = { id: req.user!.sub, role: req.user!.role };
    const history = await getGradeHistoryService(submissionId, viewer);
    res.status(200).json({ history });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// File upload (multipart) — returns Cloudinary file metadata for the client
// to include in the subsequent createSubmission/submitRevision request.
// ---------------------------------------------------------------------------

export async function uploadSubmissionFileController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded. Use multipart/form-data with field "file".' });
      return;
    }
    // The multer-storage-cloudinary middleware uploads directly to Cloudinary
    // and populates req.file with { path: secure_url, public_id, ... }
    const file = req.file as any;
    res.status(200).json({
      message: 'File uploaded.',
      file: {
        public_id: file.public_id || file.filename,
        secure_url: file.path || file.secure_url || file.location,
        original_filename: file.originalname,
        size: file.size,
        format: file.format || file.originalname.split('.').pop()?.toLowerCase(),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Peer review
// ---------------------------------------------------------------------------

export async function assignPeerReviewsController(req: Request, res: Response, next: NextFunction) {
  try {
    const assignmentId = paramId(req, 'assignmentId');
    const viewer = { id: req.user!.sub, role: req.user!.role };
    const result = await assignPeerReviews(assignmentId, viewer);

    await logAction({
      userId: viewer.id,
      action: 'PEER_REVIEW_ASSIGN',
      entityType: 'Assignment',
      entityId: assignmentId,
      details: { assigned: result.assigned, skipped: result.skipped },
      context: auditCtx(req),
    });

    res.status(200).json({ message: 'Peer reviews assigned.', ...result });
  } catch (err) {
    next(err);
  }
}

export async function getMyPeerReviewsController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;
    const assignmentId = req.query.assignmentId as string | undefined;
    const reviews = await getMyPeerReviews(userId, assignmentId);
    res.status(200).json({ reviews });
  } catch (err) {
    next(err);
  }
}

export async function getPeerReviewController(req: Request, res: Response, next: NextFunction) {
  try {
    const reviewId = paramId(req, 'reviewId');
    const viewer = { id: req.user!.sub, role: req.user!.role };
    const review = await getPeerReview(reviewId, viewer);
    res.status(200).json({ review });
  } catch (err) {
    next(err);
  }
}

export async function submitPeerReviewController(req: Request, res: Response, next: NextFunction) {
  try {
    const reviewId = paramId(req, 'reviewId');
    const userId = req.user!.sub;
    const review = await submitPeerReview(reviewId, userId, req.body);

    await logAction({
      userId,
      action: 'PEER_REVIEW_SUBMIT',
      entityType: 'PeerReview',
      entityId: review.id,
      details: { score: review.score },
      context: auditCtx(req),
    });

    res.status(200).json({ message: 'Peer review submitted.', review });
  } catch (err) {
    next(err);
  }
}

export async function getReceivedPeerReviewsController(req: Request, res: Response, next: NextFunction) {
  try {
    const assignmentId = paramId(req, 'assignmentId');
    const userId = req.user!.sub;
    const reviews = await getReceivedPeerReviews(assignmentId, userId);
    res.status(200).json({ reviews });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export async function getAnalyticsController(req: Request, res: Response, next: NextFunction) {
  try {
    const assignmentId = paramId(req, 'assignmentId');
    const viewer = { id: req.user!.sub, role: req.user!.role };
    const analytics = await getAssignmentAnalytics(assignmentId, viewer);
    res.status(200).json({ analytics });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Service error handler
// ---------------------------------------------------------------------------

export function assignmentErrorHandler(
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
