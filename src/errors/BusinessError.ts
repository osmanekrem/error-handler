import { BaseCustomError } from './BaseCustomError';

export interface BusinessErrorContext extends Record<string, unknown> {
  rule?: string;
  entity?: string;
  entityId?: string;
  operation?: string;
  businessProcess?: string;
  affectedUsers?: string[];
  financialImpact?: number;
  retryable?: boolean;
}

/**
 * Business logic error class
 * 
 * @example
 * ```typescript
 * import { BusinessError } from '@osmanekrem/error-handler/errors';
 * 
 * throw new BusinessError(
 *   'INSUFFICIENT_FUNDS',
 *   'Account balance is insufficient',
 *   { entity: 'account', entityId: 'acc-123', financialImpact: 1000 }
 * );
 * ```
 */
export class BusinessError extends BaseCustomError {
  public readonly context: BusinessErrorContext;

  constructor(
    code: string,
    message: string,
    context?: BusinessErrorContext,
    subCode?: string
  ) {
    super(
      code,
      message,
      400, // Business errors are typically 400
      true, // Usually operational
      context,
      'business',
      subCode
    );
    this.context = context || {};
  }

  /**
   * Get the business rule that was violated
   */
  getRule(): string | undefined {
    return this.context.rule;
  }

  /**
   * Get the entity involved
   */
  getEntity(): string | undefined {
    return this.context.entity;
  }

  /**
   * Get the entity ID
   */
  getEntityId(): string | undefined {
    return this.context.entityId;
  }

  /**
   * Get the operation that failed
   */
  getOperation(): string | undefined {
    return this.context.operation;
  }

  /**
   * Get the business process
   */
  getBusinessProcess(): string | undefined {
    return this.context.businessProcess;
  }

  /**
   * Get affected users
   */
  getAffectedUsers(): string[] | undefined {
    return this.context.affectedUsers;
  }

  /**
   * Get financial impact
   */
  getFinancialImpact(): number | undefined {
    return this.context.financialImpact;
  }

  /**
   * Check if this error is retryable
   */
  isRetryable(): boolean {
    return this.context.retryable ?? false;
  }

  /**
   * Check if this is a financial error
   */
  isFinancialError(): boolean {
    return this.context.financialImpact !== undefined || 
           this.code.includes('FUND') || 
           this.code.includes('PAYMENT') ||
           this.code.includes('BALANCE');
  }

  /**
   * Check if this is a permission error
   */
  isPermissionError(): boolean {
    return this.code.includes('PERMISSION') || 
           this.code.includes('ACCESS') || 
           this.code.includes('AUTHORIZATION');
  }

  /**
   * Check if this is a quota error
   */
  isQuotaError(): boolean {
    return this.code.includes('QUOTA') || 
           this.code.includes('LIMIT') || 
           this.code.includes('EXCEEDED');
  }

  /**
   * Get business impact summary
   */
  getBusinessImpact(): Record<string, unknown> {
    return {
      entity: this.context.entity,
      entityId: this.context.entityId,
      operation: this.context.operation,
      businessProcess: this.context.businessProcess,
      affectedUsers: this.context.affectedUsers?.length || 0,
      financialImpact: this.context.financialImpact,
      retryable: this.isRetryable()
    };
  }
}

/**
 * Factory functions for common business errors
 */
export const createBusinessError = {
  insufficientFunds: (amount: number, available: number, entityId?: string) =>
    new BusinessError('INSUFFICIENT_FUNDS', `Insufficient funds: required ${amount}, available ${available}`, {
      entity: 'account',
      entityId,
      financialImpact: amount - available,
      retryable: false
    }),

  quotaExceeded: (quota: string, limit: number, entityId?: string) =>
    new BusinessError('QUOTA_EXCEEDED', `Quota exceeded for ${quota}: limit ${limit}`, {
      entity: 'quota',
      entityId,
      retryable: false
    }),

  businessRuleViolation: (rule: string, message: string, context?: BusinessErrorContext) =>
    new BusinessError('BUSINESS_RULE_VIOLATION', message, { ...context, rule }),

  featureDisabled: (feature: string, entityId?: string) =>
    new BusinessError('FEATURE_DISABLED', `Feature '${feature}' is disabled`, {
      entity: 'feature',
      entityId,
      retryable: false
    }),

  operationNotAllowed: (operation: string, reason: string, context?: BusinessErrorContext) =>
    new BusinessError('OPERATION_NOT_ALLOWED', `Operation '${operation}' is not allowed: ${reason}`, {
      ...context,
      operation,
      retryable: false
    }),

  resourceLocked: (resource: string, resourceId: string, _reason?: string) =>
    new BusinessError('RESOURCE_LOCKED', `Resource '${resource}' is locked`, {
      entity: resource,
      entityId: resourceId,
      retryable: true
    }),

  workflowError: (process: string, step: string, message: string, context?: BusinessErrorContext) =>
    new BusinessError('WORKFLOW_ERROR', message, {
      ...context,
      businessProcess: process,
      operation: step,
      retryable: true
    })
};
