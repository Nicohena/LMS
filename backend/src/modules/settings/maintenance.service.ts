// src/modules/settings/maintenance.service.ts
import { prisma } from '../../lib/prisma';
import { cacheDelete } from '../../common/services/cache.service';
import type { MaintenanceStatusResponse } from './setting.types';
import type { EnableMaintenanceInput } from './setting.schemas';

/**
 * Enable maintenance mode with a custom message + IP whitelist.
 */
export async function enableMaintenance(data: EnableMaintenanceInput, userId: string): Promise<MaintenanceStatusResponse> {
  await prisma.platformSetting.update({
    where: { key: 'maintenanceMode' },
    data: { value: true as any, updatedBy: userId },
  });
  await prisma.platformSetting.update({
    where: { key: 'maintenanceMessage' },
    data: { value: data.message as any, updatedBy: userId },
  });
  await prisma.platformSetting.update({
    where: { key: 'maintenanceWhitelist' },
    data: { value: data.whitelist as any, updatedBy: userId },
  });

  // Invalidate cache
  await cacheDelete('setting:maintenanceMode');
  await cacheDelete('setting:maintenanceMessage');
  await cacheDelete('setting:maintenanceWhitelist');

  return {
    enabled: true,
    message: data.message,
    whitelist: data.whitelist,
  };
}

/**
 * Disable maintenance mode.
 */
export async function disableMaintenance(userId: string): Promise<MaintenanceStatusResponse> {
  await prisma.platformSetting.update({
    where: { key: 'maintenanceMode' },
    data: { value: false as any, updatedBy: userId },
  });

  await cacheDelete('setting:maintenanceMode');

  return {
    enabled: false,
    message: null,
    whitelist: [],
  };
}

/**
 * Check if maintenance mode is enabled. Uses cached settings for performance.
 */
export async function isMaintenanceMode(): Promise<boolean> {
  const { getSetting } = await import('./setting.service');
  const enabled = await getSetting<boolean>('maintenanceMode');
  return enabled === true;
}

/**
 * Get the current maintenance status.
 */
export async function getMaintenanceStatus(): Promise<MaintenanceStatusResponse> {
  const { getSetting } = await import('./setting.service');
  const enabled = await getSetting<boolean>('maintenanceMode');
  const message = await getSetting<string>('maintenanceMessage');
  const whitelist = await getSetting<string[]>('maintenanceWhitelist');

  return {
    enabled: enabled === true,
    message: message || null,
    whitelist: Array.isArray(whitelist) ? whitelist : [],
  };
}

/**
 * Check if a given IP is whitelisted for maintenance mode access.
 */
export function isIpWhitelisted(ip: string | undefined, whitelist: string[]): boolean {
  if (!ip || whitelist.length === 0) return false;
  return whitelist.includes(ip);
}
