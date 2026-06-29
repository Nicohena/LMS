// src/common/services/queue-setup.ts
//
// Queue registration module. Imported once at server startup so that
// `enqueue('progressQueue', ...)` and friends work without callers needing
// to register queues themselves.

import { registerQueue } from './queue.service';
import type { Job } from 'bullmq';
import { sendEmailImmediate, type SendEmailParams } from '../../modules/notifications/email.service';

let initialized = false;

/**
 * Register all queues used by the app. Safe to call multiple times.
 */
export function setupQueues(): void {
  if (initialized) return;
  initialized = true;

  // Progress queue — recalculation, milestone events, etc.
  registerQueue<unknown>('progressQueue', async (job: Job) => {
    // eslint-disable-next-line no-console
    console.log('[progressQueue] Processing job:', job.id, (job as any).data);
    return;
  });

  // Enrollment queue — bulk enrollment post-processing, progress init
  registerQueue<unknown>('enrollmentQueue', async (job: Job) => {
    // eslint-disable-next-line no-console
    console.log('[enrollmentQueue] Processing job:', job.id, (job as any).data);
    return;
  });

  // Notification queue — in-app notification aggregation
  registerQueue<unknown>('notificationQueue', async (job: Job) => {
    // eslint-disable-next-line no-console
    console.log('[notificationQueue] Processing job:', job.id, (job as any).data);
    return;
  });

  // Email queue — async email sending via Nodemailer + Handlebars
  registerQueue<SendEmailParams>('emailQueue', async (job: Job<SendEmailParams>) => {
    const params = job.data;
    // eslint-disable-next-line no-console
    console.log(`[emailQueue] Sending email to ${params.to} (template: ${params.template})`);
    await sendEmailImmediate(params);
  });
}
