// src/modules/notifications/notification.types.ts
import type {
  Announcement,
  Discussion,
  DiscussionReply,
  Message,
  MessageGroup,
  Notification,
  NotificationChannel,
  NotificationPreference,
  NotificationPriority,
  NotificationType,
  User,
} from '@prisma/client';

// ---------------------------------------------------------------------------
// User summary (reused across responses)
// ---------------------------------------------------------------------------

export interface UserSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export type NotificationResponse = Notification;

export interface NotificationListResponse {
  data: NotificationResponse[];
  pagination: { page: number; limit: number; total: number; totalPages: number; unreadCount: number };
}

export type NotificationPreferenceResponse = NotificationPreference;

// ---------------------------------------------------------------------------
// Discussions
// ---------------------------------------------------------------------------

export type DiscussionResponse = Discussion & {
  author: UserSummary;
  replyCount: number;
};

export type DiscussionDetailResponse = DiscussionResponse & {
  replies: Array<DiscussionReply & { author: UserSummary; children: any[] }>;
};

export interface DiscussionListResponse {
  data: DiscussionResponse[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export type MessageResponse = Message & {
  sender: UserSummary;
};

export interface ConversationResponse {
  group: {
    id: string;
    name: string | null;
    isDirect: boolean;
  };
  lastMessage: MessageResponse | null;
  unreadCount: number;
  members: UserSummary[];
}

export interface MessageListResponse {
  data: MessageResponse[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

// ---------------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------------

export type AnnouncementResponse = Announcement & {
  creator: UserSummary;
  isRead: boolean;
};

export interface AnnouncementListResponse {
  data: AnnouncementResponse[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
