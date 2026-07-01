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
// ---------------------------------------------------------------------------

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB global cap
  fileFilter: (_req, file, cb) => {
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

// Rubric (public read)
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
// Admin/teacher-only routes (grading + peer-review assignment + analytics)
// Admins can grade and review but do NOT create assignments.
// ---------------------------------------------------------------------------

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

// Analytics — admin can view (oversight), teacher can view (own assignments)
router.get(
  '/:assignmentId/analytics',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  getAnalyticsController,
);

// ---------------------------------------------------------------------------
// TEACHER-only routes (assignment CRUD + rubric CRUD)
// Admins do NOT create assignments — they review them via /content/flagged.
// ---------------------------------------------------------------------------

router.post(
  '/',
  authenticate,
  authorize('TEACHER'),
  validate({ body: createAssignmentSchema }),
  createAssignmentController,
);
router.patch(
  '/:assignmentId',
  authenticate,
  authorize('TEACHER'),
  validate({ body: updateAssignmentSchema }),
  updateAssignmentController,
);
router.delete(
  '/:assignmentId',
  authenticate,
  authorize('TEACHER'),
  deleteAssignmentController,
);

// Rubric management (teacher only)
router.post(
  '/:assignmentId/rubric',
  authenticate,
  authorize('TEACHER'),
  validate({ body: createRubricSchema }),
  createRubricController,
);
router.patch(
  '/rubric/:rubricId',
  authenticate,
  authorize('TEACHER'),
  validate({ body: updateRubricSchema }),
  updateRubricController,
);
router.delete(
  '/rubric/:rubricId',
  authenticate,
  authorize('TEACHER'),
  deleteRubricController,
);

// Service error handler
router.use(assignmentErrorHandler);

export default router;
