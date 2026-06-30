// src/modules/courses/course.routes.ts
import { Router } from 'express';
import { authenticate, optionalAuth } from '../../common/middlewares/auth.middleware';
import { authorize } from '../../common/middlewares/rbac.middleware';
import { validate } from '../../common/middlewares/validation.middleware';
import { uploadThumbnail } from '../../common/services/upload.service';
import {
  createCourseController,
  getCoursesController,
  getCourseController,
  updateCourseController,
  deleteCourseController,
  addModuleController,
  updateModuleController,
  deleteModuleController,
  reorderModulesController,
  addContentController,
  updateContentController,
  deleteContentController,
  reorderContentsController,
  uploadThumbnailController,
  courseErrorHandler,
} from './course.controller';
import {
  createCourseSchema,
  updateCourseSchema,
  courseQuerySchema,
  createModuleSchema,
  updateModuleSchema,
  reorderModulesSchema,
  createContentSchema,
  updateContentSchema,
  reorderContentsSchema,
} from './course.schemas';

const router = Router();

// Anyone (even anonymous) can list and view published courses.
// `optionalAuth` attaches req.user if a valid token is present, so the
// service can show DRAFT courses to admins/teachers/owners.
router.get('/', optionalAuth, validate({ query: courseQuerySchema }), getCoursesController);
router.get('/:id', optionalAuth, getCourseController);

// --- Self-Service: Student self-enrollment (must be before the ADMIN/TEACHER guard) ---
import { selfEnrollController } from './self-service.controller';
router.post('/:courseId/self-enroll', authenticate, selfEnrollController);

// All write operations require authentication + ADMIN or TEACHER role.
router.use(authenticate, authorize('ADMIN', 'TEACHER'));

// --- Course CRUD ---
router.post('/', validate({ body: createCourseSchema }), createCourseController);
router.patch('/:id', validate({ body: updateCourseSchema }), updateCourseController);
router.delete('/:id', deleteCourseController);

// Thumbnail upload (multipart/form-data)
router.post('/:id/thumbnail', uploadThumbnail, uploadThumbnailController);

// --- Reordering (registered BEFORE /:courseId/modules so /modules/reorder matches first) ---
router.post('/modules/reorder', validate({ body: reorderModulesSchema }), reorderModulesController);
router.post('/contents/reorder', validate({ body: reorderContentsSchema }), reorderContentsController);

// --- Module CRUD ---
router.post('/:courseId/modules', validate({ body: createModuleSchema }), addModuleController);
router.patch('/modules/:moduleId', validate({ body: updateModuleSchema }), updateModuleController);
router.delete('/modules/:moduleId', deleteModuleController);

// --- Content CRUD ---
router.post('/modules/:moduleId/contents', validate({ body: createContentSchema }), addContentController);
router.patch('/contents/:contentId', validate({ body: updateContentSchema }), updateContentController);
router.delete('/contents/:contentId', deleteContentController);

// --- Self-Service: Publish / Archive / Override (Phase 1) ---
import {
  publishCourseController,
  archiveCourseController,
  overrideCourseController,
  checkSlotLimitController,
} from './self-service.controller';

// Teachers publish their own courses instantly (no admin approval)
router.patch('/:id/publish', publishCourseController);
// Teachers archive their own courses
router.patch('/:id/archive', archiveCourseController);
// Admin override (exception cases only)
router.patch('/:id/override', authorize('ADMIN'), overrideCourseController);
// Check teacher's course slot limit
router.get('/me/slot-limit', checkSlotLimitController);

// Service error handler
router.use(courseErrorHandler);

export default router;
