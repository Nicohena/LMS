// src/modules/settings/health.service.ts
import { prisma } from '../../lib/prisma';
import { isCloudinaryConfigured } from '../../common/services/upload.service';
import { isRedisAvailable } from '../../common/services/cache.service';
import { isQueueRedisBacked } from '../../common/services/queue.service';
import type { HealthCheckResponse, SystemInfoResponse } from './setting.types';

/**
 * Check health of all platform services.
 */
export async function checkHealth(): Promise<HealthCheckResponse> {
  const services: HealthCheckResponse['services'] = {
    database: { status: 'down' },
    redis: { status: 'not-configured' },
    cloudinary: { status: 'not-configured' },
    email: { status: 'not-configured' },
    queue: { status: 'not-configured' },
  };

  // Database check
  try {
    const start = Date.now();
    await prisma.$runCommandRaw({ ping: 1 });
    services.database = { status: 'up', latency: Date.now() - start };
  } catch (err) {
    services.database = { status: 'down', error: (err as Error).message };
  }

  // Redis check
  if (isRedisAvailable()) {
    services.redis = { status: 'up' };
  } else if (process.env.REDIS_HOST) {
    services.redis = { status: 'down', error: 'Configured but not connected' };
  }

  // Cloudinary check
  if (isCloudinaryConfigured()) {
    services.cloudinary = { status: 'up' };
  } else if (process.env.CLOUDINARY_CLOUD_NAME) {
    services.cloudinary = { status: 'down', error: 'Configured but not initialized' };
  }

  // Email check
  if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
    services.email = { status: 'up' };
  }

  // Queue check
  if (isQueueRedisBacked()) {
    services.queue = { status: 'up' };
  } else if (process.env.REDIS_HOST) {
    services.queue = { status: 'down', error: 'Configured but not connected' };
  }

  // Overall status
  const allUp = Object.values(services).every((s) => s.status === 'up' || s.status === 'not-configured');
  const anyDown = Object.values(services).some((s) => s.status === 'down');

  const status: HealthCheckResponse['status'] = anyDown ? 'unhealthy' : allUp ? 'healthy' : 'degraded';

  return {
    status,
    timestamp: new Date().toISOString(),
    services,
  };
}

/**
 * Get detailed system information (admin only).
 */
export function getSystemInfo(): SystemInfoResponse {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  return {
    uptime: process.uptime(),
    memory: {
      rss: memUsage.rss,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system,
    },
    nodeVersion: process.version,
    platform: process.platform,
    pid: process.pid,
    timestamp: new Date().toISOString(),
  };
}
