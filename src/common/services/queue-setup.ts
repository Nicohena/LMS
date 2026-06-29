// src/common/services/queue-setup.ts
//
// Queue registration module. Imported once at server startup so that
// `enqueue('progressQueue', ...)` and friends work without callers needing
// to register queues themselves.

import { registerQueue } from './queue.service';
import type { Job } from 'bullmq';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ProgressJobData {}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface EnrollmentJobData {}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface NotificationJobData {}

let initialized = false;

/**
 * Register all queues used by the app. Safe to call multiple times.
 */
export function setupQueues(): void {
  if (initialized) return;
  initialized = true;

  // Progress queue — recalculation, milestone events, etc.
  registerQueue<ProgressJobData>('progressQueue', async (job: Job<ProgressJobData>) => {
    // eslint-disable-next-line no-console
    console.log('[progressQueue] Processing job:', job.id, (job as any).data);
    // Placeholder — actual handlers (e.g., sending milestone notifications,
    // updating leaderboards) would live here.
    return;
  });

  // Enrollment queue — bulk enrollment post-processing, progress init
  registerQueue<EnrollmentJobData>('enrollmentQueue', async (job: Job<EnrollmentJobData>) => {
    // eslint-disable-next-line no-console
    console.log('[enrollmentQueue] Processing job:', job.id, (job as any).data);
    // Placeholder — e.g., initialize progress records, send welcome emails.
    return;
  });

  // Notification queue — emails, in-app notifications
  registerQueue<NotificationJobData>('notificationQueue', async (job: Job<NotificationJobData>) => {
    // eslint-disable-next-line no-console
    console.log('[notificationQueue] Processing job:', job.id, (job as any).data);
    // Placeholder — actual email/notification sending will be implemented in Step 8.
    return;
  });
}
