// src/modules/notifications/announcement.service.ts
import { Prisma, Role } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError, ForbiddenError, ValidationError } from '../../common/errors';
import { createNotification } from './notification.service';
import type { AnnouncementListResponse, AnnouncementResponse, UserSummary } from './notification.types';
import type { AnnouncementQueryInput, CreateAnnouncementInput, UpdateAnnouncementInput } from './notification.schemas';

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

function assertValidObjectId(id: string, what = 'Resource'): void {
  if (!OBJECT_ID_RE.test(id)) {
    throw new NotFoundError(`${what} not found`);
  }
}

function toUserSummary(u: { id: string; email: string; firstName: string; lastName: string; role: Role }): UserSummary {
  return { id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName, role: u.role };
}

async function assertCanManageCourse(courseId: string, viewer: { id: string; role: Role }): Promise<void> {
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true, createdBy: true } });
  if (!course) throw new NotFoundError('Course not found');
  if (viewer.role === 'ADMIN') return;
  if (viewer.role === 'TEACHER' && course.createdBy === viewer.id) return;
  throw new ForbiddenError('You can only manage announcements for courses you own');
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function createAnnouncement(
  creatorId: string,
  role: Role,
  data: CreateAnnouncementInput,
): Promise<AnnouncementResponse> {
  if (role !== 'ADMIN' && role !== 'TEACHER') {
    throw new ForbiddenError('Only admins and teachers can create announcements');
  }

  if (data.courseId) {
    await assertCanManageCourse(data.courseId, { id: creatorId, role });
  }

  // Validate scheduling
  if (data.scheduledAt && data.expiresAt && data.expiresAt <= data.scheduledAt) {
    throw new ValidationError('Expiry must be after the scheduled time');
  }

  const announcement = await prisma.announcement.create({
    data: {
      courseId: data.courseId,
      title: data.title,
      content: data.content,
      priority: data.priority,
      scheduledAt: data.scheduledAt,
      expiresAt: data.expiresAt,
      isActive: !data.scheduledAt || data.scheduledAt <= new Date(), // active immediately if not scheduled
      createdBy: creatorId,
    },
    include: {
      creator: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
    },
  });

  // If active, notify all enrolled students
  if (announcement.isActive && announcement.courseId) {
    await notifyEnrolledStudents(announcement.id, announcement.courseId, announcement.title, announcement.content);
  }

  return { ...announcement, creator: toUserSummary(announcement.creator as any), isRead: false };
}

export async function getAnnouncements(
  filters: AnnouncementQueryInput,
  viewer?: { id: string; role: Role },
): Promise<AnnouncementListResponse> {
  const where: Prisma.AnnouncementWhereInput = {};
  if (filters.courseId) where.courseId = filters.courseId;
  if (filters.priority) where.priority = filters.priority;
  if (filters.activeOnly) {
    where.isActive = true;
    where.OR = [
      { expiresAt: null },
      { expiresAt: { gt: new Date() } },
    ];
  }

  const skip = (filters.page - 1) * filters.limit;
  const take = filters.limit;

  const [rows, total] = await Promise.all([
    prisma.announcement.findMany({
      where,
      skip,
      take,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      include: {
        creator: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
      },
    }),
    prisma.announcement.count({ where }),
  ]);

  // Compute isRead for the viewer
  const viewerId = viewer?.id;
  const data: AnnouncementResponse[] = rows.map((a) => {
    const readReceipts = (a.readReceipts as unknown as string[]) ?? [];
    return {
      ...a,
      creator: toUserSummary(a.creator as any),
      isRead: viewerId ? readReceipts.includes(viewerId) : false,
    };
  });

  return {
    data,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  };
}

export async function updateAnnouncement(
  announcementId: string,
  viewer: { id: string; role: Role },
  data: UpdateAnnouncementInput,
): Promise<AnnouncementResponse> {
  assertValidObjectId(announcementId, 'Announcement');
  const announcement = await prisma.announcement.findUnique({
    where: { id: announcementId },
    include: { creator: { select: { id: true, email: true, firstName: true, lastName: true, role: true } } },
  });
  if (!announcement) throw new NotFoundError('Announcement not found');

  if (viewer.role !== 'ADMIN' && announcement.createdBy !== viewer.id) {
    throw new ForbiddenError('You can only update announcements you created');
  }

  const updated = await prisma.announcement.update({
    where: { id: announcementId },
    data,
    include: {
      creator: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
    },
  });

  const readReceipts = (updated.readReceipts as unknown as string[]) ?? [];
  return { ...updated, creator: toUserSummary(updated.creator as any), isRead: readReceipts.includes(viewer.id) };
}

export async function deleteAnnouncement(
  announcementId: string,
  viewer: { id: string; role: Role },
): Promise<{ id: string; deleted: boolean }> {
  assertValidObjectId(announcementId, 'Announcement');
  const announcement = await prisma.announcement.findUnique({ where: { id: announcementId }, select: { id: true, createdBy: true } });
  if (!announcement) throw new NotFoundError('Announcement not found');

  if (viewer.role !== 'ADMIN' && announcement.createdBy !== viewer.id) {
    throw new ForbiddenError('You can only delete announcements you created');
  }

  await prisma.announcement.delete({ where: { id: announcementId } });
  return { id: announcementId, deleted: true };
}

// ---------------------------------------------------------------------------
// Read receipts
// ---------------------------------------------------------------------------

export async function markAnnouncementRead(announcementId: string, userId: string): Promise<{ id: string; isRead: boolean }> {
  assertValidObjectId(announcementId, 'Announcement');
  const announcement = await prisma.announcement.findUnique({ where: { id: announcementId }, select: { id: true, readReceipts: true } });
  if (!announcement) throw new NotFoundError('Announcement not found');

  const readReceipts = (announcement.readReceipts as unknown as string[]) ?? [];
  if (readReceipts.includes(userId)) {
    return { id: announcementId, isRead: true };
  }

  await prisma.announcement.update({
    where: { id: announcementId },
    data: { readReceipts: [...readReceipts, userId] as any },
  });

  return { id: announcementId, isRead: true };
}

export async function getUnreadAnnouncements(
  userId: string,
  courseId?: string,
): Promise<{ count: number; ids: string[] }> {
  const where: Prisma.AnnouncementWhereInput = {
    isActive: true,
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
  };
  if (courseId) where.courseId = courseId;

  const announcements = await prisma.announcement.findMany({
    where,
    select: { id: true, readReceipts: true },
  });

  const unread = announcements.filter((a) => {
    const receipts = (a.readReceipts as unknown as string[]) ?? [];
    return !receipts.includes(userId);
  });

  return { count: unread.length, ids: unread.map((a) => a.id) };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function notifyEnrolledStudents(
  announcementId: string,
  courseId: string,
  title: string,
  content: string,
): Promise<void> {
  // Fetch all enrolled students for the course
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId, status: 'ACTIVE' },
    select: { userId: true },
  });

  // Create notifications in parallel (don't block the response)
  Promise.all(
    enrollments.map((e) =>
      createNotification({
        userId: e.userId,
        type: 'ANNOUNCEMENT',
        title: `Announcement: ${title}`,
        content: content.slice(0, 200) + (content.length > 200 ? '...' : ''),
        priority: 'HIGH',
        link: `/announcements/${announcementId}`,
        metadata: { announcementId, courseId },
        channels: ['IN_APP', 'EMAIL'],
      }).catch(() => null),
    ),
  ).catch(() => null);
}
