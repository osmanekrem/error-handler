import { Context, Next } from 'hono';
import { AppError } from '../core/AppError';
import { errorHandler, ErrorHandlerOptions } from '../handlers/errorHandler';

export interface HonoErrorMiddlewareOptions extends ErrorHandlerOptions {
  customErrorHandler?: (error: AppError, c: Context) => void | Promise<void>;
  includeRequestInfo?: boolean;
  sanitizeRequest?: boolean;
}

/**
 * Hono error handling middleware
 * 
 * @example
 * ```typescript
 * import { Hono } from 'hono';
 * import { honoErrorMiddleware } from '@osmanekrem/error-handler/hono';
 * 
 * const app = new Hono();
 * 
 * // Use the middleware
 * app.use('*', honoErrorMiddleware({
 *   logErrors: true,
 *   includeStack: process.env.NODE_ENV === 'development',
 *   sanitizeContext: true
 * }));
 * 
 * app.get('/users/:id', async (c) => {
 *   // Your route logic here
 *   // Errors will be automatically handled by the middleware
 * });
 * ```
 */
export function honoErrorMiddleware(options: HonoErrorMiddlewareOptions = {}) {
  const {
    customErrorHandler,
    includeRequestInfo = true,
    sanitizeRequest = true,
    ...errorHandlerOptions
  } = options;

  return async (c: Context, next: Next): Promise<Response | void> => {
    try {
      return await next();
    } catch (error) {
      // Handle error first
      const appError = errorHandler(error, `${c.req.method} ${c.req.path}`, errorHandlerOptions);
      
      // Add request context to error after handling
      if (includeRequestInfo) {
        appError.context = {
          ...appError.context,
          request: {
            method: c.req.method,
            url: c.req.url,
            path: c.req.path,
            query: Object.fromEntries(new URLSearchParams(c.req.url.split('?')[1] || '')),
            params: c.req.param(),
            ...(sanitizeRequest && {
              headers: sanitizeHeaders(c.req.header()),
              body: await sanitizeBody(c.req)
            })
          }
        };
      }

      // Call custom error handler if provided
      if (customErrorHandler) {
        try {
          await customErrorHandler(appError, c);
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

      c.status(appError.statusCode as any);
      return c.json(errorResponse);
    }
  };
}

/**
 * Hono error handler for onError hook
 * 
 * @example
 * ```typescript
 * import { Hono } from 'hono';
 * import { honoErrorHandler } from '@osmanekrem/error-handler/hono';
 * 
 * const app = new Hono();
 * 
 * app.onError(honoErrorHandler({
 *   logErrors: true,
 *   includeStack: process.env.NODE_ENV === 'development'
 * }));
 * ```
 */
export function honoErrorHandler(options: HonoErrorMiddlewareOptions = {}) {
  const {
    customErrorHandler,
    includeRequestInfo = true,
    sanitizeRequest = true,
    ...errorHandlerOptions
  } = options;

  return async (error: Error, c: Context): Promise<Response> => {
    // Handle error first
    const appError = errorHandler(error, `${c.req.method} ${c.req.path}`, errorHandlerOptions);
    
    // Add request context to error after handling
    if (includeRequestInfo) {
      appError.context = {
        ...appError.context,
        request: {
          method: c.req.method,
          url: c.req.url,
          path: c.req.path,
          query: Object.fromEntries(new URLSearchParams(c.req.url.split('?')[1] || '')),
          params: c.req.param(),
          ...(sanitizeRequest && {
            headers: sanitizeHeaders(c.req.header()),
            body: await sanitizeBody(c.req)
          })
        }
      };
    }

    // Call custom error handler if provided
    if (customErrorHandler) {
      try {
        await customErrorHandler(appError, c);
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

    c.status(appError.statusCode as any);
    return c.json(errorResponse);
  };
}

/**
 * Sanitize request headers to remove sensitive information
 */
function sanitizeHeaders(headers: Record<string, string | undefined>): Record<string, unknown> {
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(headers)) {
    if (sensitiveHeaders.some(sensitive => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitize request body to remove sensitive information
 */
async function sanitizeBody(req: any): Promise<unknown> {
  try {
    const body = await req.json();
    
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
  } catch {
    // If body parsing fails, return undefined
    return undefined;
  }
}

/**
 * Helper function to create AppError in Hono context
 * 
 * @example
 * ```typescript
 * import { createHonoError } from '@osmanekrem/error-handler/hono';
 * 
 * app.get('/users/:id', async (c) => {
 *   const user = await getUser(c.req.param('id'));
 *   if (!user) {
 *     throw createHonoError('USER_NOT_FOUND', 'User not found', 404, { userId: c.req.param('id') });
 *   }
 *   return c.json(user);
 * });
 * ```
 */
export function createHonoError(
  code: string,
  message: string,
  statusCode: number = 500,
  context?: Record<string, unknown>
): AppError {
  return new AppError(code, message, statusCode, true, context);
}
