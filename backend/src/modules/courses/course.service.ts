// src/modules/courses/course.service.ts
import { Prisma, Role } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError, ForbiddenError } from '../../common/errors';
import type {
  ContentResponse,
  CourseDetailResponse,
  CourseFilters,
  CourseListResponse,
  CourseResponse,
  CreatorSummary,
  ModuleResponse,
} from './course.types';
import type {
  CreateContentInput,
  CreateCourseInput,
  CreateModuleInput,
  UpdateContentInput,
  UpdateCourseInput,
  UpdateModuleInput,
} from './course.schemas';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

function assertValidObjectId(id: string, what = 'Resource'): void {
  if (!OBJECT_ID_RE.test(id)) {
    throw new NotFoundError(`${what} not found`);
  }
}

function toCreatorSummary(u: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
}): CreatorSummary {
  return {
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    role: u.role,
  };
}

function toCourseResponse(
  course: {
    id: string;
    title: string;
    description: string | null;
    thumbnail: string | null;
    category: string | null;
    tags: string[];
    duration: number | null;
    difficulty: any;
    language: string;
    status: any;
    createdBy: string;
    academicYearId: string | null;
    qualityScore?: number | null;
    qualityFlags?: string[];
    createdAt: Date;
    updatedAt: Date;
    creator: { id: string; firstName: string; lastName: string; email: string; role: Role };
    _count?: { modules: number };
  },
  moduleCount?: number,
): CourseResponse {
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    thumbnail: course.thumbnail,
    category: course.category,
    tags: course.tags,
    duration: course.duration,
    difficulty: course.difficulty,
    language: course.language,
    status: course.status,
    academicYearId: course.academicYearId,
    qualityScore: course.qualityScore ?? 0,
    qualityFlags: course.qualityFlags ?? [],
    // Replace the raw createdBy string with the populated creator summary.
    createdBy: toCreatorSummary(course.creator),
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
    moduleCount: moduleCount ?? course._count?.modules ?? 0,
  };
}

function buildCourseWhere(
  filters: CourseFilters,
  viewer?: { id: string; role: Role },
): Prisma.CourseWhereInput {
  const where: Prisma.CourseWhereInput = {};

  // Visibility:
  // - ADMIN: sees all courses (any status, any owner)
  // - TEACHER: sees all PUBLISHED + their own DRAFT/ARCHIVED courses
  // - STUDENT / anonymous: only PUBLISHED
  const isAdmin = viewer && viewer.role === 'ADMIN';
  const isTeacher = viewer && viewer.role === 'TEACHER';

  if (filters.status) {
    where.status = filters.status;
    // If a teacher filters by status, also scope to their own + PUBLISHED
    // (so they don't see other teachers' DRAFTs).
    if (isTeacher) {
      where.OR = [{ status: 'PUBLISHED' }, { createdBy: viewer!.id }];
    }
  } else if (isAdmin) {
    // No filter — admin sees everything.
  } else if (isTeacher) {
    where.OR = [{ status: 'PUBLISHED' }, { createdBy: viewer!.id }];
  } else {
    where.status = 'PUBLISHED';
  }

  if (filters.category) {
    where.category = { equals: filters.category, mode: 'insensitive' };
  }

  if (filters.difficulty) {
    where.difficulty = filters.difficulty;
  }

  if (filters.search) {
    const s = filters.search;
    where.AND = [
      ...(where.AND ? (Array.isArray(where.AND) ? where.AND : [where.AND]) : []),
      {
        OR: [
          { title: { contains: s, mode: 'insensitive' } },
          { description: { contains: s, mode: 'insensitive' } },
        ],
      },
    ];
  }

  return where;
}

/**
 * Ensure the viewer can manage the given course:
 * - ADMIN: always
 * - TEACHER: only their own courses
 * - anyone else: ForbiddenError
 */
async function assertCanManageCourse(
  courseId: string,
  viewer: { id: string; role: Role },
): Promise<{ id: string; createdBy: string; title: string; status: any }> {
  assertValidObjectId(courseId, 'Course');
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, createdBy: true, title: true, status: true },
  });
  if (!course) {
    throw new NotFoundError('Course not found');
  }
  if (viewer.role === 'ADMIN') return course;
  if (viewer.role === 'TEACHER' && course.createdBy === viewer.id) return course;
  throw new ForbiddenError('You can only manage courses you own');
}

