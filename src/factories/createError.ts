import { AppError } from '../core/AppError';
import { ErrorCodes } from '../core/ErrorCodes';

/**
 * Error factory functions for common error types
 */
export const createError = {
  // Authentication & Authorization
  unauthorized: (message: string = 'Authentication required', context?: Record<string, unknown>) =>
    new AppError(ErrorCodes.UNAUTHORIZED, message, 401, true, context),

  forbidden: (message: string = 'Access denied', context?: Record<string, unknown>) =>
    new AppError(ErrorCodes.FORBIDDEN, message, 403, true, context),

  tokenExpired: (message: string = 'Token has expired', context?: Record<string, unknown>) =>
    new AppError(ErrorCodes.TOKEN_EXPIRED, message, 401, true, context),

  invalidToken: (message: string = 'Invalid token', context?: Record<string, unknown>) =>
    new AppError(ErrorCodes.INVALID_TOKEN, message, 401, true, context),

  insufficientPermissions: (message: string = 'Insufficient permissions', context?: Record<string, unknown>) =>
    new AppError(ErrorCodes.INSUFFICIENT_PERMISSIONS, message, 403, true, context),

  // Validation
  validation: (message: string = 'Validation failed', context?: Record<string, unknown>) =>
    new AppError(ErrorCodes.VALIDATION_ERROR, message, 400, true, context),

  invalidInput: (message: string = 'Invalid input provided', context?: Record<string, unknown>) =>
    new AppError(ErrorCodes.INVALID_INPUT, message, 400, true, context),

  missingRequiredField: (field: string, context?: Record<string, unknown>) =>
    new AppError(ErrorCodes.MISSING_REQUIRED_FIELD, `Required field '${field}' is missing`, 400, true, context),

  invalidFormat: (field: string, expectedFormat: string, context?: Record<string, unknown>) =>
    new AppError(ErrorCodes.INVALID_FORMAT, `Invalid format for field '${field}', expected: ${expectedFormat}`, 400, true, context),

  // Resource Management
  notFound: (resource: string = 'Resource', context?: Record<string, unknown>) =>
    new AppError(ErrorCodes.NOT_FOUND, `${resource} not found`, 404, true, context),

  conflict: (message: string = 'Resource conflict', context?: Record<string, unknown>) =>
    new AppError(ErrorCodes.CONFLICT, message, 409, true, context),

  duplicateResource: (resource: string, context?: Record<string, unknown>) =>
    new AppError(ErrorCodes.DUPLICATE_RESOURCE, `${resource} already exists`, 409, true, context),

  resourceLocked: (resource: string, context?: Record<string, unknown>) =>
    new AppError(ErrorCodes.RESOURCE_LOCKED, `${resource} is locked`, 423, true, context),

  resourceExpired: (resource: string, context?: Record<string, unknown>) =>
    new AppError(ErrorCodes.RESOURCE_EXPIRED, `${resource} has expired`, 410, true, context),

  // Database
  database: (message: string = 'Database operation failed', context?: Record<string, unknown>) =>
    new AppError(ErrorCodes.DATABASE_ERROR, message, 500, true, context),

  connectionError: (message: string = 'Database connection failed', context?: Record<string, unknown>) =>
    new AppError(ErrorCodes.CONNECTION_ERROR, message, 500, true, context),

  queryError: (query: string, context?: Record<string, unknown>) =>
    new AppError(ErrorCodes.QUERY_ERROR, `Database query failed: ${query}`, 500, true, context),

  transactionError: (message: string = 'Database transaction failed', context?: Record<string, unknown>) =>
    new AppError(ErrorCodes.TRANSACTION_ERROR, message, 500, true, context),

  constraintViolation: (constraint: string, context?: Record<string, unknown>) =>
    new AppError(ErrorCodes.CONSTRAINT_VIOLATION, `Database constraint violation: ${constraint}`, 400, true, context),

  // External Services
  external: (service: string, message: string = 'External service error', context?: Record<string, unknown>) =>
    new AppError(ErrorCodes.EXTERNAL_SERVICE_ERROR, `${service}: ${message}`, 502, true, context),

  serviceUnavailable: (service: string, context?: Record<string, unknown>) =>
    new AppError(ErrorCodes.SERVICE_UNAVAILABLE, `${service} is temporarily unavailable`, 503, true, context),

  rateLimitExceeded: (service: string, retryAfter?: number, context?: Record<string, unknown>) => {
    const error = new AppError(ErrorCodes.RATE_LIMIT_EXCEEDED, `Rate limit exceeded for ${service}`, 429, true, context);
    if (retryAfter) {
      error.context = { ...error.context, retryAfter };
    }
    return error;
  },

  apiError: (service: string, statusCode: number, message: string, context?: Record<string, unknown>) =>
    new AppError(ErrorCodes.API_ERROR, `${service} API error (${statusCode}): ${message}`, 502, true, context),

  // System
  internal: (message: string = 'Internal server error', context?: Record<string, unknown>) =>
    new AppError(ErrorCodes.INTERNAL_SERVER_ERROR, message, 500, false, context),

  timeout: (operation: string, timeoutMs?: number, context?: Record<string, unknown>) => {
    const message = timeoutMs 
      ? `${operation} timed out after ${timeoutMs}ms`
      : `${operation} timed out`;
    return new AppError(ErrorCodes.TIMEOUT, message, 408, true, context);
  },

  memoryError: (message: string = 'Memory error occurred', context?: Record<string, unknown>) =>
    new AppError(ErrorCodes.MEMORY_ERROR, message, 500, false, context),

  diskError: (message: string = 'Disk error occurred', context?: Record<string, unknown>) =>
    new AppError(ErrorCodes.DISK_ERROR, message, 500, true, context),

  networkError: (message: string = 'Network error occurred', context?: Record<string, unknown>) =>
    new AppError(ErrorCodes.NETWORK_ERROR, message, 500, true, context),

  // Business Logic
  businessRuleViolation: (rule: string, context?: Record<string, unknown>) =>
    new AppError(ErrorCodes.BUSINESS_RULE_VIOLATION, `Business rule violation: ${rule}`, 400, true, context),

  insufficientFunds: (amount: number, available: number, context?: Record<string, unknown>) =>
    new AppError(ErrorCodes.INSUFFICIENT_FUNDS, `Insufficient funds: required ${amount}, available ${available}`, 400, true, context),

  quotaExceeded: (quota: string, limit: number, context?: Record<string, unknown>) =>
    new AppError(ErrorCodes.QUOTA_EXCEEDED, `Quota exceeded for ${quota}: limit ${limit}`, 429, true, context),

  featureDisabled: (feature: string, context?: Record<string, unknown>) =>
    new AppError(ErrorCodes.FEATURE_DISABLED, `Feature '${feature}' is disabled`, 403, true, context),

  // Configuration
  configuration: (message: string = 'Configuration error', context?: Record<string, unknown>) =>
    new AppError(ErrorCodes.CONFIGURATION_ERROR, message, 500, false, context),

  missingConfiguration: (key: string, context?: Record<string, unknown>) =>
    new AppError(ErrorCodes.MISSING_CONFIGURATION, `Missing configuration: ${key}`, 500, false, context),

  invalidConfiguration: (key: string, value: unknown, context?: Record<string, unknown>) =>
    new AppError(ErrorCodes.INVALID_CONFIGURATION, `Invalid configuration for '${key}': ${value}`, 500, false, context),

  // File Operations
  fileNotFound: (filename: string, context?: Record<string, unknown>) =>
    new AppError(ErrorCodes.FILE_NOT_FOUND, `File not found: ${filename}`, 404, true, context),

  fileAccessDenied: (filename: string, context?: Record<string, unknown>) =>
    new AppError(ErrorCodes.FILE_ACCESS_DENIED, `File access denied: ${filename}`, 403, true, context),

  fileCorrupted: (filename: string, context?: Record<string, unknown>) =>
    new AppError(ErrorCodes.FILE_CORRUPTED, `File is corrupted: ${filename}`, 400, true, context),

  fileTooLarge: (filename: string, size: number, maxSize: number, context?: Record<string, unknown>) =>
    new AppError(ErrorCodes.FILE_TOO_LARGE, `File too large: ${filename} (${size} bytes, max ${maxSize} bytes)`, 413, true, context),

  invalidFileFormat: (filename: string, expectedFormat: string, context?: Record<string, unknown>) =>
    new AppError(ErrorCodes.INVALID_FILE_FORMAT, `Invalid file format for '${filename}', expected: ${expectedFormat}`, 400, true, context),

  // Workflow & Process
  workflow: (message: string = 'Workflow error occurred', context?: Record<string, unknown>) =>
    new AppError(ErrorCodes.WORKFLOW_ERROR, message, 500, true, context),

  processInterrupted: (process: string, context?: Record<string, unknown>) =>
    new AppError(ErrorCodes.PROCESS_INTERRUPTED, `Process interrupted: ${process}`, 500, true, context),

  invalidState: (currentState: string, expectedState: string, context?: Record<string, unknown>) =>
    new AppError(ErrorCodes.INVALID_STATE, `Invalid state: current '${currentState}', expected '${expectedState}'`, 400, true, context),

  dependencyError: (dependency: string, message: string, context?: Record<string, unknown>) =>
    new AppError(ErrorCodes.DEPENDENCY_ERROR, `Dependency error for '${dependency}': ${message}`, 500, true, context),
};
