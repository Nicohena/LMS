import dotenv from 'dotenv';
import app from './app';
import { prisma } from './lib/prisma';

// Load environment variables from .env (override any pre-set env to ensure
// the project's .env wins — important in shared/dev environments).
dotenv.config({ override: true });

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
  try {
    await prisma.$disconnect();
    // eslint-disable-next-line no-console
    console.log('Prisma disconnected.');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Error disconnecting Prisma:', e);
  }
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

  // Force-close after 10s if connections hang
  setTimeout(() => {
    // eslint-disable-next-line no-console
    console.error('Forcing shutdown after timeout.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
