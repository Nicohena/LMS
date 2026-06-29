import express, { type Request, type Response, type NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { prisma } from './lib/prisma';

const app = express();

// --- Security & parsing middlewares ---
app.use(helmet());
app.use(cors());
app.use(express.json());
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
