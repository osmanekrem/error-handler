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

// Middleware exports
export { expressErrorMiddleware, asyncHandler } from './middleware/express';
export { fastifyErrorPlugin, createFastifyError } from './middleware/fastify';

// Metrics exports
export { ErrorMetrics, PrometheusMetrics } from './metrics';

// Recovery exports
export { Retryable, retry } from './recovery';
export type { RetryOptions, RetryResult } from './recovery';

export {
  RetryStrategy,
  DefaultRetryStrategy,
  DatabaseRetryStrategy,
  ApiRetryStrategy,
  FileRetryStrategy,
  RetryStrategyFactory
} from './recovery';

// Custom Error exports
export { BaseCustomError } from './errors';
export { DatabaseError, createDatabaseError } from './errors';
export { ValidationError, createValidationError } from './errors';
export { BusinessError, createBusinessError } from './errors';

// Cache exports
export { ErrorCache, DeduplicationService } from './cache';
export type { ErrorCacheOptions, CachedError, ErrorCacheStats } from './cache';
export type { DeduplicationOptions, DeduplicationResult } from './cache';

// Serialization exports
export { ErrorSerializer } from './serialization';
export type { SerializationOptions, SerializedError } from './serialization';

// Re-export types
export type {
  AppErrorOptions,
  ErrorContext,
  ErrorHandlerOptions,
  CircuitBreakerOptions,
  CircuitBreakerState,
} from './core/types';

// Middleware types
export type { ExpressErrorMiddlewareOptions } from './middleware/express';
export type { FastifyErrorPluginOptions } from './middleware/fastify';

// Metrics types
export type { ErrorMetricsOptions, ErrorStats, ErrorRecord } from './metrics/ErrorMetrics';
export type { PrometheusMetricsOptions } from './metrics/PrometheusMetrics';

// Custom Error types
export type { DatabaseErrorContext } from './errors/DatabaseError';
export type { ValidationErrorContext } from './errors/ValidationError';
export type { BusinessErrorContext } from './errors/BusinessError';
