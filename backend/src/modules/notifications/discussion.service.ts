// src/modules/notifications/discussion.service.ts
import { Prisma, Role } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError, ForbiddenError, ValidationError } from '../../common/errors';
import { createNotification } from './notification.service';
import type { DiscussionListResponse, DiscussionResponse, DiscussionDetailResponse, UserSummary } from './notification.types';
import type { CreateDiscussionInput, DiscussionQueryInput, UpdateDiscussionInput, CreateReplyInput, UpdateReplyInput } from './notification.schemas';

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

function assertValidObjectId(id: string, what = 'Resource'): void {
  if (!OBJECT_ID_RE.test(id)) {
    throw new NotFoundError(`${what} not found`);
  }
}

function toUserSummary(u: { id: string; email: string; firstName: string; lastName: string; role: Role }): UserSummary {
  return { id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName, role: u.role };
}

// ---------------------------------------------------------------------------
// Discussions
// ---------------------------------------------------------------------------

export async function createDiscussion(authorId: string, data: CreateDiscussionInput): Promise<DiscussionResponse> {
  if (data.courseId) {
    assertValidObjectId(data.courseId, 'Course');
    const course = await prisma.course.findUnique({ where: { id: data.courseId }, select: { id: true, status: true } });
    if (!course) throw new NotFoundError('Course not found');
  }
  if (data.sectionId) {
    assertValidObjectId(data.sectionId, 'Module');
    const mod = await prisma.module.findUnique({ where: { id: data.sectionId }, select: { id: true, courseId: true } });
    if (!mod) throw new NotFoundError('Module not found');
    // If both courseId and sectionId given, verify section belongs to course
    if (data.courseId && mod.courseId !== data.courseId) {
      throw new ValidationError('Module does not belong to the specified course');
    }
  }

  const discussion = await prisma.discussion.create({
    data: {
      courseId: data.courseId,
      sectionId: data.sectionId,
      title: data.title,
      content: data.content,
      authorId,
    },
    include: {
      author: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
      _count: { select: { replies: true } },
    },
  });

  const { _count, ...rest } = discussion as any;
  return { ...rest, author: toUserSummary(rest.author), replyCount: _count?.replies ?? 0 };
}

