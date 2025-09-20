/**
 * Custom application error class with structured error handling
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public context?: Record<string, unknown>;
  public readonly timestamp: Date;
  public readonly stack?: string;

  constructor(
    code: string,
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, unknown>
  ) {
    super(message);
    
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    this.timestamp = new Date();

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to JSON representation
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    };
  }

  /**
   * Convert error to plain object
   */
  toObject(): Record<string, unknown> {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
    };
  }

  /**
   * Check if error is of a specific type
   */
  isTypeOf(code: string): boolean {
    return this.code === code;
  }

  /**
   * Check if error is operational (recoverable)
   */
  isOperationalError(): boolean {
    return this.isOperational;
  }

  /**
   * Get error severity level
   */
  getSeverity(): 'low' | 'medium' | 'high' | 'critical' {
    if (this.statusCode >= 500) return 'critical';
    if (this.statusCode >= 400) return 'high';
    if (this.statusCode >= 300) return 'medium';
    return 'low';
  }
}
