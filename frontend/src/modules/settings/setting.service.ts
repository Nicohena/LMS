// src/modules/settings/setting.service.ts
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { cacheGet, cacheSet, cacheDelete } from '../../common/services/cache.service';
import type { PlatformSettingResponse } from './setting.types';
import type { UpdateSettingInput } from './setting.schemas';

const CACHE_PREFIX = 'setting:';
const CACHE_TTL = 10 * 60; // 10 minutes

// Default settings seeded on first run
const DEFAULT_SETTINGS: Array<{ key: string; value: any; category: string; description?: string }> = [
  { key: 'siteName', value: 'LMS Platform', category: 'general', description: 'Platform display name' },
  { key: 'supportEmail', value: 'support@lms.local', category: 'general', description: 'Support contact email' },
  { key: 'allowRegistration', value: true, category: 'auth', description: 'Allow new user self-registration' },
  { key: 'defaultRole', value: 'STUDENT', category: 'auth', description: 'Default role for new registrations' },
  { key: 'passwordMinLength', value: 6, category: 'security', description: 'Minimum password length' },
  { key: 'passwordRequireUppercase', value: false, category: 'security', description: 'Require uppercase in passwords' },
  { key: 'passwordRequireNumbers', value: false, category: 'security', description: 'Require numbers in passwords' },
  { key: 'passwordRequireSymbols', value: false, category: 'security', description: 'Require symbols in passwords' },
  { key: 'jwtAccessExpiry', value: '15m', category: 'security', description: 'JWT access token expiry' },
  { key: 'jwtRefreshExpiry', value: '7d', category: 'security', description: 'JWT refresh token expiry' },
  { key: 'enable2FA', value: false, category: 'security', description: 'Enable two-factor authentication' },
  { key: 'maxLoginAttempts', value: 5, category: 'security', description: 'Max failed login attempts before lockout' },
  { key: 'maintenanceMode', value: false, category: 'general', description: 'Is platform in maintenance mode?' },
  { key: 'maintenanceMessage', value: 'Platform is under maintenance.', category: 'general', description: 'Message shown during maintenance' },
  { key: 'maintenanceWhitelist', value: [], category: 'general', description: 'IPs allowed during maintenance' },
  { key: 'auditLogRetentionDays', value: 90, category: 'general', description: 'Days to retain audit logs' },
];

/**
 * Seed default settings if they don't exist. Called on server startup.
 */
export async function seedDefaultSettings(): Promise<void> {
  const count = await prisma.platformSetting.count();
  if (count > 0) return;

  await prisma.platformSetting.createMany({
    data: DEFAULT_SETTINGS.map((s) => ({
      key: s.key,
      value: s.value as Prisma.InputJsonValue,
      category: s.category,
      description: s.description,
    })),
  });
  // eslint-disable-next-line no-console
  console.log('[settings] Seeded default platform settings');
}

// ---------------------------------------------------------------------------
// Get settings
// ---------------------------------------------------------------------------

export async function getSetting<T = unknown>(key: string): Promise<T | null> {
  // Try cache first
  const cached = await cacheGet<T>(`${CACHE_PREFIX}${key}`);
  if (cached !== null) return cached;

  const setting = await prisma.platformSetting.findUnique({ where: { key } });
  if (!setting) return null;

  const value = setting.value as T;
  await cacheSet(`${CACHE_PREFIX}${key}`, value, CACHE_TTL);
  return value;
}

export async function getSettings(category?: string): Promise<PlatformSettingResponse[]> {
  const where: Prisma.PlatformSettingWhereInput = {};
  if (category) where.category = category;

  return prisma.platformSetting.findMany({
    where,
    orderBy: { category: 'asc' },
  });
}

// ---------------------------------------------------------------------------
// Update setting
// ---------------------------------------------------------------------------

export async function updateSetting(key: string, value: unknown, userId: string, category?: string, description?: string): Promise<PlatformSettingResponse> {
  const existing = await prisma.platformSetting.findUnique({ where: { key } });

  if (existing) {
    const updated = await prisma.platformSetting.update({
      where: { key },
      data: {
        value: value as Prisma.InputJsonValue,
        ...(category && { category }),
        ...(description !== undefined && { description }),
        updatedBy: userId,
      },
    });
    await cacheDelete(`${CACHE_PREFIX}${key}`);
    return updated;
  }

  // Create new setting
  const created = await prisma.platformSetting.create({
    data: {
      key,
      value: value as Prisma.InputJsonValue,
      category: category || 'general',
      description,
      updatedBy: userId,
    },
  });
  await cacheSet(`${CACHE_PREFIX}${key}`, value, CACHE_TTL);
  return created;
}

export async function batchUpdateSettings(settings: UpdateSettingInput[], userId: string): Promise<number> {
  let count = 0;
  for (const s of settings) {
    await updateSetting(s.key, s.value, userId, s.category, s.description);
    count++;
  }
  return count;
}
