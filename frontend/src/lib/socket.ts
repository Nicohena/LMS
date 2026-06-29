'use client';

import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from './auth-store';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';

let socket: Socket | null = null;

/**
 * Get the singleton Socket.io client. Connects on first call (with auth token
 * pulled from the auth store). Subsequent calls return the same instance.
 *
 * The backend reads the access token from `socket.handshake.auth.token` or
 * from the `accessToken` cookie. We pass it via `auth.token` so it works
 * even when cookies aren't being sent with the WebSocket handshake.
 */
export function getSocket(): Socket | null {
  if (typeof window === 'undefined') return null;
  if (socket) return socket;

  const token = useAuthStore.getState().accessToken || localStorage.getItem('accessToken');
  // If the persisted accessToken is the literal placeholder 'cookie-based',
  // fall back to reading the cookie directly (the backend supports both).
  let authToken: string | undefined = token ?? undefined;
  if (!authToken || authToken === 'cookie-based') {
    const m = document.cookie.match(/(?:^|;\s*)accessToken=([^;]+)/);
    authToken = m ? m[1] : undefined;
  }

  socket = io(SOCKET_URL, {
    path: '/socket.io/',
    auth: { token: authToken },
    withCredentials: true,
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });

  socket.on('connect', () => {
    // eslint-disable-next-line no-console
    console.log('[socket.io] connected:', socket?.id);
  });
  socket.on('disconnect', (reason) => {
    // eslint-disable-next-line no-console
    console.log('[socket.io] disconnected:', reason);
  });
  socket.on('connect_error', (err) => {
    // eslint-disable-next-line no-console
    console.warn('[socket.io] connect_error:', err.message);
  });

  return socket;
}

/**
 * Disconnect the socket and clear the singleton. Called on logout.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
