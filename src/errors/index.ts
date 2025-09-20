/**
 * Custom error types and inheritance system
 */

export { BaseCustomError } from './BaseCustomError';

export { DatabaseError, createDatabaseError } from './DatabaseError';
export type { DatabaseErrorContext } from './DatabaseError';

export { ValidationError, createValidationError } from './ValidationError';
export type { ValidationErrorContext } from './ValidationError';

export { BusinessError, createBusinessError } from './BusinessError';
export type { BusinessErrorContext } from './BusinessError';
