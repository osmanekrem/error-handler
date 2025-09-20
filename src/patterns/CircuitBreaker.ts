import { createError } from '../factories/createError';

export interface CircuitBreakerOptions {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
  halfOpenMaxCalls: number;
}

export interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime?: Date;
  nextAttemptTime?: Date;
  successCount: number;
  callCount: number;
}

/**
 * Circuit breaker pattern implementation for error handling
 */
export class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime?: Date;
  private nextAttemptTime?: Date;
  private successCount = 0;
  private callCount = 0;
  private options: CircuitBreakerOptions;

  constructor(options: Partial<CircuitBreakerOptions> = {}) {
    this.options = {
      failureThreshold: 5,
      recoveryTimeout: 60000, // 1 minute
      monitoringPeriod: 10000, // 10 seconds
      halfOpenMaxCalls: 3,
      ...options,
    };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>, context?: string): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
        this.callCount = 0;
      } else {
        throw createError.serviceUnavailable(
          'Circuit breaker is OPEN',
          { 
            context,
            nextAttemptTime: this.nextAttemptTime,
            failureCount: this.failureCount,
          }
        );
      }
    }

    if (this.state === 'HALF_OPEN' && this.callCount >= this.options.halfOpenMaxCalls) {
      throw createError.serviceUnavailable(
        'Circuit breaker is HALF_OPEN with max calls reached',
        { 
          context,
          callCount: this.callCount,
          maxCalls: this.options.halfOpenMaxCalls,
        }
      );
    }

    try {
      this.callCount++;
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error, context);
      throw error;
    }
  }

  /**
   * Get current circuit breaker state
   */
  getState(): CircuitBreakerState {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
      successCount: this.successCount,
      callCount: this.callCount,
    };
  }

  /**
   * Reset circuit breaker to CLOSED state
   */
  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.callCount = 0;
    this.lastFailureTime = undefined;
    this.nextAttemptTime = undefined;
  }

  /**
   * Check if circuit breaker is healthy
   */
  isHealthy(): boolean {
    return this.state === 'CLOSED' || this.state === 'HALF_OPEN';
  }

  /**
   * Get circuit breaker statistics
   */
  getStats() {
    const totalCalls = this.callCount;
    const successRate = totalCalls > 0 ? (this.successCount / totalCalls) * 100 : 0;
    const failureRate = totalCalls > 0 ? (this.failureCount / totalCalls) * 100 : 0;

    return {
      state: this.state,
      totalCalls,
      successCount: this.successCount,
      failureCount: this.failureCount,
      successRate: Math.round(successRate * 100) / 100,
      failureRate: Math.round(failureRate * 100) / 100,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
      isHealthy: this.isHealthy(),
    };
  }

  private onSuccess(): void {
    this.successCount++;
    
    if (this.state === 'HALF_OPEN') {
      // If we get enough successes in half-open state, close the circuit
      if (this.successCount >= this.options.halfOpenMaxCalls) {
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.nextAttemptTime = undefined;
      }
    } else if (this.state === 'CLOSED') {
      // Reset failure count on success in closed state
      this.failureCount = 0;
    }
  }

  private onFailure(_error: unknown, _context?: string): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.state === 'CLOSED') {
      if (this.failureCount >= this.options.failureThreshold) {
        this.state = 'OPEN';
        this.nextAttemptTime = new Date(Date.now() + this.options.recoveryTimeout);
      }
    } else if (this.state === 'HALF_OPEN') {
      // Any failure in half-open state opens the circuit
      this.state = 'OPEN';
      this.nextAttemptTime = new Date(Date.now() + this.options.recoveryTimeout);
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.nextAttemptTime) return false;
    return Date.now() >= this.nextAttemptTime.getTime();
  }
}
