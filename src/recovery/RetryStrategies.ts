import { AppError } from '../core/AppError';
import { ErrorCodes } from '../core/ErrorCodes';

export interface RetryStrategy {
  shouldRetry(error: AppError, attempt: number): boolean;
  getDelay(error: AppError, attempt: number): number;
  getMaxAttempts(error: AppError): number;
}

/**
 * Default retry strategy
 */
export class DefaultRetryStrategy implements RetryStrategy {
  constructor(
    private maxAttempts: number = 3,
    private baseDelay: number = 1000,
    private backoffMultiplier: number = 2
  ) {}

  shouldRetry(error: AppError, attempt: number): boolean {
    // Don't retry if we've exceeded max attempts
    if (attempt >= this.maxAttempts) {
      return false;
    }

    // Don't retry non-operational errors
    if (!error.isOperational) {
      return false;
    }

    // Retry based on error code
    const retryableCodes = [
      ErrorCodes.TIMEOUT,
      ErrorCodes.RATE_LIMIT_EXCEEDED,
      ErrorCodes.SERVICE_UNAVAILABLE,
      ErrorCodes.EXTERNAL_SERVICE_ERROR,
      ErrorCodes.NETWORK_ERROR,
      ErrorCodes.CONNECTION_ERROR,
      ErrorCodes.TRANSACTION_ERROR
    ];

    return retryableCodes.includes(error.code as any);
  }

  getDelay(_error: AppError, attempt: number): number {
    return this.baseDelay * Math.pow(this.backoffMultiplier, attempt - 1);
  }

  getMaxAttempts(_error: AppError): number {
    return this.maxAttempts;
  }
}

/**
 * Database retry strategy
 */
export class DatabaseRetryStrategy implements RetryStrategy {
  constructor(
    private maxAttempts: number = 5,
    private baseDelay: number = 500
  ) {}

  shouldRetry(error: AppError, attempt: number): boolean {
    if (attempt >= this.maxAttempts) {
      return false;
    }

    const retryableCodes = [
      ErrorCodes.DATABASE_ERROR,
      ErrorCodes.CONNECTION_ERROR,
      ErrorCodes.TRANSACTION_ERROR,
      ErrorCodes.TIMEOUT
    ];

    return retryableCodes.includes(error.code as any);
  }

  getDelay(_error: AppError, attempt: number): number {
    // Linear backoff for database errors
    return this.baseDelay * attempt;
  }

  getMaxAttempts(_error: AppError): number {
    return this.maxAttempts;
  }
}

/**
 * API retry strategy
 */
export class ApiRetryStrategy implements RetryStrategy {
  constructor(
    private maxAttempts: number = 3,
    private baseDelay: number = 1000
  ) {}

  shouldRetry(error: AppError, attempt: number): boolean {
    if (attempt >= this.maxAttempts) {
      return false;
    }

    const retryableCodes = [
      ErrorCodes.RATE_LIMIT_EXCEEDED,
      ErrorCodes.SERVICE_UNAVAILABLE,
      ErrorCodes.EXTERNAL_SERVICE_ERROR,
      ErrorCodes.API_ERROR,
      ErrorCodes.TIMEOUT,
      ErrorCodes.NETWORK_ERROR
    ];

    return retryableCodes.includes(error.code as any);
  }

  getDelay(_error: AppError, attempt: number): number {
    // Exponential backoff for API errors
    return this.baseDelay * Math.pow(2, attempt - 1);
  }

  getMaxAttempts(_error: AppError): number {
    return this.maxAttempts;
  }
}

/**
 * File operation retry strategy
 */
export class FileRetryStrategy implements RetryStrategy {
  constructor(
    private maxAttempts: number = 2,
    private baseDelay: number = 200
  ) {}

  shouldRetry(error: AppError, attempt: number): boolean {
    if (attempt >= this.maxAttempts) {
      return false;
    }

    const retryableCodes = [
      ErrorCodes.FILE_ACCESS_DENIED,
      ErrorCodes.DISK_ERROR,
      ErrorCodes.TIMEOUT
    ];

    return retryableCodes.includes(error.code as any);
  }

  getDelay(_error: AppError, _attempt: number): number {
    // Fixed delay for file operations
    return this.baseDelay;
  }

  getMaxAttempts(_error: AppError): number {
    return this.maxAttempts;
  }
}

/**
 * Retry strategy factory
 */
export class RetryStrategyFactory {
  static createDefault(): RetryStrategy {
    return new DefaultRetryStrategy();
  }

  static createDatabase(): RetryStrategy {
    return new DatabaseRetryStrategy();
  }

  static createApi(): RetryStrategy {
    return new ApiRetryStrategy();
  }

  static createFile(): RetryStrategy {
    return new FileRetryStrategy();
  }

  static createCustom(options: {
    maxAttempts?: number;
    baseDelay?: number;
    backoffMultiplier?: number;
    retryableCodes?: string[];
  }): RetryStrategy {
    return new CustomRetryStrategy(options);
  }
}

/**
 * Custom retry strategy
 */
class CustomRetryStrategy implements RetryStrategy {
  constructor(private options: {
    maxAttempts?: number;
    baseDelay?: number;
    backoffMultiplier?: number;
    retryableCodes?: string[];
  }) {}

  shouldRetry(error: AppError, attempt: number): boolean {
    if (attempt >= (this.options.maxAttempts || 3)) {
      return false;
    }

    if (!error.isOperational) {
      return false;
    }

    const retryableCodes = this.options.retryableCodes || [];
    return retryableCodes.includes(error.code);
  }

  getDelay(_error: AppError, attempt: number): number {
    const baseDelay = this.options.baseDelay || 1000;
    const multiplier = this.options.backoffMultiplier || 2;
    return baseDelay * Math.pow(multiplier, attempt - 1);
  }

  getMaxAttempts(_error: AppError): number {
    return this.options.maxAttempts || 3;
  }
}
