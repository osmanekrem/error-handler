import { AppError } from '../core/AppError';

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard to check if an error is an AppError with a specific code
 */
export function isAppErrorWithCode(error: unknown, code: string): error is AppError {
  return isAppError(error) && error.code === code;
}

/**
 * Type guard to check if an error is an AppError with a specific status code
 */
export function isAppErrorWithStatusCode(error: unknown, statusCode: number): error is AppError {
  return isAppError(error) && error.statusCode === statusCode;
}

/**
 * Type guard to check if an error is an operational AppError
 */
export function isOperationalAppError(error: unknown): error is AppError {
  return isAppError(error) && error.isOperational;
}

/**
 * Type guard to check if an error is a retryable AppError
 */
export function isRetryableAppError(error: unknown): error is AppError {
  if (!isAppError(error)) return false;
  
  // Check if error is operational (recoverable)
  if (!error.isOperational) return false;
  
  // Check status code for retryable errors
  const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
  return retryableStatusCodes.includes(error.statusCode);
}
