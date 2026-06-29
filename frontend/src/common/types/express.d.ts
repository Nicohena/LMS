// src/common/types/express.d.ts
import type { Role } from '@prisma/client';
import type { ValidatedData } from '../middlewares/validation.middleware';

// Extend Express Request with an authenticated `user` payload + a `validated`
// bag where validation middleware stashes parsed body/params/query.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        email: string;
        role: Role;
      };
      validated?: ValidatedData;
    }
  }
}

export {};
