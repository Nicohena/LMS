// src/modules/reports/scheduled-report.service.ts
import { Prisma, ReportFrequency, ReportStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError, ForbiddenError, ValidationError } from '../../common/errors';
import { generateReport } from './report-builder.service';
import { sendEmail } from '../notifications/email.service';
import type { ScheduledReportResponse } from './report.types';
import type { ScheduleReportInput, UpdateScheduleInput } from './report.schemas';

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function createSchedule(userId: string, role: string, data: ScheduleReportInput): Promise<ScheduledReportResponse> {
  if (role !== 'ADMIN') throw new ForbiddenError('Only admins can schedule reports');

  // Validate template exists
  if (!OBJECT_ID_RE.test(data.templateId)) throw new NotFoundError('Template not found');
  const template = await prisma.reportTemplate.findUnique({ where: { id: data.templateId } });
  if (!template) throw new NotFoundError('Template not found');

  // Validate frequency-specific fields
  if (data.frequency === ReportFrequency.WEEKLY && data.dayOfWeek === undefined) {
    throw new ValidationError('dayOfWeek is required for WEEKLY frequency');
  }
  if (data.frequency === ReportFrequency.MONTHLY && data.dayOfMonth === undefined) {
    throw new ValidationError('dayOfMonth is required for MONTHLY frequency');
  }

  const nextRunAt = calculateNextRunAt(data.frequency, data.dayOfWeek, data.dayOfMonth, data.time);

  const schedule = await prisma.scheduledReport.create({
    data: {
      templateId: data.templateId,
      name: data.name,
      frequency: data.frequency,
      dayOfWeek: data.dayOfWeek,
      dayOfMonth: data.dayOfMonth,
      time: data.time,
      recipients: data.recipients as Prisma.InputJsonValue,
      format: data.format,
      isActive: data.isActive,
      nextRunAt,
      status: ReportStatus.SCHEDULED,
    },
  });

  return mapToResponse(schedule);
}

export async function getSchedules(userId: string, role: string): Promise<ScheduledReportResponse[]> {
  const where: Prisma.ScheduledReportWhereInput = {};
  // Non-admins see only schedules for templates they created
  if (role !== 'ADMIN') {
    where.template = { createdBy: userId };
  }
  const schedules = await prisma.scheduledReport.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
  return schedules.map(mapToResponse);
}

export async function updateSchedule(id: string, userId: string, role: string, data: UpdateScheduleInput): Promise<ScheduledReportResponse> {
  if (role !== 'ADMIN') throw new ForbiddenError('Only admins can update schedules');
  if (!OBJECT_ID_RE.test(id)) throw new NotFoundError('Schedule not found');
  const schedule = await prisma.scheduledReport.findUnique({ where: { id } });
  if (!schedule) throw new NotFoundError('Schedule not found');

  let nextRunAt = schedule.nextRunAt;
  if (data.frequency || data.dayOfWeek !== undefined || data.dayOfMonth !== undefined || data.time) {
    const freq = data.frequency ?? schedule.frequency;
    const dow = data.dayOfWeek !== undefined ? data.dayOfWeek : schedule.dayOfWeek;
    const dom = data.dayOfMonth !== undefined ? data.dayOfMonth : schedule.dayOfMonth;
    const time = data.time ?? schedule.time;
    nextRunAt = calculateNextRunAt(freq, dow ?? undefined, dom ?? undefined, time);
  }

  const updated = await prisma.scheduledReport.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.frequency !== undefined && { frequency: data.frequency }),
      ...(data.dayOfWeek !== undefined && { dayOfWeek: data.dayOfWeek }),
      ...(data.dayOfMonth !== undefined && { dayOfMonth: data.dayOfMonth }),
      ...(data.time !== undefined && { time: data.time }),
      ...(data.recipients !== undefined && { recipients: data.recipients as Prisma.InputJsonValue }),
      ...(data.format !== undefined && { format: data.format }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      nextRunAt,
    },
  });

  return mapToResponse(updated);
}

export async function deleteSchedule(id: string, role: string): Promise<{ id: string; deleted: boolean }> {
  if (role !== 'ADMIN') throw new ForbiddenError('Only admins can delete schedules');
  if (!OBJECT_ID_RE.test(id)) throw new NotFoundError('Schedule not found');
  const schedule = await prisma.scheduledReport.findUnique({ where: { id } });
  if (!schedule) throw new NotFoundError('Schedule not found');
  // Delete history first
  await prisma.reportHistory.deleteMany({ where: { scheduleId: id } });
  await prisma.scheduledReport.delete({ where: { id } });
  return { id, deleted: true };
}

// ---------------------------------------------------------------------------
// Trigger / process
// ---------------------------------------------------------------------------

export async function triggerScheduleNow(id: string, userId: string, role: string): Promise<{ id: string; status: string; historyId: string }> {
  if (role !== 'ADMIN') throw new ForbiddenError('Only admins can trigger scheduled reports');
  if (!OBJECT_ID_RE.test(id)) throw new NotFoundError('Schedule not found');
  const schedule = await prisma.scheduledReport.findUnique({
    where: { id },
    include: { template: true },
  });
  if (!schedule) throw new NotFoundError('Schedule not found');

  const historyId = await processScheduledReport(schedule.id);

  // Update lastRunAt + nextRunAt
  const nextRunAt = calculateNextRunAt(schedule.frequency, schedule.dayOfWeek ?? undefined, schedule.dayOfMonth ?? undefined, schedule.time);
  await prisma.scheduledReport.update({
    where: { id: schedule.id },
    data: { lastRunAt: new Date(), nextRunAt },
  });

  return { id: schedule.id, status: 'COMPLETED', historyId };
}

