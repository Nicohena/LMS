// src/modules/courses/course.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import {
  createCourse as createCourseService,
  getCourses as getCoursesService,
  getCourseById as getCourseByIdService,
  updateCourse as updateCourseService,
  archiveCourse as archiveCourseService,
  addModule as addModuleService,
  updateModule as updateModuleService,
  deleteModule as deleteModuleService,
  reorderModules as reorderModulesService,
  addContent as addContentService,
  updateContent as updateContentService,
  deleteContent as deleteContentService,
  reorderContents as reorderContentsService,
  setCourseThumbnail,
} from './course.service';
import { uploadImage, getClientIp, getUserAgent } from '../../common/services/upload.service';
import { logAction } from '../../common/services/audit.service';
import { isHttpError } from '../../common/errors';
import type { CourseFilters } from './course.types';
import type { CourseQueryInput } from './course.schemas';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toCourseFilters(query: CourseQueryInput): CourseFilters {
  return {
    page: query.page,
    limit: query.limit,
    search: query.search,
    category: query.category,
    difficulty: query.difficulty,
    status: query.status,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
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
// Course CRUD
// ---------------------------------------------------------------------------

export async function createCourseController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;
    const course = await createCourseService(userId, req.body);

    await logAction({
      userId,
      action: 'COURSE_CREATE',
      entityType: 'Course',
      entityId: course.id,
      details: { title: course.title, status: course.status },
      context: auditCtx(req),
    });

    res.status(201).json({ message: 'Course created.', course });
  } catch (err) {
    next(err);
  }
}

export async function getCoursesController(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = toCourseFilters(req.validated!.query as unknown as CourseQueryInput);
    const viewer = viewerFromReq(req);
    const result = await getCoursesService(filters, viewer);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getCourseController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req, 'id');
    const viewer = viewerFromReq(req);
    const course = await getCourseByIdService(id, viewer);
    res.status(200).json({ course });
  } catch (err) {
    next(err);
  }
}

export async function updateCourseController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req, 'id');
    const userId = req.user!.sub;
    const role = req.user!.role;
    const course = await updateCourseService(id, userId, role, req.body);

    await logAction({
      userId,
      action: 'COURSE_UPDATE',
      entityType: 'Course',
      entityId: course.id,
      details: req.body,
      context: auditCtx(req),
    });

    res.status(200).json({ message: 'Course updated.', course });
  } catch (err) {
    next(err);
  }
}

export async function deleteCourseController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req, 'id');
    const userId = req.user!.sub;
    const role = req.user!.role;
    const result = await archiveCourseService(id, userId, role);

    await logAction({
      userId,
      action: 'COURSE_ARCHIVE',
      entityType: 'Course',
      entityId: result.id,
      context: auditCtx(req),
    });

    res.status(200).json({ message: 'Course archived (soft delete).', ...result });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Modules
// ---------------------------------------------------------------------------

export async function addModuleController(req: Request, res: Response, next: NextFunction) {
  try {
    const courseId = paramId(req, 'courseId');
    const userId = req.user!.sub;
    const role = req.user!.role;
    const module = await addModuleService(courseId, userId, role, req.body);

    await logAction({
      userId,
      action: 'MODULE_CREATE',
      entityType: 'Module',
      entityId: module.id,
      details: { courseId, title: module.title },
      context: auditCtx(req),
    });

    res.status(201).json({ message: 'Module added.', module });
  } catch (err) {
    next(err);
  }
}

export async function updateModuleController(req: Request, res: Response, next: NextFunction) {
  try {
    const moduleId = paramId(req, 'moduleId');
    const userId = req.user!.sub;
    const role = req.user!.role;
    const module = await updateModuleService(moduleId, userId, role, req.body);

    await logAction({
      userId,
      action: 'MODULE_UPDATE',
      entityType: 'Module',
      entityId: module.id,
      details: req.body,
      context: auditCtx(req),
    });

    res.status(200).json({ message: 'Module updated.', module });
  } catch (err) {
    next(err);
  }
}

export async function deleteModuleController(req: Request, res: Response, next: NextFunction) {
  try {
    const moduleId = paramId(req, 'moduleId');
    const userId = req.user!.sub;
    const role = req.user!.role;
    const result = await deleteModuleService(moduleId, userId, role);

    await logAction({
      userId,
      action: 'MODULE_DELETE',
      entityType: 'Module',
      entityId: result.id,
      context: auditCtx(req),
    });

    res.status(200).json({ message: 'Module deleted.', ...result });
  } catch (err) {
    next(err);
  }
}

