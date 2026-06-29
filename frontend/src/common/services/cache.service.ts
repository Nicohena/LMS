// src/common/services/cache.service.ts
//
// Cache service with automatic Redis-OR-in-memory fallback.
//
// - If REDIS_HOST is set, uses Redis (production-grade, shared across instances)
// - Otherwise, falls back to an in-memory Map with TTL (single-instance only)
//
// The public API is identical regardless of backend, so callers don't need
// to know which is in use. Failures are logged but never thrown — caching
// must NEVER break the request flow.

import { createClient, type RedisClientType } from 'redis';

interface CacheEntry {
  value: string;
  expiresAt: number; // epoch ms; 0 = no expiry
}

const memoryStore = new Map<string, CacheEntry>();

let redisClient: RedisClientType | null = null;
let redisAvailable = false;
let redisConnectionAttempted = false;

function getRedisConfig() {
  const host = process.env.REDIS_HOST;
  if (!host) return null;
  return {
    url: `redis://${process.env.REDIS_PASSWORD ? `:${process.env.REDIS_PASSWORD}@` : ''}${host}:${process.env.REDIS_PORT || 6379}`,
  };
}

async function ensureRedisClient(): Promise<RedisClientType | null> {
  if (redisConnectionAttempted) return redisClient;
  redisConnectionAttempted = true;

  const config = getRedisConfig();
  if (!config) {
    // eslint-disable-next-line no-console
    console.log('[cache] REDIS_HOST not set — using in-memory cache');
    return null;
  }

  try {
    redisClient = createClient(config) as RedisClientType;
    redisClient.on('error', (err: Error) => {
      // eslint-disable-next-line no-console
      console.warn('[cache] Redis error — falling back to in-memory:', err.message);
      redisAvailable = false;
    });
    redisClient.on('connect', () => {
      // eslint-disable-next-line no-console
      console.log('[cache] Connected to Redis');
      redisAvailable = true;
    });
    await redisClient.connect();
    return redisClient;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[cache] Redis connection failed — using in-memory:', (err as Error).message);
    redisClient = null;
    redisAvailable = false;
    return null;
  }
}

// ---------------------------------------------------------------------------
// Memory store helpers
// ---------------------------------------------------------------------------

function memoryGet(key: string): string | null {
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (entry.expiresAt > 0 && Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value;
}

function memorySet(key: string, value: string, ttlSeconds: number): void {
  const expiresAt = ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : 0;
  memoryStore.set(key, { value, expiresAt });
}

function memoryDel(prefix: string): number {
  let count = 0;
  for (const key of memoryStore.keys()) {
    if (key === prefix || key.startsWith(prefix + ':') || key.startsWith(prefix)) {
      memoryStore.delete(key);
      count++;
    }
  }
  return count;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get a cached value by key. Returns parsed JSON or null if not found.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const client = await ensureRedisClient();
    if (client && redisAvailable) {
      const value = await client.get(key);
      if (value === null) return null;
      return JSON.parse(value) as T;
    }
    const memValue = memoryGet(key);
    if (memValue === null) return null;
    return JSON.parse(memValue) as T;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[cache] get failed:', (err as Error).message);
    return null;
  }
}

/**
 * Set a cached value with a TTL (in seconds).
 */
export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  try {
    const serialized = JSON.stringify(value);
    const client = await ensureRedisClient();
    if (client && redisAvailable) {
      await client.set(key, serialized, { EX: ttlSeconds });
      return;
    }
    memorySet(key, serialized, ttlSeconds);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[cache] set failed:', (err as Error).message);
  }
}

/**
 * Delete a single key.
 */
export async function cacheDelete(key: string): Promise<void> {
  try {
    const client = await ensureRedisClient();
    if (client && redisAvailable) {
      await client.del(key);
      return;
    }
    memoryStore.delete(key);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[cache] delete failed:', (err as Error).message);
  }
}

/**
 * Delete all keys starting with the given prefix.
 * For Redis, uses SCAN to avoid blocking the server.
 */
export async function cacheDeleteByPrefix(prefix: string): Promise<void> {
  try {
    const client = await ensureRedisClient();
    if (client && redisAvailable) {
      // SCAN-based deletion. The redis package's scan() takes the cursor as
      // a string and returns { cursor: number, keys: string[] }.
      let cursor = '0';
      do {
        const reply = await client.scan(cursor, { MATCH: `${prefix}*`, COUNT: 100 });
        cursor = String(reply.cursor);
        if (reply.keys.length > 0) {
          await client.del(reply.keys);
        }
      } while (cursor !== '0');
      return;
    }
    memoryDel(prefix);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[cache] deleteByPrefix failed:', (err as Error).message);
  }
}

/** Returns true if Redis is connected (false = using in-memory fallback). */
export function isRedisAvailable(): boolean {
  return redisAvailable;
}

/** Gracefully close the Redis connection (called on shutdown). */
export async function closeCache(): Promise<void> {
  if (redisClient && redisAvailable) {
    try {
      await redisClient.quit();
    } catch {
      // ignore
    }
  }
  memoryStore.clear();
}
