// src/common/middlewares/validation.middleware.ts
import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema, ZodError, infer as zodInfer } from 'zod';

type ValidationTarget = 'body' | 'params' | 'query';

interface ValidateOptions {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

/**
 * Validation middleware factory.
 *
 * Validates the specified request parts against Zod schemas.
 * On failure, responds with 400 and a flat list of validation error messages.
 *
 * On success, the parsed (and coerced/trimmed) data is written back to:
 *   - `req.body` (writable in Express 5)
 *   - `req.params` (writable in Express 5)
 *   - `req.validated.query` (req.query is read-only in Express 5, so we
 *     stash the parsed result in a separate object — controllers should
 *     read `req.validated.query` instead of `req.query` when validation
 *     has been applied.)
 *
 * Usage:
 *   router.post('/login', validate({ body: loginSchema }), handler);
 *   router.get('/users', validate({ query: userQuerySchema }), handler);
 *     // then in handler: const q = req.validated.query;
 */
export function validate(options: ValidateOptions) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const targets: ValidationTarget[] = ['body', 'params', 'query'];

    if (!req.validated) {
      (req as Request & { validated: ValidatedData }).validated = {};
    }
    const validated = (req as Request & { validated: ValidatedData }).validated;

    for (const target of targets) {
      const schema = options[target];
      if (!schema) continue;

      // Express leaves req.body as `undefined` when no body is sent
      // (e.g. cookie-only POST). Default to an empty object so Zod's
      // object schema doesn't reject it.
      const input = (req[target] ?? {}) as Record<string, unknown>;
      const result = schema.safeParse(input);
      if (!result.success) {
        const errors = formatZodError(result.error);
        res.status(400).json({
          message: `Validation failed for ${target}`,
          errors,
        });
        return;
      }

      const parsed = result.data as Record<string, unknown>;

      // `body` is writable; `params` is typed as ParamsDictionary (cast);
      // `query` is read-only in Express 5, so we ONLY stash the parsed
      // result on `req.validated.query`.
      if (target === 'body') req.body = parsed;
      if (target === 'params') (req.params as Record<string, unknown>) = parsed;
      validated[target] = parsed;
    }

    next();
  };
}

function formatZodError(error: ZodError): Array<{ path: string; message: string }> {
  return error.issues.map((issue) => ({
    path: issue.path.join('.') || '(root)',
    message: issue.message,
  }));
}

/** Container for validated request parts. */
export interface ValidatedData {
  body?: Record<string, unknown>;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
}

// Helper type: given a Zod schema, infer the parsed output type.
export type Validated<T extends ZodSchema> = zodInfer<T>;
