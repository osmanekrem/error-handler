import { BaseCustomError } from './BaseCustomError';

export interface ValidationErrorContext extends Record<string, unknown> {
  field?: string;
  value?: unknown;
  expectedType?: string;
  expectedFormat?: string;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  allowedValues?: unknown[];
  customRule?: string;
  validationPath?: string[];
}

/**
 * Validation-specific error class
 * 
 * @example
 * ```typescript
 * import { ValidationError } from '@osmanekrem/error-handler/errors';
 * 
 * throw new ValidationError(
 *   'INVALID_EMAIL',
 *   'Email format is invalid',
 *   { field: 'email', value: 'invalid-email', expectedFormat: 'user@domain.com' }
 * );
 * ```
 */
export class ValidationError extends BaseCustomError {
  public readonly context: ValidationErrorContext;

  constructor(
    code: string,
    message: string,
    context?: ValidationErrorContext,
    subCode?: string
  ) {
    super(
      code,
      message,
      400, // Validation errors are typically 400
      true, // Usually operational
      context,
      'validation',
      subCode
    );
    this.context = context || {};
  }

  /**
   * Get the field that failed validation
   */
  getField(): string | undefined {
    return this.context.field;
  }

  /**
   * Get the value that failed validation
   */
  getValue(): unknown {
    return this.context.value;
  }

  /**
   * Get the expected type
   */
  getExpectedType(): string | undefined {
    return this.context.expectedType;
  }

  /**
   * Get the expected format
   */
  getExpectedFormat(): string | undefined {
    return this.context.expectedFormat;
  }

  /**
   * Get length constraints
   */
  getLengthConstraints(): { minLength?: number; maxLength?: number } {
    return {
      minLength: this.context.minLength,
      maxLength: this.context.maxLength
    };
  }

  /**
   * Get value constraints
   */
  getValueConstraints(): { minValue?: number; maxValue?: number } {
    return {
      minValue: this.context.minValue,
      maxValue: this.context.maxValue
    };
  }

  /**
   * Get allowed values
   */
  getAllowedValues(): unknown[] | undefined {
    return this.context.allowedValues;
  }

  /**
   * Get validation path (for nested objects)
   */
  getValidationPath(): string[] | undefined {
    return this.context.validationPath;
  }

  /**
   * Check if this is a required field error
   */
  isRequiredFieldError(): boolean {
    return this.code === 'REQUIRED_FIELD' || this.code === 'MISSING_FIELD';
  }

  /**
   * Check if this is a type error
   */
  isTypeError(): boolean {
    return this.code === 'INVALID_TYPE' || this.code === 'TYPE_MISMATCH';
  }

  /**
   * Check if this is a format error
   */
  isFormatError(): boolean {
    return this.code === 'INVALID_FORMAT' || this.code === 'FORMAT_ERROR';
  }

  /**
   * Check if this is a length error
   */
  isLengthError(): boolean {
    return this.code === 'INVALID_LENGTH' || this.code === 'LENGTH_ERROR';
  }

  /**
   * Check if this is a range error
   */
  isRangeError(): boolean {
    return this.code === 'INVALID_RANGE' || this.code === 'RANGE_ERROR';
  }

  /**
   * Get detailed validation message
   */
  getDetailedMessage(): string {
    let message = this.message;
    
    if (this.context.field) {
      message = `Field '${this.context.field}': ${message}`;
    }
    
    if (this.context.expectedType) {
      message += ` (expected: ${this.context.expectedType})`;
    }
    
    if (this.context.expectedFormat) {
      message += ` (format: ${this.context.expectedFormat})`;
    }
    
    return message;
  }
}

/**
 * Factory functions for common validation errors
 */
export const createValidationError = {
  requiredField: (field: string, context?: ValidationErrorContext) =>
    new ValidationError('REQUIRED_FIELD', `Field '${field}' is required`, { ...context, field }),

  invalidType: (field: string, value: unknown, expectedType: string, context?: ValidationErrorContext) =>
    new ValidationError('INVALID_TYPE', `Field '${field}' must be of type ${expectedType}`, { ...context, field, value, expectedType }),

  invalidFormat: (field: string, value: unknown, expectedFormat: string, context?: ValidationErrorContext) =>
    new ValidationError('INVALID_FORMAT', `Field '${field}' has invalid format`, { ...context, field, value, expectedFormat }),

  invalidLength: (field: string, value: string, minLength?: number, maxLength?: number, context?: ValidationErrorContext) =>
    new ValidationError('INVALID_LENGTH', `Field '${field}' has invalid length`, { ...context, field, value, minLength, maxLength }),

  invalidRange: (field: string, value: number, minValue?: number, maxValue?: number, context?: ValidationErrorContext) =>
    new ValidationError('INVALID_RANGE', `Field '${field}' is out of range`, { ...context, field, value, minValue, maxValue }),

  invalidValue: (field: string, value: unknown, allowedValues: unknown[], context?: ValidationErrorContext) =>
    new ValidationError('INVALID_VALUE', `Field '${field}' has invalid value`, { ...context, field, value, allowedValues }),

  customRule: (field: string, rule: string, message: string, context?: ValidationErrorContext) =>
    new ValidationError('CUSTOM_RULE', message, { ...context, field, customRule: rule })
};
