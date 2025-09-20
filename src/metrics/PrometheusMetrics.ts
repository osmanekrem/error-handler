import { AppError } from '../core/AppError';
import { ErrorCodeMetadata } from '../core/ErrorCodes';

export interface PrometheusMetricsOptions {
  prefix?: string;
  customLabels?: Record<string, string>;
  enableHistogram?: boolean;
  enableCounter?: boolean;
  enableGauge?: boolean;
}

/**
 * Prometheus metrics integration for error monitoring
 * 
 * @example
 * ```typescript
 * import { PrometheusMetrics } from '@osmanekrem/error-handler/metrics';
 * 
 * const prometheus = new PrometheusMetrics({
 *   prefix: 'app_errors',
 *   customLabels: { service: 'user-service' }
 * });
 * 
 * // Record error metrics
 * prometheus.recordError(error, { userId: '123' });
 * 
 * // Get metrics for Prometheus scraping
 * const metrics = prometheus.getMetrics();
 * ```
 */
export class PrometheusMetrics {
  private errorCounter = new Map<string, number>();
  private errorHistogram = new Map<string, number[]>();
  private errorGauge = new Map<string, number>();
  private options: PrometheusMetricsOptions;

  constructor(options: PrometheusMetricsOptions = {}) {
    this.options = {
      prefix: 'app_errors',
      customLabels: {},
      enableHistogram: true,
      enableCounter: true,
      enableGauge: true,
      ...options
    };
  }

  /**
   * Record an error for Prometheus metrics
   */
  recordError(
    error: AppError, 
    context?: Record<string, unknown>
  ): void {
    const labels = this.buildLabels(error, context);
    const key = this.buildKey(labels);

    if (this.options.enableCounter) {
      this.incrementCounter(key);
    }

    if (this.options.enableHistogram) {
      this.recordHistogram(key, error);
    }

    if (this.options.enableGauge) {
      this.updateGauge(key, error);
    }
  }

  /**
   * Get Prometheus-formatted metrics
   */
  getMetrics(): string {
    const lines: string[] = [];
    
    if (this.options.enableCounter) {
      lines.push(...this.formatCounters());
    }

    if (this.options.enableHistogram) {
      lines.push(...this.formatHistograms());
    }

    if (this.options.enableGauge) {
      lines.push(...this.formatGauges());
    }

    return lines.join('\n');
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.errorCounter.clear();
    this.errorHistogram.clear();
    this.errorGauge.clear();
  }

  private buildLabels(error: AppError, context?: Record<string, unknown>): Record<string, string> {
    const metadata = ErrorCodeMetadata[error.code as keyof typeof ErrorCodeMetadata];
    
    return {
      code: error.code,
      severity: error.getSeverity(),
      category: metadata?.category || 'unknown',
      status_code: error.statusCode.toString(),
      is_operational: error.isOperational.toString(),
      ...this.options.customLabels,
      ...Object.fromEntries(
        Object.entries(context || {}).map(([key, value]) => [key, String(value)])
      )
    };
  }

  private buildKey(labels: Record<string, string>): string {
    return Object.entries(labels)
      .map(([key, value]) => `${key}="${value}"`)
      .join(',');
  }

  private incrementCounter(key: string): void {
    const count = this.errorCounter.get(key) || 0;
    this.errorCounter.set(key, count + 1);
  }

  private recordHistogram(key: string, error: AppError): void {
    const values = this.errorHistogram.get(key) || [];
    values.push(error.statusCode);
    this.errorHistogram.set(key, values);
  }

  private updateGauge(key: string, error: AppError): void {
    const severity = error.getSeverity();
    const severityValue = this.getSeverityValue(severity);
    this.errorGauge.set(key, severityValue);
  }

  private getSeverityValue(severity: string): number {
    switch (severity) {
      case 'low': return 1;
      case 'medium': return 2;
      case 'high': return 3;
      case 'critical': return 4;
      default: return 0;
    }
  }

  private formatCounters(): string[] {
    const lines: string[] = [];
    const metricName = `${this.options.prefix}_total`;

    lines.push(`# HELP ${metricName} Total number of errors`);
    lines.push(`# TYPE ${metricName} counter`);

    for (const [key, count] of this.errorCounter) {
      lines.push(`${metricName}{${key}} ${count}`);
    }

    return lines;
  }

  private formatHistograms(): string[] {
    const lines: string[] = [];
    const metricName = `${this.options.prefix}_status_code_histogram`;

    lines.push(`# HELP ${metricName} Error status code distribution`);
    lines.push(`# TYPE ${metricName} histogram`);

    for (const [key, values] of this.errorHistogram) {
      const buckets = this.calculateBuckets(values);
      const sum = values.reduce((a, b) => a + b, 0);
      const count = values.length;

      lines.push(`${metricName}_bucket{${key},le="200"} ${buckets[200] || 0}`);
      lines.push(`${metricName}_bucket{${key},le="400"} ${buckets[400] || 0}`);
      lines.push(`${metricName}_bucket{${key},le="500"} ${buckets[500] || 0}`);
      lines.push(`${metricName}_bucket{${key},le="+Inf"} ${count}`);
      lines.push(`${metricName}_sum{${key}} ${sum}`);
      lines.push(`${metricName}_count{${key}} ${count}`);
    }

    return lines;
  }

  private formatGauges(): string[] {
    const lines: string[] = [];
    const metricName = `${this.options.prefix}_severity_gauge`;

    lines.push(`# HELP ${metricName} Error severity gauge`);
    lines.push(`# TYPE ${metricName} gauge`);

    for (const [key, value] of this.errorGauge) {
      lines.push(`${metricName}{${key}} ${value}`);
    }

    return lines;
  }

  private calculateBuckets(values: number[]): Record<number, number> {
    const buckets: Record<number, number> = { 200: 0, 400: 0, 500: 0 };
    
    for (const value of values) {
      if (value < 200) buckets[200]++;
      else if (value < 400) buckets[400]++;
      else if (value < 500) buckets[500]++;
      else buckets[500]++;
    }

    return buckets;
  }
}
