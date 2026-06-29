import dotenv from 'dotenv';
import { createServer } from 'node:http';
import app from './app';
import { prisma } from './lib/prisma';
import { setupQueues } from './common/services/queue-setup';
import { closeQueues } from './common/services/queue.service';
import { closeCache } from './common/services/cache.service';
import { initSocketIO, closeSocketIO } from './socket';
import { initGamificationEvents } from './modules/gamification/event-listener.service';
import { seedDefaults as seedXPDefaults } from './modules/gamification/xp.service';

// Load environment variables from .env (override any pre-set env to ensure
// the project's .env wins — important in shared/dev environments).
dotenv.config({ override: true });

// Register background-job queues (BullMQ if Redis is configured, sync fallback otherwise).
setupQueues();

// Initialize gamification event listeners + seed default XP rules / level thresholds.
initGamificationEvents();
seedXPDefaults().catch((err) => console.error('[xp] Failed to seed defaults:', err));

const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Create a single HTTP server that both Express and Socket.io attach to.
const server = createServer(app);

// Initialize Socket.io on the same HTTP server (so /socket.io/ and /api/v1/*
// share the same port — simpler for dev + reverse-proxy-friendly for prod).
initSocketIO(server);

server.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 LMS Backend running in ${process.env.NODE_ENV ?? 'development'} mode`);
  // eslint-disable-next-line no-console
  console.log(`   HTTP + Socket.io: http://localhost:${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`   Health check:     http://localhost:${PORT}/api/v1/health`);
  // eslint-disable-next-line no-console
  console.log(`   Socket.io path:   ws://localhost:${PORT}/socket.io/`);
});

// --- Graceful shutdown ---
async function shutdown(signal: string) {
  // eslint-disable-next-line no-console
  console.log(`\n${signal} received. Shutting down gracefully...`);

  // Stop accepting new connections
  server.close((err) => {
    if (err) {
      // eslint-disable-next-line no-console
      console.error('Error during server close:', err);
      process.exit(1);
    }
    // eslint-disable-next-line no-console
    console.log('HTTP server closed. Process exiting.');
    process.exit(0);
  });

  // Close Socket.io + Redis adapter
  try {
    await closeSocketIO();
    // eslint-disable-next-line no-console
    console.log('Socket.io closed.');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Error closing Socket.io:', e);
  }

  // Close background-job queues
  try {
    await closeQueues();
    // eslint-disable-next-line no-console
    console.log('Queues closed.');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Error closing queues:', e);
  }

  // Close cache
  try {
    await closeCache();
    // eslint-disable-next-line no-console
    console.log('Cache closed.');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Error closing cache:', e);
  }

  // Disconnect Prisma
  try {
    await prisma.$disconnect();
    // eslint-disable-next-line no-console
    console.log('Prisma disconnected.');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Error disconnecting Prisma:', e);
  }

  // Force-close after 10s if anything hangs
  setTimeout(() => {
    // eslint-disable-next-line no-console
    console.error('Forcing shutdown after timeout.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
