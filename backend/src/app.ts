import express, { type Request, type Response, type NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { prisma } from './lib/prisma';
import { isHttpError } from './common/errors';
import authRouter from './modules/auth/auth.routes';
import userRouter from './modules/users/user.routes';
import courseRouter from './modules/courses/course.routes';
import enrollmentRouter, { autoEnrollmentRouter } from './modules/enrollments/enrollment.routes';
import quizRouter from './modules/quizzes/quiz.routes';
import assignmentRouter from './modules/assignments/assignment.routes';
import { notificationRouter, discussionRouter, messageRouter, announcementRouter } from './modules/notifications/notification.routes';
import certificateRouter from './modules/certificates/certificate.routes';
import gamificationRouter from './modules/gamification/gamification.routes';
import { dashboardRouter, reportRouter, scheduleRouter } from './modules/reports/report.routes';
import auditRouter from './modules/audit/audit.routes';
import { settingRouter, emailTemplateRouter, gradingScaleRouter, academicYearRouter, healthRouter, maintenanceRouter } from './modules/settings/setting.routes';
import { authenticate } from './common/middlewares/auth.middleware';
import { authorize } from './common/middlewares/rbac.middleware';

const app = express();

// --- Security & parsing middlewares ---
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true, // allow cookies to be sent cross-origin
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// --- Routes ---
app.get('/api/v1/health', async (_req: Request, res: Response) => {
  try {
    await prisma.$runCommandRaw({ ping: 1 });
    res.status(200).json({
      status: 'ok',
      message: 'LMS Backend is running',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('DB health check failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      database: 'disconnected',
    });
  }
});

app.get('/api/v1/ping', (_req: Request, res: Response) => {
  res.status(200).json({ message: 'pong' });
});

// --- Auth module ---
app.use('/api/v1/auth', authRouter);

// --- Users module ---
app.use('/api/v1/users', userRouter);

// --- Invite codes + self-service user management ---
import {
  generateInviteController,
  getInvitesController,
  registerWithInviteController,
  teacherCreateStudentController,
  changeUserRoleController,
} from './modules/users/invite.controller';
import { Router as InviteRouter } from 'express';

// Public: register with invite code
app.post('/api/v1/auth/register-with-invite', registerWithInviteController);

// Teacher+Admin: create student accounts
const studentRouter = InviteRouter();
studentRouter.use(authenticate, authorize('ADMIN', 'TEACHER'));
studentRouter.post('/', teacherCreateStudentController);
app.use('/api/v1/students', studentRouter);

// Admin-only: invite code management + role changes
const inviteRouter = InviteRouter();
inviteRouter.use(authenticate, authorize('ADMIN'));
inviteRouter.post('/invites/generate', generateInviteController);
inviteRouter.get('/invites', getInvitesController);
inviteRouter.patch('/users/:id/role', changeUserRoleController);
app.use('/api/v1/admin', inviteRouter);

// --- Escalation workflow (Step 6) ---
import {
  escalateSubmissionController,
  teacherResolveController,
  adminResolveController,
  getEscalationsController,
} from './modules/escalations/escalation.controller';
import { Router as EscalationRouter } from 'express';

// Student escalates a submission
app.post('/api/v1/submissions/:id/escalate', authenticate, escalateSubmissionController);

// Escalation management (teacher + admin)
const escalationRouter = EscalationRouter();
escalationRouter.use(authenticate);
// Teacher resolves or forwards
escalationRouter.patch('/:id/resolve', authorize('ADMIN', 'TEACHER'), teacherResolveController);
// Admin final resolution
escalationRouter.patch('/:id/admin-resolve', authorize('ADMIN'), adminResolveController);
// List escalations (role-based: students see own, teachers see assigned, admins see all)
escalationRouter.get('/', getEscalationsController);
app.use('/api/v1/escalations', escalationRouter);
// Admin-specific alias
app.get('/api/v1/admin/escalations', authenticate, authorize('ADMIN'), getEscalationsController);

// --- Courses module ---
app.use('/api/v1/courses', courseRouter);

// --- Content moderation module (admin-only, post-moderation) ---
import { Router as ModerationRouter } from 'express';
import { authenticate as modAuth, } from './common/middlewares/auth.middleware';
import { authorize as modAuthz } from './common/middlewares/rbac.middleware';
import { getFlaggedContentController, moderateContentController, runModerationController } from './modules/courses/moderation.controller';
const contentModerationRouter = ModerationRouter();
contentModerationRouter.use(modAuth, modAuthz('ADMIN'));
contentModerationRouter.get('/flagged', getFlaggedContentController);
contentModerationRouter.patch('/:id/moderate', moderateContentController);
contentModerationRouter.post('/:id/moderate/run', runModerationController);
app.use('/api/v1/content', contentModerationRouter);

// --- Enrollments module ---
app.use('/api/v1/enrollments', enrollmentRouter);

// --- Auto-enrollment admin routes ---
app.use('/api/v1/admin/auto-enrollment', autoEnrollmentRouter);

// --- Quizzes module ---
app.use('/api/v1/quizzes', quizRouter);

// --- Assignments module ---
app.use('/api/v1/assignments', assignmentRouter);

// --- Notifications & Communication module (Step 9) ---
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/discussions', discussionRouter);
app.use('/api/v1/messages', messageRouter);
app.use('/api/v1/announcements', announcementRouter);

// --- Certificates & Gamification module (Step 10) ---
app.use('/api/v1/certificates', certificateRouter);
app.use('/api/v1/gamification', gamificationRouter);

// --- Admin Dashboard & Reporting module (Step 11) ---
app.use('/api/v1/dashboards', dashboardRouter);
app.use('/api/v1/reports', reportRouter);
app.use('/api/v1/schedules', scheduleRouter);
app.use('/api/v1/audit', auditRouter);

// --- System Settings & Configuration module (Step 12) ---
app.use('/api/v1/settings', settingRouter);
app.use('/api/v1/email-templates', emailTemplateRouter);
app.use('/api/v1/grading-scales', gradingScaleRouter);
app.use('/api/v1/academic-years', academicYearRouter);
app.use('/api/v1/health', healthRouter);
app.use('/api/v1/maintenance', maintenanceRouter);

// --- Test routes for RBAC verification (Step 3) ---
// Kept for quick smoke-testing of the authenticate/authorize middlewares.
app.get(
  '/api/v1/admin-only',
  authenticate,
  authorize('ADMIN'),
  (req: Request, res: Response) => {
    res.json({ message: 'Admin access granted', user: req.user });
  },
);
app.get(
  '/api/v1/me',
  authenticate,
  (req: Request, res: Response) => {
    res.json({ user: req.user });
  },
);

// --- 404 handler (no matching route) ---
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Resource not found',
  });
});

// --- Global error handler ---
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  // Custom HTTP errors (NotFoundError, ForbiddenError, etc.) — use their status + message
  if (isHttpError(err)) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      ...(err.code ? { code: err.code } : {}),
    });
    return;
  }

  // Multer file-validation errors come back with a `.code` of LIMIT_* or as
  // a generic Error with a message starting "Unsupported file type" etc.
  if (err.name === 'MulterError' || /file|upload/i.test(err.message)) {
    res.status(400).json({ status: 'error', message: err.message });
    return;
  }

  const statusCode = (err as Error & { status?: number }).status ?? 500;

  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.error(err.stack);
  }

  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

export default app;
