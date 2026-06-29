// src/common/middlewares/validation.middleware.ts
import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema, ZodError } from 'zod';

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
 * Usage:
 *   router.post('/login', validate({ body: loginSchema }), handler);
 *   router.get('/users/:id', validate({ params: idSchema }), handler);
 */
export function validate(options: ValidateOptions) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const targets: ValidationTarget[] = ['body', 'params', 'query'];

    for (const target of targets) {
      const schema = options[target];
      if (!schema) continue;

      // Express leaves req.body as `undefined` when no body is sent (e.g. cookie-only POST).
      // Default to an empty object so Zod's object schema doesn't reject it.
      const input = req[target] ?? {};
      const result = schema.safeParse(input);
      if (!result.success) {
        const errors = formatZodError(result.error);
        res.status(400).json({
          message: `Validation failed for ${target}`,
          errors,
        });
        return;
      }
      // Replace with parsed (and coerced/trimmed) data
      req[target] = result.data;
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
