// src/modules/settings/setting.types.ts
import type { AcademicYear, AcademicYearStatus, EmailTemplate, GradingScale, PlatformSetting } from '@prisma/client';

export type PlatformSettingResponse = PlatformSetting;
export type EmailTemplateResponse = EmailTemplate;
export type GradingScaleResponse = GradingScale;
export type AcademicYearResponse = AcademicYear;

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: { status: 'up' | 'down'; latency?: number; error?: string };
    redis: { status: 'up' | 'down' | 'not-configured'; error?: string };
    cloudinary: { status: 'up' | 'down' | 'not-configured'; error?: string };
    email: { status: 'up' | 'down' | 'not-configured'; error?: string };
    queue: { status: 'up' | 'down' | 'not-configured'; error?: string };
  };
}

export interface SystemInfoResponse {
  uptime: number;
  memory: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  cpu: {
    user: number;
    system: number;
  };
  nodeVersion: string;
  platform: string;
  pid: number;
  timestamp: string;
}

export interface MaintenanceStatusResponse {
  enabled: boolean;
  message: string | null;
  whitelist: string[];
}

export interface ConvertScoreResult {
  inputScore: number;
  letter: string;
  description?: string;
  gpa?: number;
  scaleName: string;
}
