import { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '../core/AppError';
import { errorHandler, ErrorHandlerOptions } from '../handlers/errorHandler';

export interface FastifyErrorPluginOptions extends ErrorHandlerOptions {
  customErrorHandler?: (error: AppError, request: FastifyRequest, reply: FastifyReply) => void;
  includeRequestInfo?: boolean;
  sanitizeRequest?: boolean;
}

/**
 * Fastify error handling plugin
 * 
 * @example
 * ```typescript
 * import Fastify from 'fastify';
 * import { fastifyErrorPlugin } from '@osmanekrem/error-handler/fastify';
 * 
 * const fastify = Fastify();
 * 
 * // Register the plugin
 * fastify.register(fastifyErrorPlugin, {
 *   logErrors: true,
 *   includeStack: process.env.NODE_ENV === 'development',
 *   sanitizeContext: true
 * });
 * 
 * fastify.get('/users/:id', async (request, reply) => {
 *   // Your route logic here
 *   // Errors will be automatically handled by the plugin
 * });
 * ```
 */
export async function fastifyErrorPlugin(
  fastify: FastifyInstance,
  options: FastifyErrorPluginOptions = {}
): Promise<void> {
  const {
    customErrorHandler,
    includeRequestInfo = true,
    sanitizeRequest = true,
    ...errorHandlerOptions
  } = options;

  // Set error handler
  fastify.setErrorHandler(async (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    // Handle error first
    const appError = errorHandler(error, `${request.method} ${request.routerPath}`, errorHandlerOptions);
    
    // Add request context to error after handling
    if (includeRequestInfo) {
      appError.context = {
        ...appError.context,
        request: {
          method: request.method,
          url: request.url,
          path: request.routerPath,
          query: request.query,
          params: request.params,
          ...(sanitizeRequest && {
            headers: sanitizeHeaders(request.headers),
            body: sanitizeBody(request.body)
          })
        }
      };
    }

    // Call custom error handler if provided
    if (customErrorHandler) {
      try {
        await customErrorHandler(appError, request, reply);
      } catch (customError) {
        fastify.log.error(customError as Error, 'Custom error handler failed');
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

    reply.status(appError.statusCode).send(errorResponse);
  });

  // Add helper method to fastify instance
  fastify.decorate('createError', (code: string, message: string, statusCode?: number, context?: Record<string, unknown>) => {
    return new AppError(code, message, statusCode || 500, true, context);
  });
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
 * Helper function to create AppError in Fastify context
 * 
 * @example
 * ```typescript
 * fastify.get('/users/:id', async (request, reply) => {
 *   const user = await getUser(request.params.id);
 *   if (!user) {
 *     throw fastify.createError('USER_NOT_FOUND', 'User not found', 404, { userId: request.params.id });
 *   }
 *   return user;
 * });
 * ```
 */
export function createFastifyError(
  code: string,
  message: string,
  statusCode: number = 500,
  context?: Record<string, unknown>
): AppError {
  return new AppError(code, message, statusCode, true, context);
}
