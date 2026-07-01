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

// --- Self-Service: Student self-enrollment (must be before the role guard) ---
import { selfEnrollController } from './self-service.controller';
router.post('/:courseId/self-enroll', authenticate, selfEnrollController);

// Admin can review/override (read + override) but cannot create/manage courses.
// Teachers are the content creators.
import {
  publishCourseController,
  archiveCourseController,
  overrideCourseController,
  checkSlotLimitController,
} from './self-service.controller';

// Admin override (exception cases only) — registered before TEACHER guard
router.patch('/:id/override', authenticate, authorize('ADMIN'), overrideCourseController);

// All write operations (create/edit/delete course, modules, content) require TEACHER.
// Admins do NOT create courses — they review them via /content/flagged + /admin/*.
router.use(authenticate, authorize('TEACHER'));

// --- Course CRUD (TEACHER only) ---
router.post('/', validate({ body: createCourseSchema }), createCourseController);
router.patch('/:id', validate({ body: updateCourseSchema }), updateCourseController);
router.delete('/:id', deleteCourseController);

// Thumbnail upload (multipart/form-data)
router.post('/:id/thumbnail', uploadThumbnail, uploadThumbnailController);

// --- Reordering (registered BEFORE /:courseId/modules so /modules/reorder matches first) ---
router.post('/modules/reorder', validate({ body: reorderModulesSchema }), reorderModulesController);
router.post('/contents/reorder', validate({ body: reorderContentsSchema }), reorderContentsController);

// --- Module CRUD (TEACHER only) ---
router.post('/:courseId/modules', validate({ body: createModuleSchema }), addModuleController);
router.patch('/modules/:moduleId', validate({ body: updateModuleSchema }), updateModuleController);
router.delete('/modules/:moduleId', deleteModuleController);

// --- Content CRUD (TEACHER only) ---
router.post('/modules/:moduleId/contents', validate({ body: createContentSchema }), addContentController);
router.patch('/contents/:contentId', validate({ body: updateContentSchema }), updateContentController);
router.delete('/contents/:contentId', deleteContentController);

// --- Self-Service: Publish / Archive (TEACHER only) ---
// Teachers publish their own courses instantly (no admin approval)
router.patch('/:id/publish', publishCourseController);
// Teachers archive their own courses
router.patch('/:id/archive', archiveCourseController);
// Check teacher's course slot limit
router.get('/me/slot-limit', checkSlotLimitController);

// Service error handler
router.use(courseErrorHandler);

export default router;
