/**
 * Optimized AppError with lazy serialization and memory efficiency
 */

export interface OptimizedAppErrorOptions {
  code: string;
  message: string;
  statusCode?: number;
  isOperational?: boolean;
  context?: Record<string, unknown>;
}

export class OptimizedAppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public context?: Record<string, unknown>;
  public readonly timestamp: Date;
  public readonly stack?: string;

  // Lazy serialization cache
  private _serialized?: string;
  private _lightSerialized?: string;
  private _objectSerialized?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, unknown>
  ) {
    super(message);
    
    this.name = 'OptimizedAppError';
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
   * Convert error to JSON representation (lazy)
   */
  toJSON(): Record<string, unknown> {
    if (!this._serialized) {
      this._serialized = JSON.stringify({
        name: this.name,
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        isOperational: this.isOperational,
        context: this.context,
        timestamp: this.timestamp.toISOString(),
        stack: this.stack,
      });
    }
    return JSON.parse(this._serialized);
  }

  /**
   * Convert error to plain object (lazy)
   */
  toObject(): Record<string, unknown> {
    if (!this._objectSerialized) {
      this._objectSerialized = {
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        isOperational: this.isOperational,
        context: this.context,
        timestamp: this.timestamp.toISOString(),
      };
    }
    return this._objectSerialized;
  }

  /**
   * Lightweight JSON representation (lazy)
   */
  toJSONLight(): Record<string, unknown> {
    if (!this._lightSerialized) {
      this._lightSerialized = JSON.stringify({
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        timestamp: this.timestamp.toISOString(),
      });
    }
    return JSON.parse(this._lightSerialized);
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

  /**
   * Clear serialization cache to free memory
   */
  clearCache(): void {
    this._serialized = undefined;
    this._lightSerialized = undefined;
    this._objectSerialized = undefined;
  }

  /**
   * Get memory usage estimate
   */
  getMemoryUsage(): number {
    let size = 0;
    
    // Basic properties
    size += this.name.length * 2; // Unicode
    size += this.code.length * 2;
    size += this.message.length * 2;
    size += 8; // statusCode (number)
    size += 1; // isOperational (boolean)
    size += 8; // timestamp (Date)
    
    // Context
    if (this.context) {
      size += JSON.stringify(this.context).length * 2;
    }
    
    // Stack
    if (this.stack) {
      size += this.stack.length * 2;
    }
    
    // Cached serializations
    if (this._serialized) {
      size += this._serialized.length * 2;
    }
    if (this._lightSerialized) {
      size += this._lightSerialized.length * 2;
    }
    if (this._objectSerialized) {
      size += JSON.stringify(this._objectSerialized).length * 2;
    }
    
    return size;
  }

  /**
   * Clone error with new context
   */
  clone(newContext?: Record<string, unknown>): OptimizedAppError {
    const cloned = new OptimizedAppError(
      this.code,
      this.message,
      this.statusCode,
      this.isOperational,
      newContext || this.context
    );
    
    // Copy stack if available
    if (this.stack) {
      Object.defineProperty(cloned, 'stack', {
        value: this.stack,
        writable: false,
        enumerable: false,
        configurable: false
      });
    }
    
    return cloned;
  }

  /**
   * Merge context with existing context
   */
  mergeContext(additionalContext: Record<string, unknown>): void {
    this.context = {
      ...this.context,
      ...additionalContext,
    };
    
    // Clear cache since context changed
    this.clearCache();
  }
}
