import { AppError } from '../core/AppError';
import { DatabaseError } from '../errors/DatabaseError';
import { ValidationError } from '../errors/ValidationError';
import { BusinessError } from '../errors/BusinessError';

export interface SerializationOptions {
  includeStack?: boolean;
  includeContext?: boolean;
  includeMetadata?: boolean;
  customFields?: string[];
  excludeFields?: string[];
  maxDepth?: number;
}

export interface SerializedError {
  type: 'AppError' | 'DatabaseError' | 'ValidationError' | 'BusinessError';
  code: string;
  message: string;
  statusCode: number;
  isOperational: boolean;
  timestamp: string;
  stack?: string;
  context?: Record<string, unknown>;
  metadata?: {
    severity: string;
    category?: string;
    domain?: string;
    subCode?: string;
  };
  customFields?: Record<string, unknown>;
}

/**
 * Error serializer for converting errors to JSON and back
 * 
 * @example
 * ```typescript
 * import { ErrorSerializer } from '@osmanekrem/error-handler/serialization';
 * 
 * const serializer = new ErrorSerializer({
 *   includeStack: true,
 *   includeContext: true
 * });
 * 
 * const serialized = serializer.serialize(error);
 * const deserialized = serializer.deserialize(serialized);
 * ```
 */
export class ErrorSerializer {
  private options: Required<SerializationOptions>;

  constructor(options: SerializationOptions = {}) {
    this.options = {
      includeStack: false,
      includeContext: true,
      includeMetadata: true,
      customFields: [],
      excludeFields: [],
      maxDepth: 10,
      ...options
    };
  }

  /**
   * Serialize error to JSON
   */
  serialize(error: AppError): SerializedError {
    const serialized: SerializedError = {
      type: this.getErrorType(error),
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      isOperational: error.isOperational,
      timestamp: error.timestamp.toISOString()
    };

    // Add stack trace if requested
    if (this.options.includeStack && error.stack) {
      serialized.stack = error.stack;
    }

    // Add context if requested
    if (this.options.includeContext && error.context) {
      serialized.context = this.sanitizeContext(error.context);
    }

    // Add metadata if requested
    if (this.options.includeMetadata) {
      serialized.metadata = this.extractMetadata(error);
    }

    // Add custom fields
    if (this.options.customFields.length > 0) {
      serialized.customFields = this.extractCustomFields(error);
    }

    return serialized;
  }

  /**
   * Deserialize JSON to error
   */
  deserialize(serialized: SerializedError): AppError {

    // Create appropriate error type
    switch (serialized.type) {
      case 'DatabaseError':
        return new DatabaseError(
          serialized.code,
          serialized.message,
          serialized.context as any,
          serialized.metadata?.subCode
        );

      case 'ValidationError':
        return new ValidationError(
          serialized.code,
          serialized.message,
          serialized.context as any,
          serialized.metadata?.subCode
        );

      case 'BusinessError':
        return new BusinessError(
          serialized.code,
          serialized.message,
          serialized.context as any,
          serialized.metadata?.subCode
        );

      case 'AppError':
      default:
        return new AppError(
          serialized.code,
          serialized.message,
          serialized.statusCode,
          serialized.isOperational,
          serialized.context
        );
    }
  }

  /**
   * Serialize multiple errors
   */
  serializeMultiple(errors: AppError[]): SerializedError[] {
    return errors.map(error => this.serialize(error));
  }

  /**
   * Deserialize multiple errors
   */
  deserializeMultiple(serialized: SerializedError[]): AppError[] {
    return serialized.map(error => this.deserialize(error));
  }

  /**
   * Serialize error to string
   */
  serializeToString(error: AppError): string {
    return JSON.stringify(this.serialize(error));
  }

  /**
   * Deserialize error from string
   */
  deserializeFromString(serialized: string): AppError {
    const parsed = JSON.parse(serialized);
    return this.deserialize(parsed);
  }

  /**
   * Get error type
   */
  private getErrorType(error: AppError): 'AppError' | 'DatabaseError' | 'ValidationError' | 'BusinessError' {
    if (error instanceof DatabaseError) return 'DatabaseError';
    if (error instanceof ValidationError) return 'ValidationError';
    if (error instanceof BusinessError) return 'BusinessError';
    return 'AppError';
  }

  /**
   * Extract metadata from error
   */
  private extractMetadata(error: AppError): { severity: string; category?: string; domain?: string; subCode?: string } {
    const metadata: { severity: string; category?: string; domain?: string; subCode?: string } = {
      severity: error.getSeverity()
    };

    // Add domain-specific metadata
    if (error instanceof DatabaseError) {
      metadata.category = 'database';
      metadata.domain = 'database';
      if (error.subCode) metadata.subCode = error.subCode;
    } else if (error instanceof ValidationError) {
      metadata.category = 'validation';
      metadata.domain = 'validation';
      if (error.subCode) metadata.subCode = error.subCode;
    } else if (error instanceof BusinessError) {
      metadata.category = 'business';
      metadata.domain = 'business';
      if (error.subCode) metadata.subCode = error.subCode;
    }

    return metadata;
  }

  /**
   * Extract custom fields from error
   */
  private extractCustomFields(error: AppError): Record<string, unknown> {
    const customFields: Record<string, unknown> = {};

    for (const field of this.options.customFields) {
      if (field in error) {
        customFields[field] = (error as any)[field];
      }
    }

    return customFields;
  }

  /**
   * Sanitize context to remove sensitive information
   */
  private sanitizeContext(context: Record<string, unknown>): Record<string, unknown> {
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'credential'];
    const sanitized = { ...context };

    for (const key in sanitized) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeObject(sanitized[key] as Record<string, unknown>, 0);
      }
    }

    return sanitized;
  }

  /**
   * Recursively sanitize object
   */
  private sanitizeObject(obj: Record<string, unknown>, depth: number): Record<string, unknown> {
    if (depth >= this.options.maxDepth) {
      return { '[MAX_DEPTH_REACHED]': true };
    }

    const sanitized: Record<string, unknown> = {};
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'credential'];

    for (const key in obj) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitized[key] = this.sanitizeObject(obj[key] as Record<string, unknown>, depth + 1);
      } else {
        sanitized[key] = obj[key];
      }
    }

    return sanitized;
  }
}
