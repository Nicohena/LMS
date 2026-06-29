// src/modules/notifications/notification.routes.ts
import { Router } from 'express';
import { authenticate, optionalAuth } from '../../common/middlewares/auth.middleware';
import { authorize } from '../../common/middlewares/rbac.middleware';
import { validate } from '../../common/middlewares/validation.middleware';
import {
  // Notifications
  getNotificationsController,
  markAsReadController,
  markAllAsReadController,
  getPreferencesController,
  updatePreferenceController,
  // Discussions
  createDiscussionController,
  getDiscussionsController,
  getDiscussionController,
  updateDiscussionController,
  deleteDiscussionController,
  createReplyController,
  updateReplyController,
  deleteReplyController,
  upvoteDiscussionController,
  upvoteReplyController,
  markBestAnswerController,
  // Messages
  sendMessageController,
  getConversationsController,
  getMessagesController,
  markReadController,
  createGroupController,
  // Announcements
  createAnnouncementController,
  getAnnouncementsController,
  updateAnnouncementController,
  deleteAnnouncementController,
  markAnnouncementReadController,
  getUnreadAnnouncementsController,
  // Error handler
  notificationErrorHandler,
} from './notification.controller';
import {
  notificationPreferenceSchema,
  createDiscussionSchema,
  updateDiscussionSchema,
  createReplySchema,
  updateReplySchema,
  sendMessageSchema,
  createGroupSchema,
  createAnnouncementSchema,
  updateAnnouncementSchema,
} from './notification.schemas';

// ---------------------------------------------------------------------------
// Notifications router (/api/v1/notifications)
// ---------------------------------------------------------------------------

export const notificationRouter = Router();
notificationRouter.use(authenticate);

notificationRouter.get('/', getNotificationsController);
notificationRouter.patch('/all-read', markAllAsReadController);
notificationRouter.patch('/:notificationId/read', markAsReadController);
notificationRouter.get('/preferences', getPreferencesController);
notificationRouter.patch('/preferences', validate({ body: notificationPreferenceSchema }), updatePreferenceController);
notificationRouter.use(notificationErrorHandler);

// ---------------------------------------------------------------------------
// Discussions router (/api/v1/discussions)
// ---------------------------------------------------------------------------

export const discussionRouter = Router();

// Public read (anyone can view discussions)
discussionRouter.get('/', optionalAuth, getDiscussionsController);
discussionRouter.get('/:discussionId', optionalAuth, getDiscussionController);

// Authenticated actions
discussionRouter.use(authenticate);

discussionRouter.post('/', validate({ body: createDiscussionSchema }), createDiscussionController);
discussionRouter.patch('/:discussionId', validate({ body: updateDiscussionSchema }), updateDiscussionController);
discussionRouter.delete('/:discussionId', deleteDiscussionController);

discussionRouter.post('/:discussionId/replies', validate({ body: createReplySchema }), createReplyController);
discussionRouter.patch('/replies/:replyId', validate({ body: updateReplySchema }), updateReplyController);
discussionRouter.delete('/replies/:replyId', deleteReplyController);

discussionRouter.post('/:discussionId/upvote', upvoteDiscussionController);
discussionRouter.post('/replies/:replyId/upvote', upvoteReplyController);
discussionRouter.post('/:discussionId/best-answer/:replyId', markBestAnswerController);

discussionRouter.use(notificationErrorHandler);

// ---------------------------------------------------------------------------
// Messages router (/api/v1/messages)
// ---------------------------------------------------------------------------

export const messageRouter = Router();
messageRouter.use(authenticate);

messageRouter.post('/', validate({ body: sendMessageSchema }), sendMessageController);
messageRouter.get('/conversations', getConversationsController);
messageRouter.post('/groups', validate({ body: createGroupSchema }), createGroupController);
messageRouter.get('/:groupId', getMessagesController);
messageRouter.patch('/:groupId/read', markReadController);

messageRouter.use(notificationErrorHandler);

// ---------------------------------------------------------------------------
// Announcements router (/api/v1/announcements)
// ---------------------------------------------------------------------------

export const announcementRouter = Router();

// Public read (anyone can view active announcements)
announcementRouter.get('/', optionalAuth, getAnnouncementsController);
announcementRouter.get('/unread', authenticate, getUnreadAnnouncementsController);

// Authenticated read receipt
announcementRouter.use(authenticate);
announcementRouter.patch('/:announcementId/read', markAnnouncementReadController);

// Admin/teacher-only writes
announcementRouter.post('/', authorize('ADMIN', 'TEACHER'), validate({ body: createAnnouncementSchema }), createAnnouncementController);
announcementRouter.patch('/:announcementId', authorize('ADMIN', 'TEACHER'), validate({ body: updateAnnouncementSchema }), updateAnnouncementController);
announcementRouter.delete('/:announcementId', authorize('ADMIN', 'TEACHER'), deleteAnnouncementController);

announcementRouter.use(notificationErrorHandler);

export default notificationRouter;
