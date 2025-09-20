import { AppError } from '../core/AppError';
import { ErrorCache, CachedError } from './ErrorCache';

export interface DeduplicationOptions {
  enabled?: boolean;
  ttl?: number;
  maxSize?: number;
  similarityThreshold?: number;
  onDuplicate?: (error: AppError, cachedError: CachedError) => void;
  onNewError?: (error: AppError) => void;
}

export interface DeduplicationResult {
  isDuplicate: boolean;
  cachedError?: CachedError;
  shouldLog: boolean;
  shouldAlert: boolean;
  deduplicationKey: string;
}

/**
 * Error deduplication service
 * 
 * @example
 * ```typescript
 * import { DeduplicationService } from '@osmanekrem/error-handler/cache';
 * 
 * const deduplication = new DeduplicationService({
 *   enabled: true,
 *   ttl: 300000, // 5 minutes
 *   onDuplicate: (error, cached) => {
 *     console.log(`Duplicate error: ${cached.count} occurrences`);
 *   }
 * });
 * 
 * const result = deduplication.processError(error);
 * if (result.isDuplicate) {
 *   // Handle duplicate error
 * }
 * ```
 */
export class DeduplicationService {
  private cache: ErrorCache;
  private options: Required<DeduplicationOptions>;

  constructor(options: DeduplicationOptions = {}) {
    this.options = {
      enabled: true,
      ttl: 300000, // 5 minutes
      maxSize: 1000,
      similarityThreshold: 0.8,
      onDuplicate: () => {},
      onNewError: () => {},
      ...options
    };

    this.cache = new ErrorCache({
      ttl: this.options.ttl,
      maxSize: this.options.maxSize,
      similarityThreshold: this.options.similarityThreshold
    });
  }

  /**
   * Process an error for deduplication
   */
  processError(error: AppError): DeduplicationResult {
    if (!this.options.enabled) {
      return {
        isDuplicate: false,
        shouldLog: true,
        shouldAlert: true,
        deduplicationKey: this.generateKey(error)
      };
    }

    const { isDuplicate, cachedError } = this.cache.addError(error);
    const key = this.generateKey(error);

    if (isDuplicate && cachedError) {
      // Call duplicate callback
      this.options.onDuplicate(error, cachedError);

      return {
        isDuplicate: true,
        cachedError,
        shouldLog: this.shouldLogDuplicate(cachedError),
        shouldAlert: this.shouldAlertDuplicate(cachedError),
        deduplicationKey: key
      };
    } else {
      // Call new error callback
      this.options.onNewError(error);

      return {
        isDuplicate: false,
        shouldLog: true,
        shouldAlert: true,
        deduplicationKey: key
      };
    }
  }

  /**
   * Check if error is duplicate without processing
   */
  isDuplicate(error: AppError): boolean {
    return this.cache.isDuplicate(error);
  }

  /**
   * Get deduplication statistics
   */
  getStats() {
    return this.cache.getStats();
  }

  /**
   * Get most frequent errors
   */
  getMostFrequentErrors(limit: number = 10): CachedError[] {
    return this.cache.getMostFrequentErrors(limit);
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 10): CachedError[] {
    return this.cache.getRecentErrors(limit);
  }

  /**
   * Clear expired errors
   */
  clearExpired(): number {
    return this.cache.clearExpired();
  }

  /**
   * Clear all errors
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Enable deduplication
   */
  enable(): void {
    this.options.enabled = true;
  }

  /**
   * Disable deduplication
   */
  disable(): void {
    this.options.enabled = false;
  }

  /**
   * Update deduplication options
   */
  updateOptions(options: Partial<DeduplicationOptions>): void {
    this.options = { ...this.options, ...options };
    
    // Recreate cache with new options
    this.cache = new ErrorCache({
      ttl: this.options.ttl,
      maxSize: this.options.maxSize,
      similarityThreshold: this.options.similarityThreshold
    });
  }

  /**
   * Generate deduplication key for error
   */
  private generateKey(error: AppError): string {
    const context = error.context ? JSON.stringify(error.context) : '';
    return `${error.code}:${error.message}:${context}`;
  }

  /**
   * Determine if duplicate error should be logged
   */
  private shouldLogDuplicate(cachedError: CachedError): boolean {
    // Log every 10th occurrence or if it's been more than 5 minutes
    const now = Date.now();
    const lastLogTime = cachedError.lastOccurrence.getTime();
    const timeSinceLastLog = now - lastLogTime;
    
    return cachedError.count % 10 === 0 || timeSinceLastLog > 300000; // 5 minutes
  }

  /**
   * Determine if duplicate error should trigger alert
   */
  private shouldAlertDuplicate(cachedError: CachedError): boolean {
    // Alert on first occurrence, then every 50th occurrence
    return cachedError.count === 1 || cachedError.count % 50 === 0;
  }
}
