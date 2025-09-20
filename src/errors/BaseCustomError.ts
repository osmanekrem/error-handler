import { AppError } from '../core/AppError';

/**
 * Base class for custom error types
 * Provides common functionality for domain-specific errors
 */
export abstract class BaseCustomError extends AppError {
  public readonly domain: string;
  public readonly subCode?: string;

  constructor(
    code: string,
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, unknown>,
    domain: string = 'general',
    subCode?: string
  ) {
    super(code, message, statusCode, isOperational, context);
    this.domain = domain;
    this.subCode = subCode;
  }

  /**
   * Get error category based on domain
   */
  getCategory(): string {
    return this.domain;
  }

  /**
   * Get full error code including domain
   */
  getFullCode(): string {
    return this.subCode ? `${this.domain}.${this.code}.${this.subCode}` : `${this.domain}.${this.code}`;
  }

  /**
   * Check if error belongs to specific domain
   */
  isDomain(domain: string): boolean {
    return this.domain === domain;
  }

  /**
   * Get error summary for logging
   */
  getSummary(): Record<string, unknown> {
    return {
      code: this.code,
      fullCode: this.getFullCode(),
      domain: this.domain,
      subCode: this.subCode,
      message: this.message,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
      severity: this.getSeverity(),
      timestamp: this.timestamp
    };
  }
}
