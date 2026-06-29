// src/modules/notifications/notification.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  getPreferences,
  updatePreference,
} from './notification.service';
import {
  createDiscussion,
  getDiscussions,
  getDiscussion,
  updateDiscussion,
  deleteDiscussion,
  createReply,
  updateReply,
  deleteReply,
  upvoteDiscussion,
  upvoteReply,
  markBestAnswer,
} from './discussion.service';
import {
  sendDirectMessage,
  sendGroupMessage,
  getConversations,
  getMessages,
  markRead,
  createGroup,
} from './message.service';
import {
  createAnnouncement,
  getAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
  markAnnouncementRead,
  getUnreadAnnouncements,
} from './announcement.service';
import { logAction } from '../../common/services/audit.service';
import { getClientIp, getUserAgent } from '../../common/services/upload.service';
import { isHttpError } from '../../common/errors';
import type { AnnouncementQueryInput, DiscussionQueryInput, MessageQueryInput, NotificationQueryInput } from './notification.schemas';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function paramId(req: Request, key: string): string {
  const v = req.params[key];
  return Array.isArray(v) ? v[0] : v;
}

function auditCtx(req: Request) {
  return { ip: getClientIp(req), userAgent: getUserAgent(req) };
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export async function getNotificationsController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;
    const filters = {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
      unreadOnly: req.query.unreadOnly === 'true',
      ...(req.query.type ? { type: req.query.type as any } : {}),
    } as NotificationQueryInput;
    const result = await getNotifications(userId, filters);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function markAsReadController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req, 'notificationId');
    const userId = req.user!.sub;
    const notification = await markAsRead(id, userId);
    res.status(200).json({ notification });
  } catch (err) {
    next(err);
  }
}

export async function markAllAsReadController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;
    const result = await markAllAsRead(userId);
    res.status(200).json({ message: 'All notifications marked as read.', ...result });
  } catch (err) {
    next(err);
  }
}

export async function getPreferencesController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;
    const preferences = await getPreferences(userId);
    res.status(200).json({ preferences });
  } catch (err) {
    next(err);
  }
}

export async function updatePreferenceController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;
    const preference = await updatePreference(userId, req.body);
    res.status(200).json({ message: 'Preference updated.', preference });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Discussions
// ---------------------------------------------------------------------------

export async function createDiscussionController(req: Request, res: Response, next: NextFunction) {
  try {
    const authorId = req.user!.sub;
    const discussion = await createDiscussion(authorId, req.body);

    await logAction({
      userId: authorId,
      action: 'DISCUSSION_CREATE',
      entityType: 'Discussion',
      entityId: discussion.id,
      details: { title: discussion.title, courseId: discussion.courseId },
      context: auditCtx(req),
    });

    res.status(201).json({ message: 'Discussion created.', discussion });
  } catch (err) {
    next(err);
  }
}

export async function getDiscussionsController(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
      sortBy: (req.query.sortBy as any) || 'createdAt',
      sortOrder: (req.query.sortOrder as any) || 'desc',
      ...(req.query.courseId ? { courseId: String(req.query.courseId) } : {}),
      ...(req.query.sectionId ? { sectionId: String(req.query.sectionId) } : {}),
      ...(req.query.search ? { search: String(req.query.search) } : {}),
    } as DiscussionQueryInput;
    const result = await getDiscussions(filters);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getDiscussionController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req, 'discussionId');
    const discussion = await getDiscussion(id);
    res.status(200).json({ discussion });
  } catch (err) {
    next(err);
  }
}

export async function updateDiscussionController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req, 'discussionId');
    const viewer = { id: req.user!.sub, role: req.user!.role };
    const discussion = await updateDiscussion(id, viewer.id, viewer.role, req.body);

    await logAction({
      userId: viewer.id,
      action: 'DISCUSSION_UPDATE',
      entityType: 'Discussion',
      entityId: id,
      details: req.body,
      context: auditCtx(req),
    });

    res.status(200).json({ message: 'Discussion updated.', discussion });
  } catch (err) {
    next(err);
  }
}

export async function deleteDiscussionController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req, 'discussionId');
    const viewer = { id: req.user!.sub, role: req.user!.role };
    const result = await deleteDiscussion(id, viewer.id, viewer.role);

    await logAction({
      userId: viewer.id,
      action: 'DISCUSSION_DELETE',
      entityType: 'Discussion',
      entityId: id,
      context: auditCtx(req),
    });

    res.status(200).json({ message: 'Discussion deleted.', ...result });
  } catch (err) {
    next(err);
  }
}

export async function createReplyController(req: Request, res: Response, next: NextFunction) {
  try {
    const discussionId = paramId(req, 'discussionId');
    const authorId = req.user!.sub;
    const reply = await createReply(authorId, discussionId, req.body);

    await logAction({
      userId: authorId,
      action: 'DISCUSSION_REPLY_CREATE',
      entityType: 'DiscussionReply',
      entityId: reply.id,
      details: { discussionId, parentId: req.body.parentId },
      context: auditCtx(req),
    });

    res.status(201).json({ message: 'Reply created.', reply });
  } catch (err) {
    next(err);
  }
}

export async function updateReplyController(req: Request, res: Response, next: NextFunction) {
  try {
    const replyId = paramId(req, 'replyId');
    const viewer = { id: req.user!.sub, role: req.user!.role };
    const reply = await updateReply(replyId, viewer.id, viewer.role, req.body);
    res.status(200).json({ message: 'Reply updated.', reply });
  } catch (err) {
    next(err);
  }
}

