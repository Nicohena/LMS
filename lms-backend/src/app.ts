import express, { type Request, type Response, type NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { prisma } from './lib/prisma';
import authRouter from './modules/auth/auth.routes';
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

// --- Test routes for RBAC verification (Step 3) ---
// Remove or guard these once real protected routes exist.
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