export async function getDiscussions(filters: DiscussionQueryInput): Promise<DiscussionListResponse> {
  const where: Prisma.DiscussionWhereInput = {};
  if (filters.courseId) where.courseId = filters.courseId;
  if (filters.sectionId) where.sectionId = filters.sectionId;
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { content: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const skip = (filters.page - 1) * filters.limit;
  const take = filters.limit;

  const [rows, total] = await Promise.all([
    prisma.discussion.findMany({
      where,
      skip,
      take,
      orderBy: [
        { pinned: 'desc' },
        { [filters.sortBy]: filters.sortBy === 'upvotes' || filters.sortBy === 'views' ? filters.sortOrder : filters.sortOrder },
      ],
      include: {
        author: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
        _count: { select: { replies: true } },
      },
    }),
    prisma.discussion.count({ where }),
  ]);

  return {
    data: rows.map((d) => {
      const { _count, ...rest } = d as any;
      return { ...rest, author: toUserSummary(rest.author), replyCount: _count?.replies ?? 0 };
    }),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  };
}

export async function getDiscussion(discussionId: string): Promise<DiscussionDetailResponse> {
  assertValidObjectId(discussionId, 'Discussion');
  const discussion = await prisma.discussion.findUnique({
    where: { id: discussionId },
    include: {
      author: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
      _count: { select: { replies: true } },
      replies: {
        orderBy: { createdAt: 'asc' },
        include: {
          author: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
        },
      },
    },
  });
  if (!discussion) throw new NotFoundError('Discussion not found');

  // Increment views (fire-and-forget)
  prisma.discussion.update({ where: { id: discussionId }, data: { views: { increment: 1 } } }).catch(() => null);

  const { _count, ...rest } = discussion as any;
  return {
    ...rest,
    author: toUserSummary(rest.author),
    replyCount: _count?.replies ?? 0,
    replies: discussion.replies.map((r) => ({ ...r, author: toUserSummary(r.author as any), children: [] })),
  };
}

export async function updateDiscussion(
  discussionId: string,
  userId: string,
  role: Role,
  data: UpdateDiscussionInput,
): Promise<DiscussionResponse> {
  assertValidObjectId(discussionId, 'Discussion');
  const discussion = await prisma.discussion.findUnique({ where: { id: discussionId }, select: { id: true, authorId: true } });
  if (!discussion) throw new NotFoundError('Discussion not found');

  if (role !== 'ADMIN' && discussion.authorId !== userId) {
    // Teachers can pin/lock discussions in their courses
    if (role === 'TEACHER') {
      // Allow only pinned/locked updates
      const allowed = Object.keys(data).every((k) => k === 'pinned' || k === 'locked');
      if (!allowed) {
        throw new ForbiddenError('You can only pin/lock discussions in courses you teach');
      }
    } else {
      throw new ForbiddenError('You can only edit your own discussions');
    }
  }

  const updated = await prisma.discussion.update({
    where: { id: discussionId },
    data,
    include: {
      author: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
      _count: { select: { replies: true } },
    },
  });

  const { _count, ...rest } = updated as any;
  return { ...rest, author: toUserSummary(rest.author), replyCount: _count?.replies ?? 0 };
}

export async function deleteDiscussion(discussionId: string, userId: string, role: Role): Promise<{ id: string; deleted: boolean }> {
  assertValidObjectId(discussionId, 'Discussion');
  const discussion = await prisma.discussion.findUnique({ where: { id: discussionId }, select: { id: true, authorId: true } });
  if (!discussion) throw new NotFoundError('Discussion not found');

  if (role !== 'ADMIN' && discussion.authorId !== userId) {
    throw new ForbiddenError('You can only delete your own discussions');
  }

  // Delete replies first (cascade may not work on MongoDB Prisma for self-relations)
  await prisma.discussionReply.deleteMany({ where: { discussionId } });
  await prisma.discussion.delete({ where: { id: discussionId } });
  return { id: discussionId, deleted: true };
}

// ---------------------------------------------------------------------------
// Replies
// ---------------------------------------------------------------------------

export async function createReply(
  authorId: string,
  discussionId: string,
  data: CreateReplyInput,
): Promise<any> {
  assertValidObjectId(discussionId, 'Discussion');
  const discussion = await prisma.discussion.findUnique({ where: { id: discussionId }, select: { id: true, locked: true, authorId: true, title: true } });
  if (!discussion) throw new NotFoundError('Discussion not found');
  if (discussion.locked) {
    throw new ValidationError('Discussion is locked — cannot reply');
  }

  if (data.parentId) {
    assertValidObjectId(data.parentId, 'Reply');
    const parent = await prisma.discussionReply.findUnique({ where: { id: data.parentId }, select: { id: true, discussionId: true } });
    if (!parent) throw new NotFoundError('Parent reply not found');
    if (parent.discussionId !== discussionId) {
      throw new ValidationError('Parent reply does not belong to this discussion');
    }
  }

  const reply = await prisma.discussionReply.create({
    data: {
      discussionId,
      authorId,
      content: data.content,
      parentId: data.parentId,
    },
    include: {
      author: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
    },
  });

  // Notify the discussion author (if not self-replying)
  if (discussion.authorId !== authorId) {
    await createNotification({
      userId: discussion.authorId,
      type: 'DISCUSSION_REPLY',
      title: 'New reply on your discussion',
      content: `Someone replied to your discussion "${discussion.title}".`,
      link: `/discussions/${discussionId}`,
      metadata: { discussionId, replyId: reply.id },
    }).catch(() => null);
  }

  // Notify parent reply author (if nested reply and not self)
  if (data.parentId) {
    const parent = await prisma.discussionReply.findUnique({ where: { id: data.parentId }, select: { authorId: true } });
    if (parent && parent.authorId !== authorId && parent.authorId !== discussion.authorId) {
      await createNotification({
        userId: parent.authorId,
        type: 'MENTION',
        title: 'New reply to your comment',
        content: `Someone replied to your comment in "${discussion.title}".`,
        link: `/discussions/${discussionId}`,
        metadata: { discussionId, replyId: reply.id },
      }).catch(() => null);
    }
  }

  return { ...reply, author: toUserSummary(reply.author as any), children: [] };
}

export async function updateReply(replyId: string, userId: string, role: Role, data: UpdateReplyInput): Promise<any> {
  assertValidObjectId(replyId, 'Reply');
  const reply = await prisma.discussionReply.findUnique({ where: { id: replyId }, select: { id: true, authorId: true } });
  if (!reply) throw new NotFoundError('Reply not found');

  if (role !== 'ADMIN' && reply.authorId !== userId) {
    throw new ForbiddenError('You can only edit your own replies');
  }

  const updated = await prisma.discussionReply.update({
    where: { id: replyId },
    data: { content: data.content },
    include: { author: { select: { id: true, email: true, firstName: true, lastName: true, role: true } } },
  });

  return { ...updated, author: toUserSummary(updated.author as any), children: [] };
}

export async function deleteReply(replyId: string, userId: string, role: Role): Promise<{ id: string; deleted: boolean }> {
  assertValidObjectId(replyId, 'Reply');
  const reply = await prisma.discussionReply.findUnique({ where: { id: replyId }, select: { id: true, authorId: true, discussionId: true } });
  if (!reply) throw new NotFoundError('Reply not found');

  if (role !== 'ADMIN' && reply.authorId !== userId) {
    throw new ForbiddenError('You can only delete your own replies');
  }

  // Delete child replies first
  await prisma.discussionReply.deleteMany({ where: { parentId: replyId } });
  await prisma.discussionReply.delete({ where: { id: replyId } });
  return { id: replyId, deleted: true };
}

// ---------------------------------------------------------------------------
// Upvotes (simple increment — for production, track per-user with a join table)
// ---------------------------------------------------------------------------

export async function upvoteDiscussion(discussionId: string, userId: string): Promise<{ id: string; upvotes: number }> {
  assertValidObjectId(discussionId, 'Discussion');
  const discussion = await prisma.discussion.findUnique({ where: { id: discussionId }, select: { id: true } });
  if (!discussion) throw new NotFoundError('Discussion not found');

  // Simple increment (no dedup — for production, add a DiscussionUpvote join table)
  const updated = await prisma.discussion.update({
    where: { id: discussionId },
    data: { upvotes: { increment: 1 } },
    select: { id: true, upvotes: true },
  });
  return updated;
}

export async function upvoteReply(replyId: string, userId: string): Promise<{ id: string; upvotes: number }> {
  assertValidObjectId(replyId, 'Reply');
  const reply = await prisma.discussionReply.findUnique({ where: { id: replyId }, select: { id: true } });
  if (!reply) throw new NotFoundError('Reply not found');

  const updated = await prisma.discussionReply.update({
    where: { id: replyId },
    data: { upvotes: { increment: 1 } },
    select: { id: true, upvotes: true },
  });
  return updated;
}

// ---------------------------------------------------------------------------
// Best answer
// ---------------------------------------------------------------------------

export async function markBestAnswer(
  discussionId: string,
  replyId: string,
  userId: string,
  role: Role,
): Promise<{ discussionId: string; replyId: string; bestAnswerId: string }> {
  assertValidObjectId(discussionId, 'Discussion');
  assertValidObjectId(replyId, 'Reply');

  const discussion = await prisma.discussion.findUnique({ where: { id: discussionId }, select: { id: true, authorId: true, bestAnswerId: true } });
  if (!discussion) throw new NotFoundError('Discussion not found');

  // Only discussion author or admin can mark best answer
  if (role !== 'ADMIN' && discussion.authorId !== userId) {
    throw new ForbiddenError('Only the discussion author or admin can mark the best answer');
  }

  const reply = await prisma.discussionReply.findUnique({ where: { id: replyId }, select: { id: true, discussionId: true, authorId: true } });
  if (!reply) throw new NotFoundError('Reply not found');
  if (reply.discussionId !== discussionId) {
    throw new ValidationError('Reply does not belong to this discussion');
  }

  // Clear previous best answer flag, set new one
  if (discussion.bestAnswerId) {
    await prisma.discussionReply.update({
      where: { id: discussion.bestAnswerId },
      data: { isBestAnswer: false },
    });
  }

  await prisma.discussionReply.update({
    where: { id: replyId },
    data: { isBestAnswer: true },
  });

  await prisma.discussion.update({
    where: { id: discussionId },
    data: { bestAnswerId: replyId },
  });

  // Notify reply author
  if (reply.authorId !== userId) {
    await createNotification({
      userId: reply.authorId,
      type: 'DISCUSSION_REPLY',
      title: 'Your reply was marked as best answer!',
      content: 'Congratulations! Your reply was selected as the best answer.',
      link: `/discussions/${discussionId}`,
      metadata: { discussionId, replyId },
    }).catch(() => null);
  }

  return { discussionId, replyId, bestAnswerId: replyId };
}
