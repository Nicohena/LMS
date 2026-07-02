// src/socket/index.ts
//
// Socket.io server with JWT auth + Redis adapter for horizontal scaling.
//
// Events:
//   Client -> Server:
//     join          — join user/group rooms
//     send_message  — send a direct/group message
//     typing        — emit typing status
//     message_read  — mark messages as read
//   Server -> Client:
//     notification  — push real-time notification
//     message       — push new message
//     typing        — push typing status
//     message_read  — push read receipt

import { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer, type Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import IORedis from 'ioredis';
import { verifyAccessToken } from '../common/utils/jwt.utils';

let io: SocketIOServer | null = null;
let pubClient: IORedis | null = null;
let subClient: IORedis | null = null;

export function getIO(): SocketIOServer | null {
  return io;
}

/**
 * Initialize the Socket.io server attached to the given HTTP server.
 * Safe to call multiple times (no-op after first).
 */
export function initSocketIO(server: HttpServer): SocketIOServer {
  if (io) return io;

  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
    },
    path: '/socket.io/',
  });

  // --- Redis adapter (for horizontal scaling across multiple instances) ---
  const redisHost = process.env.REDIS_HOST;
  if (redisHost) {
    try {
      pubClient = new IORedis({
        host: redisHost,
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
      });
      subClient = pubClient.duplicate();
      io.adapter(createAdapter(pubClient, subClient));
      // eslint-disable-next-line no-console
      console.log('[socket.io] Redis adapter enabled');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[socket.io] Redis adapter failed, using in-memory:', (err as Error).message);
    }
  } else {
    // eslint-disable-next-line no-console
    console.log('[socket.io] REDIS_HOST not set — using in-memory adapter (single-instance only)');
  }

  // --- Auth middleware ---
  io.use((socket: Socket, next) => {
    // Token can come from auth handshake or cookie
    const token =
      (socket.handshake.auth?.token as string | undefined) ||
      (socket.handshake.headers?.cookie as string | undefined);

    let accessToken: string | undefined;
    if (token && token.startsWith('accessToken=')) {
      accessToken = token.replace('accessToken=', '');
    } else if (token) {
      accessToken = token;
    }

    if (!accessToken) {
      // Allow anonymous connections (for public read-only features)
      return next();
    }

    try {
      const payload = verifyAccessToken(accessToken);
      socket.data.userId = payload.sub;
      socket.data.email = payload.email;
      socket.data.role = payload.role;
      next();
    } catch {
      // Invalid token — allow connection but without user context
      next();
    }
  });

  // --- Connection handler ---
  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as string | undefined;

    if (userId) {
      // Join the user's personal room (for direct notifications/messages)
      socket.join(`user:${userId}`);
      // eslint-disable-next-line no-console
      console.log(`[socket.io] User connected: ${userId} (socket ${socket.id})`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`[socket.io] Anonymous connected: ${socket.id}`);
    }

    // --- Join a group room ---
    socket.on('join', (groupId: string) => {
      if (typeof groupId !== 'string') return;
      socket.join(`group:${groupId}`);
    });

    // --- Leave a group room ---
    socket.on('leave', (groupId: string) => {
      if (typeof groupId !== 'string') return;
      socket.leave(`group:${groupId}`);
    });

    // --- Typing indicator ---
    socket.on('typing', (data: { groupId: string; isTyping: boolean }) => {
      if (!data || typeof data.groupId !== 'string') return;
      socket.to(`group:${data.groupId}`).emit('typing', {
        userId,
        groupId: data.groupId,
        isTyping: data.isTyping,
      });
    });

    // --- Message read ---
    socket.on('message_read', (data: { groupId: string }) => {
      if (!data || typeof data.groupId !== 'string') return;
      socket.to(`group:${data.groupId}`).emit('message_read', {
        userId,
        groupId: data.groupId,
        readAt: new Date().toISOString(),
      });
    });

    // --- Disconnect ---
    socket.on('disconnect', () => {
      if (userId) {
        // eslint-disable-next-line no-console
        console.log(`[socket.io] User disconnected: ${userId} (socket ${socket.id})`);
      }
    });
  });

  return io;
}

/**
 * Push a real-time notification to a user (if connected).
 * Called by the notification service after creating a notification.
 */
export function pushNotification(userId: string, notification: unknown): void {
  if (!io) return;
  io.to(`user:${userId}`).emit('notification', notification);
}

/**
 * Push a real-time message to a user or group.
 */
export function pushMessage(targetUserId: string | null, groupId: string | null, message: unknown): void {
  if (!io) return;
  if (targetUserId) {
    io.to(`user:${targetUserId}`).emit('message', message);
  }
  if (groupId) {
    io.to(`group:${groupId}`).emit('message', message);
  }
}

/**
 * Gracefully close the Socket.io server + Redis connections.
 */
export async function closeSocketIO(): Promise<void> {
  if (io) {
    try {
      await io.close();
    } catch {
      // ignore
    }
    io = null;
  }
  if (pubClient) {
    try { await pubClient.quit(); } catch { /* ignore */ }
    pubClient = null;
  }
  if (subClient) {
    try { await subClient.quit(); } catch { /* ignore */ }
    subClient = null;
  }
}