async function assertCanManageModule(
  moduleId: string,
  viewer: { id: string; role: Role },
): Promise<{ id: string; courseId: string; title: string }> {
  assertValidObjectId(moduleId, 'Module');
  const module = await prisma.module.findUnique({
    where: { id: moduleId },
    select: { id: true, courseId: true, title: true, course: { select: { createdBy: true } } },
  });
  if (!module) {
    throw new NotFoundError('Module not found');
  }
  if (viewer.role === 'ADMIN') return { id: module.id, courseId: module.courseId, title: module.title };
  if (viewer.role === 'TEACHER' && module.course.createdBy === viewer.id) {
    return { id: module.id, courseId: module.courseId, title: module.title };
  }
  throw new ForbiddenError('You can only manage modules in courses you own');
}

async function assertCanManageContent(
  contentId: string,
  viewer: { id: string; role: Role },
): Promise<{ id: string; moduleId: string; title: string }> {
  assertValidObjectId(contentId, 'Content');
  const content = await prisma.content.findUnique({
    where: { id: contentId },
    select: {
      id: true,
      moduleId: true,
      title: true,
      module: { select: { course: { select: { createdBy: true } } } },
    },
  });
  if (!content) {
    throw new NotFoundError('Content not found');
  }
  if (viewer.role === 'ADMIN') return { id: content.id, moduleId: content.moduleId, title: content.title };
  if (viewer.role === 'TEACHER' && content.module.course.createdBy === viewer.id) {
    return { id: content.id, moduleId: content.moduleId, title: content.title };
  }
  throw new ForbiddenError('You can only manage content in courses you own');
}

// ---------------------------------------------------------------------------
// Course CRUD
// ---------------------------------------------------------------------------

export async function createCourse(
  userId: string,
  data: CreateCourseInput,
): Promise<CourseResponse> {
  const course = await prisma.course.create({
    data: {
      title: data.title,
      description: data.description,
      thumbnail: data.thumbnail,
      category: data.category,
      tags: data.tags,
      duration: data.duration,
      difficulty: data.difficulty,
      language: data.language,
      status: data.status,
      createdBy: userId,
    },
    include: { creator: { select: { id: true, firstName: true, lastName: true, email: true, role: true } } },
  });

  return toCourseResponse({ ...course, _count: { modules: 0 } }, 0);
}

export async function getCourses(
  filters: CourseFilters,
  viewer?: { id: string; role: Role },
): Promise<CourseListResponse> {
  const where = buildCourseWhere(filters, viewer);
  const skip = (filters.page - 1) * filters.limit;
  const take = filters.limit;

  const [rows, total] = await Promise.all([
    prisma.course.findMany({
      where,
      skip,
      take,
      orderBy: { [filters.sortBy]: filters.sortOrder },
      include: {
        creator: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        _count: { select: { modules: true } },
      },
    }),
    prisma.course.count({ where }),
  ]);

  return {
    data: rows.map((c) => toCourseResponse(c)),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  };
}

export async function getCourseById(
  id: string,
  viewer?: { id: string; role: Role },
): Promise<CourseDetailResponse> {
  assertValidObjectId(id, 'Course');
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
      modules: {
        orderBy: { order: 'asc' },
        include: {
          contents: { orderBy: { order: 'asc' } },
          _count: { select: { contents: true } },
        },
      },
      _count: { select: { modules: true } },
    },
  });

  if (!course) {
    throw new NotFoundError('Course not found');
  }

  // Visibility check: anonymous / STUDENT can only see PUBLISHED
  const isAuthor = viewer && (viewer.role === 'ADMIN' || viewer.role === 'TEACHER');
  const isOwner = viewer && course.createdBy === viewer.id;
  if (!isAuthor && course.status !== 'PUBLISHED' && !isOwner) {
    throw new NotFoundError('Course not found');
  }

  const { _count, ...rest } = course;
  return {
    ...toCourseResponse(rest, _count.modules),
    modules: course.modules.map((m) => {
      const { _count: mCount, ...mRest } = m;
      return {
        ...mRest,
        contentCount: mCount.contents,
        contents: m.contents,
      };
    }),
  };
}

