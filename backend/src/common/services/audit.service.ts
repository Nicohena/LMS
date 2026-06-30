// src/common/services/audit.service.ts
//
// Centralised audit-logging helper. Writes a record to the `AuditLog`
// MongoDB collection for every significant write action (create/update/delete).
//
// Failures are logged to stderr but never thrown — auditing must NEVER break
// the request flow.

import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';

export type AuditAction =
  | 'COURSE_CREATE'
  | 'COURSE_UPDATE'
  | 'COURSE_ARCHIVE'
  | 'COURSE_PUBLISH'
  | 'COURSE_OVERRIDE'
  | 'SELF_ENROLL'
  | 'MODULE_CREATE'
  | 'MODULE_UPDATE'
  | 'MODULE_DELETE'
  | 'MODULE_REORDER'
  | 'CONTENT_CREATE'
  | 'CONTENT_UPDATE'
  | 'CONTENT_DELETE'
  | 'CONTENT_REORDER'
  | 'THUMBNAIL_UPLOAD'
  | 'ENROLLMENT_CREATE'
  | 'ENROLLMENT_BULK_CREATE'
  | 'ENROLLMENT_CANCEL'
  | 'PROGRESS_UPDATE'
  | 'AUTO_ENROLL_RULE_CREATE'
  | 'AUTO_ENROLL_RULE_UPDATE'
  | 'AUTO_ENROLL_RULE_DELETE'
  | 'AUTO_ENROLL_TRIGGER'
  | 'QUIZ_CREATE'
  | 'QUIZ_UPDATE'
  | 'QUIZ_ARCHIVE'
  | 'QUESTION_CREATE'
  | 'QUESTION_UPDATE'
  | 'QUESTION_DELETE'
  | 'QUIZ_ATTEMPT_START'
  | 'QUIZ_ATTEMPT_SUBMIT'
  | 'QUIZ_MANUAL_GRADE'
  | 'ASSIGNMENT_CREATE'
  | 'ASSIGNMENT_UPDATE'
  | 'ASSIGNMENT_ARCHIVE'
  | 'RUBRIC_CREATE'
  | 'RUBRIC_UPDATE'
  | 'RUBRIC_DELETE'
  | 'SUBMISSION_CREATE'
  | 'SUBMISSION_UPDATE'
  | 'SUBMISSION_GRADE'
  | 'SUBMISSION_REVISION_REQUEST'
  | 'SUBMISSION_RESUBMIT'
  | 'PEER_REVIEW_ASSIGN'
  | 'PEER_REVIEW_SUBMIT'
  | 'NOTIFICATION_CREATE'
  | 'DISCUSSION_CREATE'
  | 'DISCUSSION_UPDATE'
  | 'DISCUSSION_DELETE'
  | 'DISCUSSION_REPLY_CREATE'
  | 'DISCUSSION_REPLY_DELETE'
  | 'DISCUSSION_UPVOTE'
  | 'DISCUSSION_BEST_ANSWER'
  | 'MESSAGE_SEND'
  | 'ANNOUNCEMENT_CREATE'
  | 'ANNOUNCEMENT_UPDATE'
  | 'ANNOUNCEMENT_DELETE'
  | 'CERTIFICATE_ISSUE'
  | 'CERTIFICATE_REVOKE'
  | 'CERTIFICATE_TEMPLATE_CREATE'
  | 'BADGE_AWARD'
  | 'BADGE_TEMPLATE_CREATE'
  | 'XP_AWARD'
  | 'XP_RULE_UPDATE'
  | 'REPORT_TEMPLATE_CREATE'
  | 'REPORT_TEMPLATE_UPDATE'
  | 'REPORT_TEMPLATE_DELETE'
  | 'REPORT_GENERATE'
  | 'REPORT_SCHEDULE_CREATE'
  | 'REPORT_SCHEDULE_TRIGGER'
  | 'DATA_EXPORT'
  | 'DATA_DELETE'
  | 'PLATFORM_SETTING_UPDATE';

export type AuditEntityType = 'Course' | 'Module' | 'Content' | 'Enrollment' | 'AutoEnrollmentRule' | 'User' | 'Quiz' | 'Question' | 'QuizAttempt' | 'Assignment' | 'Rubric' | 'Submission' | 'PeerReview' | 'Notification' | 'Discussion' | 'DiscussionReply' | 'Message' | 'Announcement' | 'Certificate' | 'CertificateTemplate' | 'BadgeTemplate' | 'UserBadge' | 'XPTransaction' | 'ReportTemplate' | 'ScheduledReport' | 'ReportHistory' | 'PlatformSetting';

export interface AuditContext {
  /** Caller IP (best-effort). */
  ip?: string;
  /** Caller User-Agent. */
  userAgent?: string;
}

export interface LogActionParams {
  userId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  details?: Prisma.InputJsonValue;
  context?: AuditContext;
}

/**
 * Persist an audit-log entry. Non-throwing.
 */
export async function logAction(params: LogActionParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        details: params.details ?? undefined,
        ipAddress: params.context?.ip,
        userAgent: params.context?.userAgent,
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[audit] Failed to write audit log:', err);
  }
}
