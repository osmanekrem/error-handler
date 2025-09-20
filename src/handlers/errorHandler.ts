import { AppError } from '../core/AppError';
import { ErrorCodeMetadata } from '../core/ErrorCodes';
import { isAppError } from './isAppError';

export interface ErrorHandlerOptions {
  logErrors?: boolean;
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
  includeStack?: boolean;
  sanitizeContext?: boolean;
  onError?: (error: AppError) => void;
}

/**
 * Global error handler for AppError instances
 */
export function errorHandler(
  error: unknown,
  context?: string,
  options: ErrorHandlerOptions = {}
): AppError {
  const {
    logErrors = true,
    logLevel = 'error',
    includeStack = false,
    sanitizeContext = true,
    onError,
  } = options;

  let appError: AppError;

  if (isAppError(error)) {
    appError = error;
  } else if (error instanceof Error) {
    appError = new AppError(
      'INTERNAL_SERVER_ERROR',
      error.message,
      500,
      false,
      { originalError: error.name, context }
    );
  } else {
    appError = new AppError(
      'INTERNAL_SERVER_ERROR',
      'Unknown error occurred',
      500,
      false,
      { originalError: String(error), context }
    );
  }

  // Add context if provided
  if (context) {
    appError.context = {
      ...appError.context,
      handlerContext: context,
    };
  }

  // Sanitize context if requested
  if (sanitizeContext && appError.context) {
    appError.context = sanitizeErrorContext(appError.context);
  }

  // Log error if requested
  if (logErrors) {
    logError(appError, logLevel, includeStack);
  }

  // Call custom error handler
  if (onError) {
    onError(appError);
  }

  return appError;
}

/**
 * Higher-order function for error handling in async functions
 */
export function withErrorHandling<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string,
  options?: ErrorHandlerOptions
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      throw errorHandler(error, context, options);
    }
  };
}

/**
 * Sanitize error context to remove sensitive information
 */
function sanitizeErrorContext(context: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'credential'];
  const sanitized = { ...context };

  for (const key in sanitized) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Log error with appropriate level
 */
function logError(error: AppError, level: string, includeStack: boolean): void {
  const logData = {
    code: error.code,
    message: error.message,
    statusCode: error.statusCode,
    isOperational: error.isOperational,
    context: error.context,
    timestamp: error.timestamp.toISOString(),
    severity: error.getSeverity(),
    ...(includeStack && { stack: error.stack }),
  };

  switch (level) {
    case 'error':
      console.error('AppError:', logData);
      break;
    case 'warn':
      console.warn('AppError:', logData);
      break;
    case 'info':
      console.info('AppError:', logData);
      break;
    case 'debug':
      console.debug('AppError:', logData);
      break;
    default:
      console.error('AppError:', logData);
  }
}

/**
 * Get error metadata for monitoring and alerting
 */
export function getErrorMetadata(error: AppError) {
  const metadata = ErrorCodeMetadata[error.code as keyof typeof ErrorCodeMetadata];
  
  return {
    code: error.code,
    severity: error.getSeverity(),
    category: metadata?.category || 'unknown',
    retryable: metadata?.retryable || false,
    userMessage: metadata?.userMessage || error.message,
    isOperational: error.isOperational,
    statusCode: error.statusCode,
    timestamp: error.timestamp,
  };
}
