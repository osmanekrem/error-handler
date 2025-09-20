import { BaseCustomError } from './BaseCustomError';

export interface DatabaseErrorContext extends Record<string, unknown> {
  query?: string;
  table?: string;
  constraint?: string;
  operation?: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'TRANSACTION';
  connectionId?: string;
  transactionId?: string;
  executionTime?: number;
}

/**
 * Database-specific error class
 * 
 * @example
 * ```typescript
 * import { DatabaseError } from '@osmanekrem/error-handler/errors';
 * 
 * throw new DatabaseError(
 *   'CONNECTION_FAILED',
 *   'Database connection lost',
 *   { connectionId: 'conn-123', operation: 'SELECT' }
 * );
 * ```
 */
export class DatabaseError extends BaseCustomError {
  public readonly context: DatabaseErrorContext;

  constructor(
    code: string,
    message: string,
    context?: DatabaseErrorContext,
    subCode?: string
  ) {
    super(
      code,
      message,
      500, // Database errors are typically 500
      true, // Usually operational
      context,
      'database',
      subCode
    );
    this.context = context || {};
  }

  /**
   * Get the SQL query that caused the error
   */
  getQuery(): string | undefined {
    return this.context.query;
  }

  /**
   * Get the database table involved
   */
  getTable(): string | undefined {
    return this.context.table;
  }

  /**
   * Get the constraint that was violated
   */
  getConstraint(): string | undefined {
    return this.context.constraint;
  }

  /**
   * Get the database operation type
   */
  getOperation(): string | undefined {
    return this.context.operation;
  }

  /**
   * Get connection information
   */
  getConnectionInfo(): { connectionId?: string; transactionId?: string } {
    return {
      connectionId: this.context.connectionId,
      transactionId: this.context.transactionId
    };
  }

  /**
   * Get query execution time
   */
  getExecutionTime(): number | undefined {
    return this.context.executionTime;
  }

  /**
   * Check if this is a connection error
   */
  isConnectionError(): boolean {
    return this.code === 'CONNECTION_ERROR' || this.code === 'CONNECTION_FAILED';
  }

  /**
   * Check if this is a query error
   */
  isQueryError(): boolean {
    return this.code === 'QUERY_ERROR' || this.code === 'INVALID_QUERY';
  }

  /**
   * Check if this is a constraint violation
   */
  isConstraintViolation(): boolean {
    return this.code === 'CONSTRAINT_VIOLATION' || this.code === 'UNIQUE_VIOLATION';
  }

  /**
   * Check if this is a transaction error
   */
  isTransactionError(): boolean {
    return this.code === 'TRANSACTION_ERROR' || this.context.operation === 'TRANSACTION';
  }
}

/**
 * Factory functions for common database errors
 */
export const createDatabaseError = {
  connectionFailed: (message: string, context?: DatabaseErrorContext) =>
    new DatabaseError('CONNECTION_FAILED', message, context),

  queryFailed: (query: string, message: string, context?: DatabaseErrorContext) =>
    new DatabaseError('QUERY_ERROR', message, { ...context, query }),

  constraintViolation: (constraint: string, message: string, context?: DatabaseErrorContext) =>
    new DatabaseError('CONSTRAINT_VIOLATION', message, { ...context, constraint }),

  transactionFailed: (message: string, context?: DatabaseErrorContext) =>
    new DatabaseError('TRANSACTION_ERROR', message, { ...context, operation: 'TRANSACTION' }),

  timeout: (operation: string, timeoutMs: number, context?: DatabaseErrorContext) =>
    new DatabaseError('TIMEOUT', `${operation} timed out after ${timeoutMs}ms`, { ...context, operation: operation as any }),

  deadlock: (message: string, context?: DatabaseErrorContext) =>
    new DatabaseError('DEADLOCK', message, context),

  lockTimeout: (table: string, context?: DatabaseErrorContext) =>
    new DatabaseError('LOCK_TIMEOUT', `Lock timeout on table ${table}`, { ...context, table })
};