/**
 * Process a scheduled report: generate it, store in history, send email.
 * Returns the ReportHistory ID.
 */
export async function processScheduledReport(scheduleId: string): Promise<string> {
  const schedule = await prisma.scheduledReport.findUnique({
    where: { id: scheduleId },
    include: { template: true },
  });
  if (!schedule) throw new NotFoundError('Schedule not found');

  // Create history entry (PROCESSING)
  const history = await prisma.reportHistory.create({
    data: {
      scheduleId,
      status: ReportStatus.PROCESSING,
      recipients: schedule.recipients as Prisma.InputJsonValue,
      metadata: { templateName: schedule.template.name, frequency: schedule.frequency } as Prisma.InputJsonValue,
    },
  });

  try {
    // Generate the report (use template creator as the "user" for permission check)
    const result = await generateReport(
      schedule.templateId,
      schedule.template.createdBy,
      'ADMIN', // scheduled reports always run as admin
      schedule.template.filters as Record<string, unknown> | undefined,
      schedule.format,
    );

    // Send email to recipients
    const recipients = schedule.recipients as unknown as string[];
    for (const email of recipients) {
      await sendEmail({
        to: email,
        subject: `Scheduled Report: ${schedule.name}`,
        template: 'generic',
        data: {
          title: `Report: ${schedule.name}`,
          content: `Your scheduled report has been generated. Format: ${schedule.format}. Rows: ${result.rowCount}.`,
          link: result.downloadUrl,
        },
      }).catch((err) => {
        // eslint-disable-next-line no-console
        console.warn(`[scheduled-report] Email to ${email} failed:`, (err as Error).message);
      });
    }

    // Update history to COMPLETED
    await prisma.reportHistory.update({
      where: { id: history.id },
      data: {
        status: ReportStatus.COMPLETED,
        fileUrl: result.downloadUrl,
      },
    });

    return history.id;
  } catch (err) {
    // Update history to FAILED
    await prisma.reportHistory.update({
      where: { id: history.id },
      data: {
        status: ReportStatus.FAILED,
        errorMessage: (err as Error).message,
      },
    });
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function calculateNextRunAt(
  frequency: ReportFrequency,
  dayOfWeek: number | undefined,
  dayOfMonth: number | undefined,
  time: string,
): Date {
  const now = new Date();
  const [hours, minutes] = time.split(':').map(Number);
  const next = new Date(now);
  next.setHours(hours, minutes, 0, 0);

  switch (frequency) {
    case ReportFrequency.ONCE:
      // If time already passed today, schedule for tomorrow
      if (next <= now) next.setDate(next.getDate() + 1);
      break;
    case ReportFrequency.DAILY:
      // Next occurrence at the specified time
      if (next <= now) next.setDate(next.getDate() + 1);
      break;
    case ReportFrequency.WEEKLY: {
      if (dayOfWeek === undefined) throw new ValidationError('dayOfWeek required for WEEKLY');
      const currentDay = now.getDay();
      let daysUntil = (dayOfWeek - currentDay + 7) % 7;
      if (daysUntil === 0 && next <= now) daysUntil = 7;
      next.setDate(next.getDate() + daysUntil);
      break;
    }
    case ReportFrequency.MONTHLY: {
      if (dayOfMonth === undefined) throw new ValidationError('dayOfMonth required for MONTHLY');
      next.setDate(dayOfMonth);
      if (next <= now) next.setMonth(next.getMonth() + 1);
      break;
    }
    case ReportFrequency.QUARTERLY: {
      // Every 3 months
      next.setMonth(next.getMonth() + 3);
      if (next <= now) next.setMonth(next.getMonth() + 3);
      break;
    }
  }

  return next;
}

function mapToResponse(s: any): ScheduledReportResponse {
  return {
    id: s.id,
    templateId: s.templateId,
    name: s.name,
    frequency: s.frequency,
    nextRunAt: s.nextRunAt,
    lastRunAt: s.lastRunAt,
    isActive: s.isActive,
    format: s.format,
  };
}

// ---------------------------------------------------------------------------
// Cron-like processor — called by queue or scheduled job to process due reports
// ---------------------------------------------------------------------------

export async function processDueReports(): Promise<{ processed: number; failed: number }> {
  const now = new Date();
  const dueSchedules = await prisma.scheduledReport.findMany({
    where: {
      isActive: true,
      nextRunAt: { lte: now },
      status: ReportStatus.SCHEDULED,
    },
    select: { id: true },
  });

  let processed = 0;
  let failed = 0;
  for (const s of dueSchedules) {
    try {
      await processScheduledReport(s.id);
      processed++;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`[scheduled-reports] Failed to process ${s.id}:`, (err as Error).message);
      failed++;
    }
  }

  return { processed, failed };
}
