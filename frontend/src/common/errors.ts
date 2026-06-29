// src/common/errors.ts
//
// Custom HTTP-friendly error classes used across modules.
// All extend Error and carry a `statusCode` so the global error handler
// can convert them into proper HTTP responses.

export class HttpError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code?: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ValidationError extends HttpError {
  constructor(message = 'Validation failed') {
    super(message, 400, 'VALIDATION');
  }
}

export class ConflictError extends HttpError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
  }
}

export class ServiceUnavailableError extends HttpError {
  constructor(message = 'Service unavailable') {
    super(message, 503, 'SERVICE_UNAVAILABLE');
  }
}

/** Type guard: did `err` originate from one of our HTTP error classes? */
export function isHttpError(err: unknown): err is HttpError {
  return err instanceof HttpError;
}
