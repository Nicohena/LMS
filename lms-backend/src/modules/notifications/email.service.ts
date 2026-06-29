// src/modules/notifications/email.service.ts
//
// Email service backed by Nodemailer + Handlebars templates, with BullMQ
// for async sending (falls back to sync send if Redis/queue not available).
//
// If SMTP_* env vars are not set, emails are logged to the console instead
// (useful for development).

import nodemailer, { type Transporter } from 'nodemailer';
import handlebars from 'handlebars';
import { enqueue } from '../../common/services/queue.service';
import { prisma } from '../../lib/prisma';
import type { NotificationType } from '@prisma/client';

// ---------------------------------------------------------------------------
// Transport setup
// ---------------------------------------------------------------------------

let transporter: Transporter | null = null;
let transporterConfigured = false;

function getTransporter(): Transporter | null {
  if (transporterConfigured) return transporter;
  transporterConfigured = true;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port) {
    // eslint-disable-next-line no-console
    console.log('[email] SMTP_HOST/SMTP_PORT not set — emails will be logged to console');
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465,
      auth: user && pass ? { user, pass } : undefined,
    });
    // eslint-disable-next-line no-console
    console.log('[email] SMTP transporter configured');
    return transporter;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[email] SMTP setup failed — emails will be logged to console:', (err as Error).message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Handlebars templates (inline — for production, move to /templates/*.hbs files)
// ---------------------------------------------------------------------------

const templates: Record<string, string> = {
  welcome: `<h1>Welcome to LMS, {{firstName}}!</h1><p>Your account has been created. You can now log in and start learning.</p><p>Email: {{email}}</p>`,
  passwordReset: `<h1>Password Reset</h1><p>You requested a password reset. Click the link below to reset your password:</p><p><a href="{{resetLink}}">Reset Password</a></p><p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>`,
  assignmentGraded: `<h1>Assignment Graded: {{assignmentTitle}}</h1><p>Your submission has been graded.</p><p><strong>Grade:</strong> {{grade}}/{{maxGrade}}</p><p><strong>Feedback:</strong> {{feedback}}</p><p><a href="{{link}}">View Details</a></p>`,
  quizGraded: `<h1>Quiz Graded: {{quizTitle}}</h1><p>Your quiz attempt has been graded.</p><p><strong>Score:</strong> {{scorePercentage}}%</p><p><strong>Status:</strong> {{#if passed}}Passed{{else}}Not Passed{{/if}}</p><p><a href="{{link}}">View Results</a></p>`,
  announcement: `<h1>{{title}}</h1><p>{{priority}}</p><div>{{{content}}}</div><p><a href="{{link}}">View in LMS</a></p>`,
  assignmentPosted: `<h1>New Assignment: {{assignmentTitle}}</h1><p>A new assignment has been posted in {{courseTitle}}.</p><p><strong>Due:</strong> {{dueDate}}</p><p><a href="{{link}}">View Assignment</a></p>`,
  enrollmentConfirmation: `<h1>Enrollment Confirmed</h1><p>You've been enrolled in <strong>{{courseTitle}}</strong>.</p><p><a href="{{link}}">Start Learning</a></p>`,
  peerReviewAssigned: `<h1>Peer Review Assigned</h1><p>You've been assigned to review {{reviewCount}} submission(s) for {{assignmentTitle}}.</p><p><a href="{{link}}">Start Reviewing</a></p>`,
  generic: `<h1>{{title}}</h1><div>{{{content}}}</div>{{#if link}}<p><a href="{{link}}">View in LMS</a></p>{{/if}}`,
};

const compiledTemplates: Record<string, ReturnType<typeof handlebars.compile>> = {};
for (const [name, src] of Object.entries(templates)) {
  compiledTemplates[name] = handlebars.compile(src);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface SendEmailParams {
  to: string;
  subject: string;
  template: string; // template name
  data: Record<string, unknown>;
}

/**
 * Send an email immediately (synchronously). Returns true on success.
 * If SMTP not configured, logs to console and returns true.
 */
export async function sendEmailImmediate(params: SendEmailParams): Promise<boolean> {
  const tpl = compiledTemplates[params.template];
  if (!tpl) {
    // eslint-disable-next-line no-console
    console.error(`[email] Unknown template: ${params.template}`);
    return false;
  }

  const html = tpl(params.data);
  const transport = getTransporter();

  if (!transport) {
    // Dev mode — log to console
    // eslint-disable-next-line no-console
    console.log(`[email:dev] To: ${params.to} | Subject: ${params.subject}\n${html}\n---`);
    return true;
  }

  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM || 'LMS <noreply@lms.local>',
      to: params.to,
      subject: params.subject,
      html,
    });
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[email] Send failed:', (err as Error).message);
    return false;
  }
}

/**
 * Queue an email for async sending via BullMQ. Falls back to sync send
 * if the queue is not available (Redis not configured).
 */
export async function sendEmail(params: SendEmailParams): Promise<void> {
  try {
    await enqueue('emailQueue', params);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[email] Queue failed, sending sync:', (err as Error).message);
    await sendEmailImmediate(params);
  }
}

/**
 * Send a notification email to a user based on notification type.
 * Looks up the user's email + checks preferences before sending.
 */
export async function sendNotificationEmail(
  userId: string,
  type: NotificationType,
  data: {
    title: string;
    content: string;
    link?: string;
    [key: string]: unknown;
  },
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, firstName: true, notificationPrefs: { where: { type, channel: 'EMAIL' } } },
  });
  if (!user) return;

  // Check if user has email notifications enabled for this type
  const pref = user.notificationPrefs[0];
  if (pref && !pref.enabled) return;

  // Quiet hours check
  if (pref && (pref.quietHoursStart || pref.quietHoursEnd)) {
    if (isInQuietHours(pref.quietHoursStart, pref.quietHoursEnd)) return;
  }

  // Map notification type to template
  const templateMap: Partial<Record<NotificationType, string>> = {
    ENROLLMENT: 'enrollmentConfirmation',
    ASSIGNMENT_POSTED: 'assignmentPosted',
    ASSIGNMENT_GRADED: 'assignmentGraded',
    QUIZ_GRADED: 'quizGraded',
    ANNOUNCEMENT: 'announcement',
    PEER_REVIEW_ASSIGNED: 'peerReviewAssigned',
  };
  const template = templateMap[type] || 'generic';

  await sendEmail({
    to: user.email,
    subject: data.title,
    template,
    data: { ...data, firstName: user.firstName },
  });
}

/**
 * Check if the current time is within the user's quiet hours.
 * Times are in HH:MM format (24-hour).
 */
function isInQuietHours(start: string | null | undefined, end: string | null | undefined): boolean {
  if (!start || !end) return false;
  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;

  // Handle overnight quiet hours (e.g., 22:00 - 07:00)
  if (startMin > endMin) {
    return currentMin >= startMin || currentMin < endMin;
  }
  return currentMin >= startMin && currentMin < endMin;
}