export async function updateCourse(
  id: string,
  userId: string,
  role: Role,
  data: UpdateCourseInput,
): Promise<CourseResponse> {
  await assertCanManageCourse(id, { id: userId, role });

  const updated = await prisma.course.update({
    where: { id },
    data,
    include: {
      creator: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
      _count: { select: { modules: true } },
    },
  });

  return toCourseResponse(updated);
}

export async function archiveCourse(
  id: string,
  userId: string,
  role: Role,
): Promise<{ id: string; status: string }> {
  await assertCanManageCourse(id, { id: userId, role });

  const updated = await prisma.course.update({
    where: { id },
    data: { status: 'ARCHIVED' },
    select: { id: true, status: true },
  });

  return { id: updated.id, status: updated.status };
}

// ---------------------------------------------------------------------------
// Modules
// ---------------------------------------------------------------------------

export async function addModule(
  courseId: string,
  userId: string,
  role: Role,
  data: CreateModuleInput,
): Promise<ModuleResponse> {
  await assertCanManageCourse(courseId, { id: userId, role });

  // Auto-append: if no order provided, use max+1
  let order = data.order;
  if (order === undefined) {
    const max = await prisma.module.aggregate({
      where: { courseId },
      _max: { order: true },
    });
    order = (max._max.order ?? -1) + 1;
  }

  const module = await prisma.module.create({
    data: {
      courseId,
      title: data.title,
      description: data.description,
      order,
    },
    include: { _count: { select: { contents: true } } },
  });

  const { _count, ...rest } = module;
  return { ...rest, contentCount: _count.contents };
}

export async function updateModule(
  moduleId: string,
  userId: string,
  role: Role,
  data: UpdateModuleInput,
): Promise<ModuleResponse> {
  const { id } = await assertCanManageModule(moduleId, { id: userId, role });

  const updated = await prisma.module.update({
    where: { id },
    data,
    include: { _count: { select: { contents: true } } },
  });

  const { _count, ...rest } = updated;
  return { ...rest, contentCount: _count.contents };
}

export async function deleteModule(
  moduleId: string,
  userId: string,
  role: Role,
): Promise<{ id: string; deleted: boolean }> {
  const { id, courseId } = await assertCanManageModule(moduleId, { id: userId, role });

  // Delete the module's contents first (MongoDB Prisma doesn't auto-cascade)
  await prisma.content.deleteMany({ where: { moduleId: id } });
  await prisma.module.delete({ where: { id } });

  // Reorder remaining modules in the same course to keep sequence contiguous
  const remaining = await prisma.module.findMany({
    where: { courseId },
    orderBy: { order: 'asc' },
    select: { id: true },
  });
  await Promise.all(
    remaining.map((m, idx) =>
      prisma.module.update({ where: { id: m.id }, data: { order: idx } }),
    ),
  );

  return { id, deleted: true };
}

