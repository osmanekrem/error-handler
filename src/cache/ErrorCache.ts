import { AppError } from '../core/AppError';

export interface ErrorCacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of errors to cache
  keyGenerator?: (error: AppError) => string;
  similarityThreshold?: number; // 0-1, how similar errors need to be to be considered duplicates
}

export interface CachedError {
  error: AppError;
  timestamp: Date;
  count: number;
  lastOccurrence: Date;
  key: string;
}

export interface ErrorCacheStats {
  totalErrors: number;
  uniqueErrors: number;
  duplicateErrors: number;
  hitRate: number;
  oldestError?: Date;
  newestError?: Date;
}

/**
 * Error cache for deduplication and error tracking
 * 
 * @example
 * ```typescript
 * import { ErrorCache } from '@osmanekrem/error-handler/cache';
 * 
 * const cache = new ErrorCache({
 *   ttl: 300000, // 5 minutes
 *   maxSize: 1000
 * });
 * 
 * const error = createError.database('Query failed');
 * const cached = cache.addError(error);
 * console.log('Is duplicate:', cached.isDuplicate);
 * ```
 */
export class ErrorCache {
  private cache = new Map<string, CachedError>();
  private options: Required<ErrorCacheOptions>;

  constructor(options: ErrorCacheOptions = {}) {
    this.options = {
      ttl: 300000, // 5 minutes
      maxSize: 1000,
      keyGenerator: this.defaultKeyGenerator,
      similarityThreshold: 0.8,
      ...options
    };
  }

  /**
   * Add an error to the cache
   */
  addError(error: AppError): { isDuplicate: boolean; cachedError: CachedError } {
    const key = this.options.keyGenerator(error);
    const now = new Date();

    // Check if error already exists
    const existing = this.cache.get(key);
    if (existing) {
      // Update existing error
      existing.count++;
      existing.lastOccurrence = now;
      return { isDuplicate: true, cachedError: existing };
    }

    // Check for similar errors
    const similarError = this.findSimilarError(error);
    if (similarError) {
      similarError.count++;
      similarError.lastOccurrence = now;
      return { isDuplicate: true, cachedError: similarError };
    }

    // Add new error
    const cachedError: CachedError = {
      error,
      timestamp: now,
      count: 1,
      lastOccurrence: now,
      key
    };

    this.cache.set(key, cachedError);
    this.cleanup();

    return { isDuplicate: false, cachedError };
  }

  /**
   * Get error by key
   */
  getError(key: string): CachedError | undefined {
    return this.cache.get(key);
  }

  /**
   * Get all cached errors
   */
  getAllErrors(): CachedError[] {
    return Array.from(this.cache.values());
  }

  /**
   * Get errors by code
   */
  getErrorsByCode(code: string): CachedError[] {
    return Array.from(this.cache.values()).filter(cached => cached.error.code === code);
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: 'low' | 'medium' | 'high' | 'critical'): CachedError[] {
    return Array.from(this.cache.values()).filter(cached => cached.error.getSeverity() === severity);
  }

  /**
   * Get most frequent errors
   */
  getMostFrequentErrors(limit: number = 10): CachedError[] {
    return Array.from(this.cache.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 10): CachedError[] {
    return Array.from(this.cache.values())
      .sort((a, b) => b.lastOccurrence.getTime() - a.lastOccurrence.getTime())
      .slice(0, limit);
  }

  /**
   * Check if error is duplicate
   */
  isDuplicate(error: AppError): boolean {
    const key = this.options.keyGenerator(error);
    return this.cache.has(key) || this.findSimilarError(error) !== null;
  }

  /**
   * Get cache statistics
   */
  getStats(): ErrorCacheStats {
    const errors = Array.from(this.cache.values());
    const totalErrors = errors.reduce((sum, cached) => sum + cached.count, 0);
    const uniqueErrors = errors.length;
    const duplicateErrors = totalErrors - uniqueErrors;
    const hitRate = totalErrors > 0 ? duplicateErrors / totalErrors : 0;

    const timestamps = errors.map(cached => cached.timestamp);
    const oldestError = timestamps.length > 0 ? new Date(Math.min(...timestamps.map(t => t.getTime()))) : undefined;
    const newestError = timestamps.length > 0 ? new Date(Math.max(...timestamps.map(t => t.getTime()))) : undefined;

    return {
      totalErrors,
      uniqueErrors,
      duplicateErrors,
      hitRate: Math.round(hitRate * 100) / 100,
      oldestError,
      newestError
    };
  }

  /**
   * Clear expired errors
   */
  clearExpired(): number {
    const now = Date.now();
    let cleared = 0;

    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp.getTime() > this.options.ttl) {
        this.cache.delete(key);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Clear all errors
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Remove error by key
   */
  removeError(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Default key generator
   */
  private defaultKeyGenerator(error: AppError): string {
    const context = error.context ? JSON.stringify(error.context) : '';
    return `${error.code}:${error.message}:${context}`;
  }

  /**
   * Find similar error using similarity threshold
   */
  private findSimilarError(error: AppError): CachedError | null {
    for (const cached of this.cache.values()) {
      const similarity = this.calculateSimilarity(error, cached.error);
      if (similarity >= this.options.similarityThreshold) {
        return cached;
      }
    }
    return null;
  }

  /**
   * Calculate similarity between two errors
   */
  private calculateSimilarity(error1: AppError, error2: AppError): number {
    let score = 0;
    let factors = 0;

    // Code similarity (40% weight)
    if (error1.code === error2.code) {
      score += 0.4;
    }
    factors += 0.4;

    // Message similarity (30% weight)
    const messageSimilarity = this.calculateStringSimilarity(error1.message, error2.message);
    score += messageSimilarity * 0.3;
    factors += 0.3;

    // Status code similarity (20% weight)
    if (error1.statusCode === error2.statusCode) {
      score += 0.2;
    }
    factors += 0.2;

    // Context similarity (10% weight)
    const contextSimilarity = this.calculateContextSimilarity(error1.context, error2.context);
    score += contextSimilarity * 0.1;
    factors += 0.1;

    return factors > 0 ? score / factors : 0;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1;

    const distance = this.levenshteinDistance(str1, str2);
    return 1 - (distance / maxLength);
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Calculate context similarity
   */
  private calculateContextSimilarity(context1?: Record<string, unknown>, context2?: Record<string, unknown>): number {
    if (!context1 && !context2) return 1;
    if (!context1 || !context2) return 0;

    const keys1 = Object.keys(context1);
    const keys2 = Object.keys(context2);
    const commonKeys = keys1.filter(key => keys2.includes(key));

    if (commonKeys.length === 0) return 0;

    let similarValues = 0;
    for (const key of commonKeys) {
      if (JSON.stringify(context1[key]) === JSON.stringify(context2[key])) {
        similarValues++;
      }
    }

    return similarValues / commonKeys.length;
  }

  /**
   * Cleanup cache based on size and TTL
   */
  private cleanup(): void {
    // Remove expired errors
    this.clearExpired();

    // Remove oldest errors if cache is too large
    if (this.cache.size > this.options.maxSize) {
      const errors = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp.getTime() - b[1].timestamp.getTime());

      const toRemove = errors.slice(0, this.cache.size - this.options.maxSize);
      for (const [key] of toRemove) {
        this.cache.delete(key);
      }
    }
  }
}
