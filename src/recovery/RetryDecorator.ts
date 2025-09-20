import { AppError } from '../core/AppError';
import { isRetryableAppError } from '../handlers/isAppError';

export interface RetryOptions {
  maxAttempts: number;
  backoff: 'linear' | 'exponential' | 'fixed';
  delay: number;
  retryableErrors?: string[];
  onRetry?: (error: AppError, attempt: number) => void;
  onMaxRetriesExceeded?: (error: AppError, attempts: number) => void;
}

export interface RetryResult<T> {
  result: T;
  attempts: number;
  errors: AppError[];
}

/**
 * Retry decorator for automatic error recovery
 * 
 * @example
 * ```typescript
 * import { Retryable } from '@osmanekrem/error-handler/recovery';
 * 
 * class UserService {
 *   @Retryable({ maxAttempts: 3, backoff: 'exponential', delay: 1000 })
 *   async getUser(id: string) {
 *     // Risky operation that might fail
 *     return await fetchUser(id);
 *   }
 * }
 * ```
 */
export function Retryable(options: RetryOptions) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const retryOptions: RetryOptions = {
        ...options,
        maxAttempts: options.maxAttempts ?? 3,
        backoff: options.backoff ?? 'exponential',
        delay: options.delay ?? 1000,
        retryableErrors: options.retryableErrors ?? []
      };

      let lastError: AppError | null = null;
      const errors: AppError[] = [];
      let attempt = 0;

      while (attempt < retryOptions.maxAttempts) {
        try {
          const result = await originalMethod.apply(this, args);
          return {
            result,
            attempts: attempt + 1,
            errors
          } as RetryResult<typeof result>;
        } catch (error) {
          attempt++;
          lastError = error as AppError;
          errors.push(lastError);

          // Check if error is retryable
          if (!isRetryableError(lastError, retryOptions.retryableErrors)) {
            throw lastError;
          }

          // Check if we've exceeded max attempts
          if (attempt >= retryOptions.maxAttempts) {
            if (retryOptions.onMaxRetriesExceeded) {
              retryOptions.onMaxRetriesExceeded(lastError, attempt);
            }
            throw lastError;
          }

          // Call onRetry callback
          if (retryOptions.onRetry) {
            retryOptions.onRetry(lastError, attempt);
          }

          // Calculate delay based on backoff strategy
          const delay = calculateDelay(retryOptions.delay, attempt, retryOptions.backoff);
          await sleep(delay);
        }
      }

      throw lastError;
    };

    return descriptor;
  };
}

/**
 * Retry function for manual retry logic
 * 
 * @example
 * ```typescript
 * import { retry } from '@osmanekrem/error-handler/recovery';
 * 
 * const result = await retry(
 *   () => riskyOperation(),
 *   { maxAttempts: 3, backoff: 'exponential', delay: 1000 }
 * );
 * ```
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<RetryResult<T>> {
    const retryOptions: RetryOptions = {
      ...options,
      maxAttempts: options.maxAttempts ?? 3,
      backoff: options.backoff ?? 'exponential',
      delay: options.delay ?? 1000,
      retryableErrors: options.retryableErrors ?? []
    };

  let lastError: AppError | null = null;
  const errors: AppError[] = [];
  let attempt = 0;

  while (attempt < retryOptions.maxAttempts) {
    try {
      const result = await fn();
      return {
        result,
        attempts: attempt + 1,
        errors
      };
    } catch (error) {
      attempt++;
      lastError = error as AppError;
      errors.push(lastError);

      // Check if error is retryable
      if (!isRetryableError(lastError, retryOptions.retryableErrors)) {
        throw lastError;
      }

      // Check if we've exceeded max attempts
      if (attempt >= retryOptions.maxAttempts) {
        if (retryOptions.onMaxRetriesExceeded) {
          retryOptions.onMaxRetriesExceeded(lastError, attempt);
        }
        throw lastError;
      }

      // Call onRetry callback
      if (retryOptions.onRetry) {
        retryOptions.onRetry(lastError, attempt);
      }

      // Calculate delay based on backoff strategy
      const delay = calculateDelay(retryOptions.delay, attempt, retryOptions.backoff);
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: AppError, retryableErrors: string[] = []): boolean {
  // Check if error is retryable by default
  if (isRetryableAppError(error)) {
    return true;
  }

  // Check if error code is in retryable errors list
  if (retryableErrors.length > 0 && 'code' in error && retryableErrors.includes((error as any).code)) {
    return true;
  }

  return false;
}

/**
 * Calculate delay based on backoff strategy
 */
function calculateDelay(baseDelay: number, attempt: number, strategy: string): number {
  switch (strategy) {
    case 'linear':
      return baseDelay * attempt;
    case 'exponential':
      return baseDelay * Math.pow(2, attempt - 1);
    case 'fixed':
    default:
      return baseDelay;
  }
}

/**
 * Sleep utility function
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
