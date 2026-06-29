// src/modules/assignments/assignment.routes.ts
import { Router } from 'express';
import multer from 'multer';
import { authenticate, optionalAuth } from '../../common/middlewares/auth.middleware';
import { authorize } from '../../common/middlewares/rbac.middleware';
import { validate } from '../../common/middlewares/validation.middleware';
import {
  uploadImage,
  uploadFile,
  isCloudinaryConfigured,
} from '../../common/services/upload.service';
import { ServiceUnavailableError } from '../../common/errors';
import {
  createAssignmentController,
  getAssignmentController,
  getAssignmentsController,
  updateAssignmentController,
  deleteAssignmentController,
  createRubricController,
  getRubricController,
  updateRubricController,
  deleteRubricController,
  createSubmissionController,
  updateSubmissionController,
  getSubmissionController,
  getSubmissionsController,
  gradeSubmissionController,
  requestRevisionController,
  submitRevisionController,
  getGradeHistoryController,
  uploadSubmissionFileController,
  assignPeerReviewsController,
  getMyPeerReviewsController,
  getPeerReviewController,
  submitPeerReviewController,
  getReceivedPeerReviewsController,
  getAnalyticsController,
  assignmentErrorHandler,
} from './assignment.controller';
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  assignmentQuerySchema,
  createRubricSchema,
  updateRubricSchema,
  createSubmissionSchema,
  updateSubmissionSchema,
  gradeSubmissionSchema,
  requestRevisionSchema,
  submitRevisionSchema,
  peerReviewSchema,
  submissionQuerySchema,
} from './assignment.schemas';

const router = Router();

// ---------------------------------------------------------------------------
// Multer config for assignment file uploads.
// Files are kept in memory (small enough for assignment submissions capped
// at the assignment's maxFileSizeMB) and uploaded to Cloudinary in the
// controller, which returns the { public_id, secure_url, ... } metadata
// for the client to include in the subsequent createSubmission/submitRevision
// request body.
// ---------------------------------------------------------------------------

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB global cap (per-assignment cap enforced in service)
  fileFilter: (_req, file, cb) => {
    // Accept a broad set of formats — per-assignment allowedFileTypes is
    // enforced in the submission service when the submission is created.
    const ok = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip',
      'application/x-zip-compressed',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'video/mp4',
    ].includes(file.mimetype);
    if (ok) cb(null, true);
    else cb(new Error(`Unsupported file type: ${file.mimetype}`));
  },
});

// ---------------------------------------------------------------------------
// Public / optional-auth routes
// ---------------------------------------------------------------------------

router.get('/', optionalAuth, validate({ query: assignmentQuerySchema }), getAssignmentsController);
router.get('/:assignmentId', optionalAuth, getAssignmentController);

// Rubric (public read, admin/teacher write)
router.get('/:assignmentId/rubric', optionalAuth, getRubricController);

// ---------------------------------------------------------------------------
// Authenticated routes (any logged-in user)
// ---------------------------------------------------------------------------

// File upload — any authenticated user (Cloudinary upload, returns metadata)
router.post(
  '/upload',
  authenticate,
  upload.single('file'),
  async (req, res, next) => {
    try {
      if (!isCloudinaryConfigured()) {
        throw new ServiceUnavailableError(
          'File uploads are not configured. Set CLOUDINARY_* env vars.',
        );
      }
      if (!req.file) {
        res.status(400).json({ message: 'No file uploaded.' });
        return;
      }
      // Upload to Cloudinary under lms/assignments folder
      const secure_url = await uploadFile(req.file, {
        folder: 'lms/assignments',
        resourceType: req.file.mimetype.startsWith('image/') ? 'image'
          : req.file.mimetype.startsWith('video/') ? 'video'
          : 'raw',
      });
      res.status(200).json({
        message: 'File uploaded.',
        file: {
          public_id: secure_url.split('/').slice(-2).join('/').replace(/\.[^.]+$/, ''),
          secure_url,
          original_filename: req.file.originalname,
          size: req.file.size,
          format: req.file.originalname.split('.').pop()?.toLowerCase(),
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// Submissions — students can submit, view their own, etc.
router.post(
  '/:assignmentId/submissions',
  authenticate,
  validate({ body: createSubmissionSchema }),
  createSubmissionController,
);
router.patch(
  '/submissions/:submissionId',
  authenticate,
  validate({ body: updateSubmissionSchema }),
  updateSubmissionController,
);
router.get('/submissions/:submissionId', authenticate, getSubmissionController);
router.get(
  '/:assignmentId/submissions',
  authenticate,
  validate({ query: submissionQuerySchema }),
  getSubmissionsController,
);
router.patch(
  '/submissions/:submissionId/revision',
  authenticate,
  validate({ body: submitRevisionSchema }),
  submitRevisionController,
);
router.get('/submissions/:submissionId/history', authenticate, getGradeHistoryController);

// Peer review — student routes
router.get('/peer-reviews/my', authenticate, getMyPeerReviewsController);
router.patch(
  '/peer-reviews/:reviewId',
  authenticate,
  validate({ body: peerReviewSchema }),
  submitPeerReviewController,
);
router.get('/peer-reviews/:reviewId', authenticate, getPeerReviewController);
router.get('/:assignmentId/peer-reviews/my-received', authenticate, getReceivedPeerReviewsController);

// ---------------------------------------------------------------------------
// Admin/teacher-only routes
// ---------------------------------------------------------------------------

router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  validate({ body: createAssignmentSchema }),
  createAssignmentController,
);
router.patch(
  '/:assignmentId',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  validate({ body: updateAssignmentSchema }),
  updateAssignmentController,
);
router.delete(
  '/:assignmentId',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  deleteAssignmentController,
);

// Rubric management (admin/teacher)
router.post(
  '/:assignmentId/rubric',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  validate({ body: createRubricSchema }),
  createRubricController,
);
router.patch(
  '/rubric/:rubricId',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  validate({ body: updateRubricSchema }),
  updateRubricController,
);
router.delete(
  '/rubric/:rubricId',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  deleteRubricController,
);

// Grading + revision request (admin/teacher)
router.post(
  '/submissions/:submissionId/grade',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  validate({ body: gradeSubmissionSchema }),
  gradeSubmissionController,
);
router.post(
  '/submissions/:submissionId/revision',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  validate({ body: requestRevisionSchema }),
  requestRevisionController,
);

// Peer review assignment (admin/teacher)
router.post(
  '/:assignmentId/peer-reviews/assign',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  assignPeerReviewsController,
);

// Analytics (admin/teacher)
router.get(
  '/:assignmentId/analytics',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  getAnalyticsController,
);

// Service error handler
router.use(assignmentErrorHandler);

export default router;
