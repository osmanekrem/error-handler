import { AppError } from '../core/AppError';
import { ErrorCodeMetadata } from '../core/ErrorCodes';

export interface ErrorMetricsOptions {
  enablePrometheus?: boolean;
  customLabels?: Record<string, string>;
  retentionPeriod?: number; // in milliseconds
  maxErrors?: number;
}

export interface ErrorStats {
  totalErrors: number;
  errorsByCode: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  errorsByCategory: Record<string, number>;
  errorRate: number; // errors per minute
  lastErrorTime?: Date;
  topErrors: Array<{ code: string; count: number; percentage: number }>;
}

export interface ErrorRecord {
  error: AppError;
  timestamp: Date;
  context?: Record<string, unknown>;
  service?: string;
  userId?: string;
  requestId?: string;
}

/**
 * Error metrics collection and analysis
 * 
 * @example
 * ```typescript
 * import { ErrorMetrics } from '@osmanekrem/error-handler/metrics';
 * 
 * const metrics = new ErrorMetrics({
 *   enablePrometheus: true,
 *   customLabels: { service: 'user-service' }
 * });
 * 
 * // Record an error
 * metrics.recordError(error, { service: 'user-service', userId: '123' });
 * 
 * // Get statistics
 * const stats = metrics.getStats();
 * console.log('Error rate:', stats.errorRate);
 * ```
 */
export class ErrorMetrics {
  private errorRecords: ErrorRecord[] = [];
  private errorCounts = new Map<string, number>();
  private errorRates = new Map<string, number>();
  private lastResetTime = Date.now();
  private options: ErrorMetricsOptions;

  constructor(options: ErrorMetricsOptions = {}) {
    this.options = {
      enablePrometheus: false,
      customLabels: {},
      retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
      maxErrors: 10000,
      ...options
    };
  }

  /**
   * Record an error with optional context
   */
  recordError(
    error: AppError, 
    context?: Record<string, unknown>
  ): void {
    const record: ErrorRecord = {
      error,
      timestamp: new Date(),
      context,
      service: context?.service as string,
      userId: context?.userId as string,
      requestId: context?.requestId as string
    };

    // Add to records
    this.errorRecords.push(record);

    // Update counts
    this.updateErrorCounts(error);

    // Cleanup old records
    this.cleanupOldRecords();

    // Limit records if needed
    if (this.errorRecords.length > this.options.maxErrors!) {
      this.errorRecords = this.errorRecords.slice(-this.options.maxErrors!);
    }
  }

  /**
   * Get comprehensive error statistics
   */
  getStats(): ErrorStats {
    const now = Date.now();
    const timeWindow = now - this.lastResetTime;
    const errorRate = timeWindow > 0 ? (this.errorRecords.length / (timeWindow / 60000)) : 0;

    const errorsByCode: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};
    const errorsByCategory: Record<string, number> = {};

    for (const record of this.errorRecords) {
      const { error } = record;
      
      // Count by code
      errorsByCode[error.code] = (errorsByCode[error.code] || 0) + 1;
      
      // Count by severity and category - use metadata if available
      const metadata = ErrorCodeMetadata[error.code as keyof typeof ErrorCodeMetadata];
      const severity = metadata?.severity || error.getSeverity();
      const category = metadata?.category || 'unknown';
      
      errorsBySeverity[severity] = (errorsBySeverity[severity] || 0) + 1;
      errorsByCategory[category] = (errorsByCategory[category] || 0) + 1;
    }

    // Get top errors
    const topErrors = Object.entries(errorsByCode)
      .map(([code, count]) => ({
        code,
        count,
        percentage: (count / this.errorRecords.length) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalErrors: this.errorRecords.length,
      errorsByCode,
      errorsBySeverity,
      errorsByCategory,
      errorRate: Math.round(errorRate * 100) / 100,
      lastErrorTime: this.errorRecords.length > 0 ? this.errorRecords[this.errorRecords.length - 1].timestamp : undefined,
      topErrors
    };
  }

  /**
   * Get errors by time range
   */
  getErrorsByTimeRange(startTime: Date, endTime: Date): ErrorRecord[] {
    return this.errorRecords.filter(record => 
      record.timestamp >= startTime && record.timestamp <= endTime
    );
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: 'low' | 'medium' | 'high' | 'critical'): ErrorRecord[] {
    return this.errorRecords.filter(record => {
      const metadata = ErrorCodeMetadata[record.error.code as keyof typeof ErrorCodeMetadata];
      const errorSeverity = metadata?.severity || record.error.getSeverity();
      return errorSeverity === severity;
    });
  }

  /**
   * Get errors by code
   */
  getErrorsByCode(code: string): ErrorRecord[] {
    return this.errorRecords.filter(record => record.error.code === code);
  }

  /**
   * Get recent errors (last N minutes)
   */
  getRecentErrors(minutes: number = 60): ErrorRecord[] {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
    return this.errorRecords.filter(record => record.timestamp >= cutoffTime);
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.errorRecords = [];
    this.errorCounts.clear();
    this.errorRates.clear();
    this.lastResetTime = Date.now();
  }

  /**
   * Export metrics for external monitoring systems
   */
  exportMetrics(): Record<string, unknown> {
    const stats = this.getStats();
    return {
      timestamp: new Date().toISOString(),
      stats,
      customLabels: this.options.customLabels,
      retentionPeriod: this.options.retentionPeriod,
      maxErrors: this.options.maxErrors
    };
  }

  private updateErrorCounts(error: AppError): void {
    const code = error.code;
    const count = this.errorCounts.get(code) || 0;
    this.errorCounts.set(code, count + 1);

    // Update error rate
    const now = Date.now();
    const timeWindow = now - this.lastResetTime;
    const rate = timeWindow > 0 ? (count + 1) / (timeWindow / 60000) : 0;
    this.errorRates.set(code, rate);
  }

  private cleanupOldRecords(): void {
    if (!this.options.retentionPeriod) return;

    const cutoffTime = new Date(Date.now() - this.options.retentionPeriod);
    this.errorRecords = this.errorRecords.filter(record => 
      record.timestamp >= cutoffTime
    );
  }
}
