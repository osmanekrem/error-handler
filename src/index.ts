/**
 * @osmanekrem/error-handler
 * Advanced error handling utilities for TypeScript applications
 */

// Core exports
export { AppError } from './core/AppError';
export { ErrorCodes, type ErrorCode } from './core/ErrorCodes';

// Factory exports
export { createError } from './factories/createError';

// Handler exports
export { errorHandler, withErrorHandling } from './handlers/errorHandler';
export { isAppError } from './handlers/isAppError';

// Integration exports
export { toTRPCError } from './integrations/toTRPCError';

// Pattern exports
export { CircuitBreaker } from './patterns/CircuitBreaker';

// Re-export types
export type {
  AppErrorOptions,
  ErrorContext,
  ErrorHandlerOptions,
  CircuitBreakerOptions,
  CircuitBreakerState,
} from './core/types';
