import dotenv from 'dotenv';
import app from './app';
import { prisma } from './lib/prisma';
import { setupQueues } from './common/services/queue-setup';
import { closeQueues } from './common/services/queue.service';
import { closeCache } from './common/services/cache.service';

// Load environment variables from .env (override any pre-set env to ensure
// the project's .env wins — important in shared/dev environments).
dotenv.config({ override: true });

// Register background-job queues (BullMQ if Redis is configured, sync fallback otherwise).
setupQueues();

const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 LMS Backend running in ${process.env.NODE_ENV ?? 'development'} mode`);
  // eslint-disable-next-line no-console
  console.log(`   Health check: http://localhost:${PORT}/api/v1/health`);
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
    console.log('Server closed. Process exiting.');
    process.exit(0);
  });

  // Close background-job queues (stop workers, disconnect from Redis)
  try {
    await closeQueues();
    // eslint-disable-next-line no-console
    console.log('Queues closed.');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Error closing queues:', e);
  }

  // Close cache (disconnect from Redis if connected)
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