export async function reorderModules(
  courseId: string,
  moduleIds: string[],
  userId: string,
  role: Role,
): Promise<{ reordered: number }> {
  await assertCanManageCourse(courseId, { id: userId, role });

  // Verify all moduleIds belong to this course
  const modules = await prisma.module.findMany({
    where: { courseId },
    select: { id: true },
  });
  const courseModuleIds = new Set(modules.map((m) => m.id));
  for (const id of moduleIds) {
    if (!courseModuleIds.has(id)) {
      throw new NotFoundError(`Module ${id} does not belong to course ${courseId}`);
    }
  }
  if (moduleIds.length !== modules.length) {
    throw new ForbiddenError(
      `Must provide all module IDs for the course (got ${moduleIds.length}, expected ${modules.length})`,
    );
  }

  await Promise.all(
    moduleIds.map((id, idx) =>
      prisma.module.update({ where: { id }, data: { order: idx } }),
    ),
  );

  return { reordered: moduleIds.length };
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

export async function addContent(
  moduleId: string,
  userId: string,
  role: Role,
  data: CreateContentInput,
): Promise<ContentResponse> {
  await assertCanManageModule(moduleId, { id: userId, role });

  // Auto-append order
  let order = data.order;
  if (order === undefined) {
    const max = await prisma.content.aggregate({
      where: { moduleId },
      _max: { order: true },
    });
    order = (max._max.order ?? -1) + 1;
  }

  return prisma.content.create({
    data: {
      moduleId,
      type: data.type,
      title: data.title,
      description: data.description,
      contentJson: data.contentJson as Prisma.InputJsonValue | undefined,
      videoUrl: data.videoUrl,
      fileUrl: data.fileUrl,
      externalUrl: data.externalUrl,
      duration: data.duration,
      order,
      isPublished: data.isPublished ?? true,
    },
  });
}

export async function updateContent(
  contentId: string,
  userId: string,
  role: Role,
  data: UpdateContentInput,
): Promise<ContentResponse> {
  const { id } = await assertCanManageContent(contentId, { id: userId, role });

  // Handle nullable URL fields (so users can clear them by sending null)
  const updateData: Prisma.ContentUpdateInput = {};
  if (data.type !== undefined) updateData.type = data.type;
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.contentJson !== undefined) updateData.contentJson = data.contentJson as Prisma.InputJsonValue;
  if (data.videoUrl !== undefined) updateData.videoUrl = data.videoUrl ?? null;
  if (data.fileUrl !== undefined) updateData.fileUrl = data.fileUrl ?? null;
  if (data.externalUrl !== undefined) updateData.externalUrl = data.externalUrl ?? null;
  if (data.duration !== undefined) updateData.duration = data.duration;
  if (data.order !== undefined) updateData.order = data.order;
  if (data.isPublished !== undefined) updateData.isPublished = data.isPublished;

  return prisma.content.update({ where: { id }, data: updateData });
}

export async function deleteContent(
  contentId: string,
  userId: string,
  role: Role,
): Promise<{ id: string; deleted: boolean }> {
  const { id, moduleId } = await assertCanManageContent(contentId, { id: userId, role });

  await prisma.content.delete({ where: { id } });

  // Reorder remaining content in the same module
  const remaining = await prisma.content.findMany({
    where: { moduleId },
    orderBy: { order: 'asc' },
    select: { id: true },
  });
  await Promise.all(
    remaining.map((c, idx) =>
      prisma.content.update({ where: { id: c.id }, data: { order: idx } }),
    ),
  );

  return { id, deleted: true };
}

export async function reorderContents(
  moduleId: string,
  contentIds: string[],
  userId: string,
  role: Role,
): Promise<{ reordered: number }> {
  await assertCanManageModule(moduleId, { id: userId, role });

  // Verify all contentIds belong to this module
  const contents = await prisma.content.findMany({
    where: { moduleId },
    select: { id: true },
  });
  const moduleContentIds = new Set(contents.map((c) => c.id));
  for (const id of contentIds) {
    if (!moduleContentIds.has(id)) {
      throw new NotFoundError(`Content ${id} does not belong to module ${moduleId}`);
    }
  }
  if (contentIds.length !== contents.length) {
    throw new ForbiddenError(
      `Must provide all content IDs for the module (got ${contentIds.length}, expected ${contents.length})`,
    );
  }

  await Promise.all(
    contentIds.map((id, idx) =>
      prisma.content.update({ where: { id }, data: { order: idx } }),
    ),
  );

  return { reordered: contentIds.length };
}

// ---------------------------------------------------------------------------
// Thumbnail URL setter (called by controller after Cloudinary upload)
// ---------------------------------------------------------------------------

export async function setCourseThumbnail(
  courseId: string,
  userId: string,
  role: Role,
  thumbnailUrl: string,
): Promise<CourseResponse> {
  await assertCanManageCourse(courseId, { id: userId, role });

  const updated = await prisma.course.update({
    where: { id: courseId },
    data: { thumbnail: thumbnailUrl },
    include: {
      creator: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
      _count: { select: { modules: true } },
    },
  });

  return toCourseResponse(updated);
}