export async function deleteReplyController(req: Request, res: Response, next: NextFunction) {
  try {
    const replyId = paramId(req, 'replyId');
    const viewer = { id: req.user!.sub, role: req.user!.role };
    const result = await deleteReply(replyId, viewer.id, viewer.role);
    res.status(200).json({ message: 'Reply deleted.', ...result });
  } catch (err) {
    next(err);
  }
}

export async function upvoteDiscussionController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req, 'discussionId');
    const userId = req.user!.sub;
    const result = await upvoteDiscussion(id, userId);
    res.status(200).json({ message: 'Upvoted.', ...result });
  } catch (err) {
    next(err);
  }
}

export async function upvoteReplyController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req, 'replyId');
    const userId = req.user!.sub;
    const result = await upvoteReply(id, userId);
    res.status(200).json({ message: 'Upvoted.', ...result });
  } catch (err) {
    next(err);
  }
}

export async function markBestAnswerController(req: Request, res: Response, next: NextFunction) {
  try {
    const discussionId = paramId(req, 'discussionId');
    const replyId = paramId(req, 'replyId');
    const viewer = { id: req.user!.sub, role: req.user!.role };
    const result = await markBestAnswer(discussionId, replyId, viewer.id, viewer.role);

    await logAction({
      userId: viewer.id,
      action: 'DISCUSSION_BEST_ANSWER',
      entityType: 'Discussion',
      entityId: discussionId,
      details: { replyId },
      context: auditCtx(req),
    });

    res.status(200).json({ message: 'Best answer marked.', ...result });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export async function sendMessageController(req: Request, res: Response, next: NextFunction) {
  try {
    const senderId = req.user!.sub;
    let message;
    if (req.body.receiverId) {
      message = await sendDirectMessage(senderId, req.body.receiverId, req.body.content, req.body.attachments);
    } else {
      message = await sendGroupMessage(senderId, req.body.groupId, req.body.content, req.body.attachments);
    }

    await logAction({
      userId: senderId,
      action: 'MESSAGE_SEND',
      entityType: 'Message',
      entityId: message.id,
      details: { receiverId: req.body.receiverId, groupId: req.body.groupId },
      context: auditCtx(req),
    });

    res.status(201).json({ message: 'Message sent.', messageRecord: message });
  } catch (err) {
    next(err);
  }
}

export async function getConversationsController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;
    const conversations = await getConversations(userId);
    res.status(200).json({ conversations });
  } catch (err) {
    next(err);
  }
}

export async function getMessagesController(req: Request, res: Response, next: NextFunction) {
  try {
    const groupId = paramId(req, 'groupId');
    const userId = req.user!.sub;
    const pagination: MessageQueryInput = {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 50,
    };
    const result = await getMessages(groupId, userId, pagination);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function markReadController(req: Request, res: Response, next: NextFunction) {
  try {
    const groupId = paramId(req, 'groupId');
    const userId = req.user!.sub;
    const result = await markRead(groupId, userId);
    res.status(200).json({ message: 'Marked as read.', ...result });
  } catch (err) {
    next(err);
  }
}

export async function createGroupController(req: Request, res: Response, next: NextFunction) {
  try {
    const creatorId = req.user!.sub;
    const group = await createGroup(creatorId, req.body);
    res.status(201).json({ message: 'Group created.', group });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------------

export async function createAnnouncementController(req: Request, res: Response, next: NextFunction) {
  try {
    const creatorId = req.user!.sub;
    const role = req.user!.role;
    const announcement = await createAnnouncement(creatorId, role, req.body);

    await logAction({
      userId: creatorId,
      action: 'ANNOUNCEMENT_CREATE',
      entityType: 'Announcement',
      entityId: announcement.id,
      details: { title: announcement.title, priority: announcement.priority, courseId: announcement.courseId },
      context: auditCtx(req),
    });

    res.status(201).json({ message: 'Announcement created.', announcement });
  } catch (err) {
    next(err);
  }
}

export async function getAnnouncementsController(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
      activeOnly: req.query.activeOnly !== 'false',
      ...(req.query.courseId ? { courseId: String(req.query.courseId) } : {}),
      ...(req.query.priority ? { priority: req.query.priority as any } : {}),
    } as AnnouncementQueryInput;
    const viewer = req.user ? { id: req.user.sub, role: req.user.role } : undefined;
    const result = await getAnnouncements(filters, viewer);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateAnnouncementController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req, 'announcementId');
    const viewer = { id: req.user!.sub, role: req.user!.role };
    const announcement = await updateAnnouncement(id, viewer, req.body);

    await logAction({
      userId: viewer.id,
      action: 'ANNOUNCEMENT_UPDATE',
      entityType: 'Announcement',
      entityId: id,
      details: req.body,
      context: auditCtx(req),
    });

    res.status(200).json({ message: 'Announcement updated.', announcement });
  } catch (err) {
    next(err);
  }
}

export async function deleteAnnouncementController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req, 'announcementId');
    const viewer = { id: req.user!.sub, role: req.user!.role };
    const result = await deleteAnnouncement(id, viewer);

    await logAction({
      userId: viewer.id,
      action: 'ANNOUNCEMENT_DELETE',
      entityType: 'Announcement',
      entityId: id,
      context: auditCtx(req),
    });

    res.status(200).json({ message: 'Announcement deleted.', ...result });
  } catch (err) {
    next(err);
  }
}

export async function markAnnouncementReadController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req, 'announcementId');
    const userId = req.user!.sub;
    const result = await markAnnouncementRead(id, userId);
    res.status(200).json({ message: 'Announcement marked as read.', ...result });
  } catch (err) {
    next(err);
  }
}

export async function getUnreadAnnouncementsController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;
    const courseId = req.query.courseId as string | undefined;
    const result = await getUnreadAnnouncements(userId, courseId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Error handler
// ---------------------------------------------------------------------------

export function notificationErrorHandler(
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
