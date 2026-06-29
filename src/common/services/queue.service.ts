// src/common/services/queue.service.ts
//
// Background-job queue with Redis-OR-sync fallback.
//
// - If REDIS_HOST is set, uses BullMQ backed by Redis (production-grade,
//   distributed, retryable jobs)
// - Otherwise, runs jobs synchronously (immediately, in the same process)
//
// The public API is identical regardless of backend.

import { Queue, Worker, type Job, type QueueEvents } from 'bullmq';
import IORedis from 'ioredis';

// ---------------------------------------------------------------------------
// Redis connection
// ---------------------------------------------------------------------------

let connection: IORedis | null = null;
let connectionAttempted = false;
let redisAvailable = false;

function getRedisConnection(): IORedis | null {
  if (connectionAttempted) return connection;
  connectionAttempted = true;

  const host = process.env.REDIS_HOST;
  if (!host) {
    // eslint-disable-next-line no-console
    console.log('[queue] REDIS_HOST not set — jobs will run synchronously');
    return null;
  }

  try {
    connection = new IORedis({
      host,
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null, // BullMQ requires this
      enableReadyCheck: true,
      lazyConnect: false,
      retryStrategy: (times) => Math.min(times * 1000, 5000),
    });

    connection.on('connect', () => {
      // eslint-disable-next-line no-console
      console.log('[queue] Connected to Redis');
      redisAvailable = true;
    });
    connection.on('error', (err: Error) => {
      // eslint-disable-next-line no-console
      console.warn('[queue] Redis error — jobs will run synchronously:', err.message);
      redisAvailable = false;
    });

    return connection;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[queue] Redis connection failed — using sync mode:', (err as Error).message);
    connection = null;
    return null;
  }
}

// ---------------------------------------------------------------------------
// Queue registry
// ---------------------------------------------------------------------------

interface QueueDefinition<T = unknown> {
  name: string;
  handler: (job: Job<T>) => Promise<unknown>;
}

const queueDefinitions = new Map<string, QueueDefinition>();
const queues = new Map<string, Queue>();
const workers = new Map<string, Worker>();

/**
 * Register a queue with its handler.
 *
 * - In Redis mode: creates a BullMQ Queue + Worker that processes jobs asynchronously
 * - In sync mode: stores the handler to be called immediately when `enqueue` is invoked
 */
export function registerQueue<T>(
  name: string,
  handler: (job: Job<T>) => Promise<unknown>,
): void {
  if (queueDefinitions.has(name)) {
    return; // already registered
  }
  queueDefinitions.set(name, { name, handler: handler as (job: Job) => Promise<unknown> });

  const conn = getRedisConnection();
  if (conn && redisAvailable) {
    // BullMQ bundles its own copy of ioredis; cast to avoid version-mismatch
    // type errors between the top-level ioredis and bullmq's nested one.
    const connection = conn as unknown as any;
    const queue = new Queue(name, { connection });
    const worker = new Worker(name, handler, { connection });
    queues.set(name, queue);
    workers.set(name, worker);
    // eslint-disable-next-line no-console
    console.log(`[queue] Registered "${name}" (BullMQ + Redis)`);
  } else {
    // eslint-disable-next-line no-console
    console.log(`[queue] Registered "${name}" (sync fallback)`);
  }
}

/**
 * Enqueue a job.
 *
 * - In Redis mode: adds to the BullMQ queue (processed asynchronously by the Worker)
 * - In sync mode: runs the handler immediately and returns the result
 */
export async function enqueue<T>(
  queueName: string,
  data: T,
  options?: { delayMs?: number; attempts?: number },
): Promise<void> {
  const def = queueDefinitions.get(queueName);
  if (!def) {
    throw new Error(`Queue "${queueName}" is not registered`);
  }

  const queue = queues.get(queueName);
  if (queue) {
    // Redis mode
    await queue.add('default', data, {
      delay: options?.delayMs,
      attempts: options?.attempts ?? 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
    return;
  }

  // Sync mode — run immediately (don't await, let it run in the background)
  // but catch errors so they don't crash the process.
  Promise.resolve()
    .then(() => {
      // Construct a minimal Job-like object for the handler
      const fakeJob: Job<T> = {
        id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: 'default',
        data,
        opts: { attempts: options?.attempts ?? 1 },
        attemptsMade: 0,
        progress: 0,
        returnvalue: undefined,
        stacktrace: [],
        timestamp: Date.now(),
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        update: async (_d: Partial<T>) => {},
        updateProgress: async (_p: number | object) => {},
        log: async (_row: string) => {},
        moveToCompleted: async () => {},
        moveToFailed: async () => {},
        discard: async () => {},
        retry: async () => {},
        promote: async () => {},
        remove: async () => {},
      } as unknown as Job<T>;
      return def.handler(fakeJob);
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error(`[queue] Sync job in "${queueName}" failed:`, err);
    });
}

/**
 * Gracefully close all queues/workers (called on shutdown).
 */
export async function closeQueues(): Promise<void> {
  for (const worker of workers.values()) {
    try {
      await worker.close();
    } catch {
      // ignore
    }
  }
  for (const queue of queues.values()) {
    try {
      await queue.close();
    } catch {
      // ignore
    }
  }
  if (connection) {
    try {
      await connection.quit();
    } catch {
      // ignore
    }
  }
}

/** Returns true if Redis-backed queues are active. */
export function isQueueRedisBacked(): boolean {
  return redisAvailable;
}
