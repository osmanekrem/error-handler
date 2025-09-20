import { Request, Response, NextFunction } from 'express';
import { AppError } from '../core/AppError';
import { errorHandler, ErrorHandlerOptions } from '../handlers/errorHandler';

export interface ExpressErrorMiddlewareOptions extends ErrorHandlerOptions {
  customErrorHandler?: (error: AppError, req: Request, res: Response) => void;
  includeRequestInfo?: boolean;
  sanitizeRequest?: boolean;
}

/**
 * Express.js error handling middleware
 * 
 * @example
 * ```typescript
 * import express from 'express';
 * import { expressErrorMiddleware } from '@osmanekrem/error-handler/express';
 * 
 * const app = express();
 * 
 * // Use the middleware
 * app.use(expressErrorMiddleware({
 *   logErrors: true,
 *   includeStack: process.env.NODE_ENV === 'development',
 *   sanitizeContext: true
 * }));
 * 
 * app.get('/users/:id', async (req, res) => {
 *   // Your route logic here
 *   // Errors will be automatically handled by the middleware
 * });
 * ```
 */
export function expressErrorMiddleware(options: ExpressErrorMiddlewareOptions = {}) {
  const {
    customErrorHandler,
    includeRequestInfo = true,
    sanitizeRequest = true,
    ...errorHandlerOptions
  } = options;

  return (error: unknown, req: Request, res: Response, _next: NextFunction): void => {
    // Handle error first
    const appError = errorHandler(error, `${req.method} ${req.path}`, errorHandlerOptions);
    
    // Add request context to error after handling
    if (includeRequestInfo) {
      appError.context = {
        ...appError.context,
        request: {
          method: req.method,
          url: req.url,
          path: req.path,
          query: req.query,
          params: req.params,
          ...(sanitizeRequest && {
            headers: sanitizeHeaders(req.headers),
            body: sanitizeBody(req.body)
          })
        }
      };
    }

    // Call custom error handler if provided
    if (customErrorHandler) {
      try {
        customErrorHandler(appError, req, res);
      } catch (customError) {
        console.error('Custom error handler failed:', customError);
      }
    }

    // Send error response
    const errorResponse = {
      error: {
        code: appError.code,
        message: appError.message,
        statusCode: appError.statusCode,
        ...(errorHandlerOptions.includeStack && { stack: appError.stack }),
        ...(appError.context && { context: appError.context })
      }
    };

    res.status(appError.statusCode).json(errorResponse);
  };
}

/**
 * Sanitize request headers to remove sensitive information
 */
function sanitizeHeaders(headers: Record<string, unknown>): Record<string, unknown> {
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
  const sanitized = { ...headers };

  for (const header of sensitiveHeaders) {
    if (sanitized[header]) {
      sanitized[header] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Sanitize request body to remove sensitive information
 */
function sanitizeBody(body: unknown): unknown {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth', 'credential'];
  const sanitized = { ...body as Record<string, unknown> };

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Higher-order function to wrap async route handlers with error handling
 * 
 * @example
 * ```typescript
 * import { asyncHandler } from '@osmanekrem/error-handler/express';
 * 
 * app.get('/users/:id', asyncHandler(async (req, res) => {
 *   const user = await getUser(req.params.id);
 *   res.json(user);
 * }));
 * ```
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
