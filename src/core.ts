/**
 * Core error handling exports
 * Minimal bundle for core functionality
 */

export { AppError } from './core/AppError';
export { ErrorCodes, type ErrorCode } from './core/ErrorCodes';
export type {
  AppErrorOptions,
  ErrorContext,
  ErrorMetadata,
  CircuitBreakerOptions,
  CircuitBreakerState,
} from './core/types';