export async function reorderModulesController(req: Request, res: Response, next: NextFunction) {
  try {
    const { courseId, moduleIds } = req.body;
    const userId = req.user!.sub;
    const role = req.user!.role;
    const result = await reorderModulesService(courseId, moduleIds, userId, role);

    await logAction({
      userId,
      action: 'MODULE_REORDER',
      entityType: 'Course',
      entityId: courseId,
      details: { moduleIds },
      context: auditCtx(req),
    });

    res.status(200).json({ message: 'Modules reordered.', ...result });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

export async function addContentController(req: Request, res: Response, next: NextFunction) {
  try {
    const moduleId = paramId(req, 'moduleId');
    const userId = req.user!.sub;
    const role = req.user!.role;
    const content = await addContentService(moduleId, userId, role, req.body);

    await logAction({
      userId,
      action: 'CONTENT_CREATE',
      entityType: 'Content',
      entityId: content.id,
      details: { moduleId, type: content.type, title: content.title },
      context: auditCtx(req),
    });

    // Fire-and-forget: run background moderation (virus scan, quality, plagiarism)
    import('./moderation.service').then(({ moderateContent }) => {
      moderateContent(content.id).catch((err) => {
        // eslint-disable-next-line no-console
        console.warn(`[moderation] Background moderation failed for ${content.id}:`, (err as Error).message);
      });
    }).catch(() => {});

    res.status(201).json({ message: 'Content added.', content });
  } catch (err) {
    next(err);
  }
}

export async function updateContentController(req: Request, res: Response, next: NextFunction) {
  try {
    const contentId = paramId(req, 'contentId');
    const userId = req.user!.sub;
    const role = req.user!.role;
    const content = await updateContentService(contentId, userId, role, req.body);

    await logAction({
      userId,
      action: 'CONTENT_UPDATE',
      entityType: 'Content',
      entityId: content.id,
      details: req.body,
      context: auditCtx(req),
    });

    res.status(200).json({ message: 'Content updated.', content });
  } catch (err) {
    next(err);
  }
}

export async function deleteContentController(req: Request, res: Response, next: NextFunction) {
  try {
    const contentId = paramId(req, 'contentId');
    const userId = req.user!.sub;
    const role = req.user!.role;
    const result = await deleteContentService(contentId, userId, role);

    await logAction({
      userId,
      action: 'CONTENT_DELETE',
      entityType: 'Content',
      entityId: result.id,
      context: auditCtx(req),
    });

    res.status(200).json({ message: 'Content deleted.', ...result });
  } catch (err) {
    next(err);
  }
}

export async function reorderContentsController(req: Request, res: Response, next: NextFunction) {
  try {
    const { moduleId, contentIds } = req.body;
    const userId = req.user!.sub;
    const role = req.user!.role;
    const result = await reorderContentsService(moduleId, contentIds, userId, role);

    await logAction({
      userId,
      action: 'CONTENT_REORDER',
      entityType: 'Module',
      entityId: moduleId,
      details: { contentIds },
      context: auditCtx(req),
    });

    res.status(200).json({ message: 'Contents reordered.', ...result });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Thumbnail upload (multipart/form-data)
// ---------------------------------------------------------------------------

export async function uploadThumbnailController(req: Request, res: Response, next: NextFunction) {
  try {
    const courseId = paramId(req, 'id');
    const userId = req.user!.sub;
    const role = req.user!.role;

    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded. Use multipart/form-data with field "thumbnail".' });
      return;
    }

    const thumbnailUrl = await uploadImage(req.file, {
      folder: `lms/courses/${courseId}/thumbnails`,
    });

    const course = await setCourseThumbnail(courseId, userId, role, thumbnailUrl);

    await logAction({
      userId,
      action: 'THUMBNAIL_UPLOAD',
      entityType: 'Course',
      entityId: courseId,
      details: { thumbnailUrl },
      context: auditCtx(req),
    });

    res.status(200).json({ message: 'Thumbnail uploaded.', course });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Course-module error handler — converts service errors to HTTP responses
// ---------------------------------------------------------------------------

export function courseErrorHandler(
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
