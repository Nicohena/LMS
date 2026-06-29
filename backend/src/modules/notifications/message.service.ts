// src/modules/notifications/message.service.ts
import { Prisma, Role } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError, ForbiddenError, ValidationError } from '../../common/errors';
import type { ConversationResponse, MessageListResponse, MessageResponse, UserSummary } from './notification.types';
import type { CreateGroupInput, MessageQueryInput, SendMessageInput } from './notification.schemas';

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
// Send messages
// ---------------------------------------------------------------------------

export async function sendDirectMessage(
  senderId: string,
  receiverId: string,
  content: string,
  attachments?: any[],
): Promise<MessageResponse> {
  assertValidObjectId(receiverId, 'User');
  if (senderId === receiverId) {
    throw new ValidationError('Cannot send a message to yourself');
  }

  const receiver = await prisma.user.findUnique({ where: { id: receiverId }, select: { id: true, isActive: true } });
  if (!receiver) throw new NotFoundError('Receiver not found');
  if (!receiver.isActive) throw new ValidationError('Receiver account is inactive');

  // Find or create a direct message group between these two users
  let group = await findDirectGroup(senderId, receiverId);
  if (!group) {
    group = await prisma.messageGroup.create({
      data: {
        isDirect: true,
        members: {
          create: [{ userId: senderId }, { userId: receiverId }],
        },
      },
      include: { members: true },
    });
  }

  const message = await prisma.message.create({
    data: {
      senderId,
      receiverId,
      groupId: group.id,
      content,
      attachments: attachments as Prisma.InputJsonValue | undefined,
    },
    include: {
      sender: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
    },
  });

  return { ...message, sender: toUserSummary(message.sender as any) };
}

export async function sendGroupMessage(
  senderId: string,
  groupId: string,
  content: string,
  attachments?: any[],
): Promise<MessageResponse> {
  assertValidObjectId(groupId, 'MessageGroup');
  const group = await prisma.messageGroup.findUnique({
    where: { id: groupId },
    include: { members: { select: { userId: true } } },
  });
  if (!group) throw new NotFoundError('Message group not found');

  // Verify sender is a member
  if (!group.members.some((m) => m.userId === senderId)) {
    throw new ForbiddenError('You can only send messages to groups you are a member of');
  }

  const message = await prisma.message.create({
    data: {
      senderId,
      groupId,
      content,
      attachments: attachments as Prisma.InputJsonValue | undefined,
    },
    include: {
      sender: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
    },
  });

  return { ...message, sender: toUserSummary(message.sender as any) };
}

async function findDirectGroup(userA: string, userB: string): Promise<any | null> {
  // Find a direct group where both users are members
  const groups = await prisma.messageGroup.findMany({
    where: {
      isDirect: true,
      members: { every: { userId: { in: [userA, userB] } } },
    },
    include: { members: true },
  });
  // Filter to groups that have exactly these 2 members
  for (const g of groups) {
    const memberIds = g.members.map((m: any) => m.userId).sort();
    if (memberIds.length === 2 && memberIds[0] === [userA, userB].sort()[0] && memberIds[1] === [userA, userB].sort()[1]) {
      return g;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Conversations + history
// ---------------------------------------------------------------------------

export async function getConversations(userId: string): Promise<ConversationResponse[]> {
  // Get all groups the user is a member of, with last message + unread count
  const memberships = await prisma.messageGroupMember.findMany({
    where: { userId },
    include: {
      group: {
        include: {
          members: {
            include: {
              user: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              sender: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
            },
          },
        },
      },
    },
    orderBy: { group: { updatedAt: 'desc' } },
  });

  const result: ConversationResponse[] = [];
  for (const m of memberships) {
    const lastMessage = m.group.messages[0];
    // Count unread: messages in this group created after lastReadAt, not sent by this user
    const unreadCount = await prisma.message.count({
      where: {
        groupId: m.groupId,
        createdAt: { gt: m.lastReadAt },
        senderId: { not: userId },
      },
    });

    result.push({
      group: {
        id: m.group.id,
        name: m.group.name,
        isDirect: m.group.isDirect,
      },
      lastMessage: lastMessage ? { ...lastMessage, sender: toUserSummary(lastMessage.sender as any) } : null,
      unreadCount,
      members: m.group.members.map((mem: any) => toUserSummary(mem.user)),
    });
  }

  return result;
}

export async function getMessages(
  groupId: string,
  userId: string,
  pagination: MessageQueryInput,
): Promise<MessageListResponse> {
  assertValidObjectId(groupId, 'MessageGroup');

  // Verify membership
  const membership = await prisma.messageGroupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!membership) {
    throw new ForbiddenError('You can only view messages in groups you are a member of');
  }

  const skip = (pagination.page - 1) * pagination.limit;
  const take = pagination.limit;

  const [rows, total] = await Promise.all([
    prisma.message.findMany({
      where: { groupId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
      },
    }),
    prisma.message.count({ where: { groupId } }),
  ]);

  return {
    data: rows.map((m) => ({ ...m, sender: toUserSummary(m.sender as any) })),
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
}

export async function markRead(groupId: string, userId: string): Promise<{ groupId: string; lastReadAt: Date }> {
  assertValidObjectId(groupId, 'MessageGroup');
  const membership = await prisma.messageGroupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!membership) {
    throw new ForbiddenError('You are not a member of this group');
  }

  const updated = await prisma.messageGroupMember.update({
    where: { id: membership.id },
    data: { lastReadAt: new Date() },
    select: { groupId: true, lastReadAt: true },
  });

  return updated;
}

// ---------------------------------------------------------------------------
// Group management
// ---------------------------------------------------------------------------

export async function createGroup(
  creatorId: string,
  data: CreateGroupInput,
): Promise<{ id: string; name: string | null; isDirect: boolean; memberCount: number }> {
  // Validate all member IDs
  for (const mid of data.memberIds) {
    assertValidObjectId(mid, 'User');
  }
  if (data.memberIds.includes(creatorId)) {
    throw new ValidationError('Creator is automatically a member — do not include in memberIds');
  }

  // Verify all users exist
  const users = await prisma.user.findMany({
    where: { id: { in: data.memberIds } },
    select: { id: true, isActive: true },
  });
  if (users.length !== data.memberIds.length) {
    throw new NotFoundError('One or more members not found');
  }
  const inactive = users.filter((u) => !u.isActive);
  if (inactive.length > 0) {
    throw new ValidationError('One or more members are inactive');
  }

  const group = await prisma.messageGroup.create({
    data: {
      name: data.name,
      isDirect: false,
      members: {
        create: [
          { userId: creatorId },
          ...data.memberIds.map((uid) => ({ userId: uid })),
        ],
      },
    },
    include: { _count: { select: { members: true } } },
  });

  return {
    id: group.id,
    name: group.name,
    isDirect: group.isDirect,
    memberCount: (group as any)._count?.members ?? 0,
  };
}
