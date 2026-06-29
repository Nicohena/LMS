// src/common/types/express.d.ts
import type { Role } from '@prisma/client';

// Extend Express Request with an authenticated `user` payload.
// Populated by the `authenticate` middleware after verifying the access JWT.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        email: string;
        role: Role;
      };
    }
  }
}

export {};
