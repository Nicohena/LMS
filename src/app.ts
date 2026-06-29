import express, { type Request, type Response, type NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

const app = express();

// --- Security & parsing middlewares ---
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// --- Routes ---
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'LMS Backend is running',
    timestamp: new Date().toISOString(),
  });
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
