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
