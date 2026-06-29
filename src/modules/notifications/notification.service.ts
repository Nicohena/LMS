// src/modules/notifications/notification.service.ts
import { NotificationChannel, NotificationType, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../common/errors';
import { sendNotificationEmail } from './email.service';
import type { NotificationListResponse, NotificationResponse } from './notification.types';
import type { NotificationPreferenceInput, NotificationQueryInput } from './notification.schemas';

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

// ---------------------------------------------------------------------------
// Create + dispatch
// ---------------------------------------------------------------------------

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  link?: string;
  metadata?: Record<string, unknown>;
  channels?: NotificationChannel[];
}

/**
 * Create an in-app notification and (optionally) queue an email.
 * Respects user preferences — if the user has disabled this type for
 * IN_APP, no notification is created. If EMAIL is enabled, queues email.
 *
 * This is the central function other modules call to notify users.
 */
export async function createNotification(params: CreateNotificationParams): Promise<NotificationResponse | null> {
  const { userId, type, title, content, priority = 'NORMAL', link, metadata, channels = ['IN_APP'] } = params;

  if (!OBJECT_ID_RE.test(userId)) return null;

  // Fetch user preferences for this notification type
  const prefs = await prisma.notificationPreference.findMany({
    where: { userId, type },
  });

  // Check IN_APP preference — if explicitly disabled, skip creating the notification
  const inAppPref = prefs.find((p) => p.channel === 'IN_APP');
  if (inAppPref && !inAppPref.enabled) {
    // Still send email if enabled
    if (channels.includes('EMAIL')) {
      const emailPref = prefs.find((p) => p.channel === 'EMAIL');
      if (!emailPref || emailPref.enabled) {
        await sendNotificationEmail(userId, type, { title, content, link, ...metadata }).catch(() => null);
      }
    }
    return null;
  }

  // Check quiet hours (if any preference has them set)
  const quietHoursPref = prefs.find((p) => p.quietHoursStart || p.quietHoursEnd);
  if (quietHoursPref && isInQuietHours(quietHoursPref.quietHoursStart, quietHoursPref.quietHoursEnd)) {
    // During quiet hours — still create the in-app notification (user can see it later)
    // but skip email/push
  }

  // Create the in-app notification
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      content,
      priority,
      link,
      channels,
      metadata: metadata as Prisma.InputJsonValue | undefined,
      deliveredAt: new Date(),
    },
  });

  // Queue email if EMAIL channel is requested and enabled
  if (channels.includes('EMAIL')) {
    const emailPref = prefs.find((p) => p.channel === 'EMAIL');
    if (!emailPref || emailPref.enabled) {
      await sendNotificationEmail(userId, type, { title, content, link, ...metadata }).catch(() => null);
    }
  }

  return notification;
}

// ---------------------------------------------------------------------------
// List / mark read
// ---------------------------------------------------------------------------

export async function getNotifications(
  userId: string,
  filters: NotificationQueryInput,
): Promise<NotificationListResponse> {
  const where: Prisma.NotificationWhereInput = { userId };
  if (filters.unreadOnly) where.isRead = false;
  if (filters.type) where.type = filters.type;

  const skip = (filters.page - 1) * filters.limit;
  const take = filters.limit;

  const [rows, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return {
    data: rows,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
      unreadCount,
    },
  };
}

export async function markAsRead(notificationId: string, userId: string): Promise<NotificationResponse> {
  if (!OBJECT_ID_RE.test(notificationId)) {
    throw new NotFoundError('Notification not found');
  }
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification) throw new NotFoundError('Notification not found');
  if (notification.userId !== userId) {
    throw new NotFoundError('Notification not found');
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function markAllAsRead(userId: string): Promise<{ updated: number }> {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
  return { updated: result.count };
}

// ---------------------------------------------------------------------------
// Preferences
// ---------------------------------------------------------------------------

export async function getPreferences(userId: string): Promise<any[]> {
  // Return all notification types with their preference status (defaulting to enabled)
  const allTypes = Object.values(NotificationType);
  const allChannels = Object.values(NotificationChannel);

  const existing = await prisma.notificationPreference.findMany({ where: { userId } });

  const result: any[] = [];
  for (const type of allTypes) {
    for (const channel of allChannels) {
      const pref = existing.find((p) => p.type === type && p.channel === channel);
      result.push({
        id: pref?.id ?? null,
        userId,
        type,
        channel,
        enabled: pref?.enabled ?? true,
        quietHoursStart: pref?.quietHoursStart ?? null,
        quietHoursEnd: pref?.quietHoursEnd ?? null,
      });
    }
  }
  return result;
}

export async function updatePreference(
  userId: string,
  data: NotificationPreferenceInput,
): Promise<any> {
  // Upsert the preference (unique on [userId, type, channel])
  const existing = await prisma.notificationPreference.findUnique({
    where: {
      userId_type_channel: { userId, type: data.type, channel: data.channel },
    },
  });

  if (existing) {
    return prisma.notificationPreference.update({
      where: { id: existing.id },
      data: {
        enabled: data.enabled,
        quietHoursStart: data.quietHoursStart ?? null,
        quietHoursEnd: data.quietHoursEnd ?? null,
      },
    });
  }

  return prisma.notificationPreference.create({
    data: {
      userId,
      type: data.type,
      channel: data.channel,
      enabled: data.enabled,
      quietHoursStart: data.quietHoursStart ?? null,
      quietHoursEnd: data.quietHoursEnd ?? null,
    },
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isInQuietHours(start: string | null | undefined, end: string | null | undefined): boolean {
  if (!start || !end) return false;
  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;

  if (startMin > endMin) {
    return currentMin >= startMin || currentMin < endMin;
  }
  return currentMin >= startMin && currentMin < endMin;
}
