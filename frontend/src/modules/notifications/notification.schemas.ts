// src/modules/notifications/notification.schemas.ts
import { z } from 'zod';
import { NotificationChannel, NotificationPriority, NotificationType } from '@prisma/client';

// ---------------------------------------------------------------------------
// Notification preferences
// ---------------------------------------------------------------------------

export const notificationPreferenceSchema = z.object({
  type: z.nativeEnum(NotificationType),
  channel: z.nativeEnum(NotificationChannel),
  enabled: z.boolean().default(true),
  quietHoursStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Must be HH:MM').optional().nullable(),
  quietHoursEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Must be HH:MM').optional().nullable(),
}).strict();

export const notificationQuerySchema = z.object({
  page: z.string().optional().transform((v) => (v ? Math.max(1, Number(v)) : 1)),
  limit: z.string().optional().transform((v) => {
    if (!v) return 20;
    return Math.min(100, Math.max(1, Number(v)));
  }),
  unreadOnly: z.string().optional().transform((v) => v === 'true'),
  type: z.nativeEnum(NotificationType).optional(),
}).strict();

// ---------------------------------------------------------------------------
// Discussions
// ---------------------------------------------------------------------------

export const createDiscussionSchema = z.object({
  courseId: z.string().min(1).optional(),
  sectionId: z.string().min(1).optional(),
  title: z.string().min(1, 'Title is required').max(200).trim(),
  content: z.string().min(1, 'Content is required').max(20000),
}).strict();

export const updateDiscussionSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  content: z.string().max(20000).optional(),
  pinned: z.boolean().optional(),
  locked: z.boolean().optional(),
}).strict();

export const createReplySchema = z.object({
  content: z.string().min(1, 'Content is required').max(20000),
  parentId: z.string().min(1).optional(),
}).strict();

export const updateReplySchema = z.object({
  content: z.string().min(1).max(20000),
}).strict();

export const discussionQuerySchema = z.object({
  page: z.string().optional().transform((v) => (v ? Math.max(1, Number(v)) : 1)),
  limit: z.string().optional().transform((v) => {
    if (!v) return 20;
    return Math.min(100, Math.max(1, Number(v)));
  }),
  courseId: z.string().min(1).optional(),
  sectionId: z.string().min(1).optional(),
  search: z.string().trim().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'upvotes', 'views']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
}).strict();

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export const messageAttachmentSchema = z.object({
  public_id: z.string().min(1),
  secure_url: z.string().url(),
  filename: z.string().min(1),
  size: z.number().int().nonnegative(),
});

export const sendMessageSchema = z.object({
  receiverId: z.string().min(1).optional(),
  groupId: z.string().min(1).optional(),
  content: z.string().min(1, 'Content is required').max(10000),
  attachments: z.array(messageAttachmentSchema).max(10).optional(),
}).strict().refine(
  (data) => data.receiverId || data.groupId,
  'Either receiverId or groupId is required',
).refine(
  (data) => !(data.receiverId && data.groupId),
  'Provide either receiverId OR groupId, not both',
);

export const createGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  memberIds: z.array(z.string().min(1)).min(1, 'At least one member is required').max(50),
}).strict();

export const messageQuerySchema = z.object({
  page: z.string().optional().transform((v) => (v ? Math.max(1, Number(v)) : 1)),
  limit: z.string().optional().transform((v) => {
    if (!v) return 50;
    return Math.min(200, Math.max(1, Number(v)));
  }),
}).strict();

// ---------------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------------

export const createAnnouncementSchema = z.object({
  courseId: z.string().min(1).optional(),
  title: z.string().min(1, 'Title is required').max(200).trim(),
  content: z.string().min(1, 'Content is required').max(20000),
  priority: z.nativeEnum(NotificationPriority).default('NORMAL'),
  scheduledAt: z.string().datetime().optional().transform((v) => (v ? new Date(v) : undefined)),
  expiresAt: z.string().datetime().optional().transform((v) => (v ? new Date(v) : undefined)),
}).strict();

export const updateAnnouncementSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  content: z.string().max(20000).optional(),
  priority: z.nativeEnum(NotificationPriority).optional(),
  scheduledAt: z.string().datetime().nullable().optional().transform((v) => (v ? new Date(v) : undefined)),
  expiresAt: z.string().datetime().nullable().optional().transform((v) => (v ? new Date(v) : undefined)),
  isActive: z.boolean().optional(),
}).strict();

export const announcementQuerySchema = z.object({
  page: z.string().optional().transform((v) => (v ? Math.max(1, Number(v)) : 1)),
  limit: z.string().optional().transform((v) => {
    if (!v) return 20;
    return Math.min(100, Math.max(1, Number(v)));
  }),
  courseId: z.string().min(1).optional(),
  priority: z.nativeEnum(NotificationPriority).optional(),
  activeOnly: z.string().optional().transform((v) => v !== 'false'),
}).strict();

// ---------------------------------------------------------------------------
// Derived types
// ---------------------------------------------------------------------------

export type NotificationPreferenceInput = z.infer<typeof notificationPreferenceSchema>;
export type NotificationQueryInput = z.infer<typeof notificationQuerySchema>;
export type CreateDiscussionInput = z.infer<typeof createDiscussionSchema>;
export type UpdateDiscussionInput = z.infer<typeof updateDiscussionSchema>;
export type CreateReplyInput = z.infer<typeof createReplySchema>;
export type UpdateReplyInput = z.infer<typeof updateReplySchema>;
export type DiscussionQueryInput = z.infer<typeof discussionQuerySchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type MessageQueryInput = z.infer<typeof messageQuerySchema>;
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;
export type AnnouncementQueryInput = z.infer<typeof announcementQuerySchema>;
