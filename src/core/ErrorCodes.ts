/**
 * Predefined error codes for consistent error handling
 */
export const ErrorCodes = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',

  // Resource Management
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',
  RESOURCE_LOCKED: 'RESOURCE_LOCKED',
  RESOURCE_EXPIRED: 'RESOURCE_EXPIRED',

  // Database
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  QUERY_ERROR: 'QUERY_ERROR',
  TRANSACTION_ERROR: 'TRANSACTION_ERROR',
  CONSTRAINT_VIOLATION: 'CONSTRAINT_VIOLATION',

  // External Services
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  API_ERROR: 'API_ERROR',

  // System
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  TIMEOUT: 'TIMEOUT',
  MEMORY_ERROR: 'MEMORY_ERROR',
  DISK_ERROR: 'DISK_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',

  // Business Logic
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  FEATURE_DISABLED: 'FEATURE_DISABLED',

  // Configuration
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  MISSING_CONFIGURATION: 'MISSING_CONFIGURATION',
  INVALID_CONFIGURATION: 'INVALID_CONFIGURATION',

  // File Operations
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_ACCESS_DENIED: 'FILE_ACCESS_DENIED',
  FILE_CORRUPTED: 'FILE_CORRUPTED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_FORMAT: 'INVALID_FILE_FORMAT',

  // Workflow & Process
  WORKFLOW_ERROR: 'WORKFLOW_ERROR',
  PROCESS_INTERRUPTED: 'PROCESS_INTERRUPTED',
  INVALID_STATE: 'INVALID_STATE',
  DEPENDENCY_ERROR: 'DEPENDENCY_ERROR',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * Error code metadata for better error handling
 */
export const ErrorCodeMetadata: Record<ErrorCode, {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'auth' | 'validation' | 'resource' | 'database' | 'external' | 'system' | 'business' | 'config' | 'file' | 'workflow';
  retryable: boolean;
  userMessage?: string;
}> = {
  // Authentication & Authorization
  [ErrorCodes.UNAUTHORIZED]: {
    severity: 'high',
    category: 'auth',
    retryable: false,
    userMessage: 'Authentication required',
  },
  [ErrorCodes.FORBIDDEN]: {
    severity: 'high',
    category: 'auth',
    retryable: false,
    userMessage: 'Access denied',
  },
  [ErrorCodes.TOKEN_EXPIRED]: {
    severity: 'medium',
    category: 'auth',
    retryable: true,
    userMessage: 'Session expired, please login again',
  },
  [ErrorCodes.INVALID_TOKEN]: {
    severity: 'medium',
    category: 'auth',
    retryable: false,
    userMessage: 'Invalid authentication token',
  },
  [ErrorCodes.INSUFFICIENT_PERMISSIONS]: {
    severity: 'high',
    category: 'auth',
    retryable: false,
    userMessage: 'Insufficient permissions',
  },

  // Validation
  [ErrorCodes.VALIDATION_ERROR]: {
    severity: 'medium',
    category: 'validation',
    retryable: false,
    userMessage: 'Validation failed',
  },
  [ErrorCodes.INVALID_INPUT]: {
    severity: 'medium',
    category: 'validation',
    retryable: false,
    userMessage: 'Invalid input provided',
  },
  [ErrorCodes.MISSING_REQUIRED_FIELD]: {
    severity: 'medium',
    category: 'validation',
    retryable: false,
    userMessage: 'Required field is missing',
  },
  [ErrorCodes.INVALID_FORMAT]: {
    severity: 'medium',
    category: 'validation',
    retryable: false,
    userMessage: 'Invalid format',
  },

  // Resource Management
  [ErrorCodes.NOT_FOUND]: {
    severity: 'medium',
    category: 'resource',
    retryable: false,
    userMessage: 'Resource not found',
  },
  [ErrorCodes.CONFLICT]: {
    severity: 'medium',
    category: 'resource',
    retryable: false,
    userMessage: 'Resource conflict',
  },
  [ErrorCodes.DUPLICATE_RESOURCE]: {
    severity: 'medium',
    category: 'resource',
    retryable: false,
    userMessage: 'Resource already exists',
  },
  [ErrorCodes.RESOURCE_LOCKED]: {
    severity: 'medium',
    category: 'resource',
    retryable: true,
    userMessage: 'Resource is locked',
  },
  [ErrorCodes.RESOURCE_EXPIRED]: {
    severity: 'medium',
    category: 'resource',
    retryable: false,
    userMessage: 'Resource has expired',
  },

  // Database
  [ErrorCodes.DATABASE_ERROR]: {
    severity: 'critical',
    category: 'database',
    retryable: true,
    userMessage: 'Database error occurred',
  },
  [ErrorCodes.CONNECTION_ERROR]: {
    severity: 'critical',
    category: 'database',
    retryable: true,
    userMessage: 'Database connection failed',
  },
  [ErrorCodes.QUERY_ERROR]: {
    severity: 'high',
    category: 'database',
    retryable: false,
    userMessage: 'Database query failed',
  },
  [ErrorCodes.TRANSACTION_ERROR]: {
    severity: 'high',
    category: 'database',
    retryable: true,
    userMessage: 'Database transaction failed',
  },
  [ErrorCodes.CONSTRAINT_VIOLATION]: {
    severity: 'high',
    category: 'database',
    retryable: false,
    userMessage: 'Database constraint violation',
  },

  // External Services
  [ErrorCodes.EXTERNAL_SERVICE_ERROR]: {
    severity: 'high',
    category: 'external',
    retryable: true,
    userMessage: 'External service error',
  },
  [ErrorCodes.SERVICE_UNAVAILABLE]: {
    severity: 'high',
    category: 'external',
    retryable: true,
    userMessage: 'Service temporarily unavailable',
  },
  [ErrorCodes.RATE_LIMIT_EXCEEDED]: {
    severity: 'medium',
    category: 'external',
    retryable: true,
    userMessage: 'Rate limit exceeded',
  },
  [ErrorCodes.API_ERROR]: {
    severity: 'high',
    category: 'external',
    retryable: true,
    userMessage: 'API error occurred',
  },

  // System
  [ErrorCodes.INTERNAL_SERVER_ERROR]: {
    severity: 'critical',
    category: 'system',
    retryable: true,
    userMessage: 'Internal server error',
  },
  [ErrorCodes.TIMEOUT]: {
    severity: 'high',
    category: 'system',
    retryable: true,
    userMessage: 'Operation timed out',
  },
  [ErrorCodes.MEMORY_ERROR]: {
    severity: 'critical',
    category: 'system',
    retryable: false,
    userMessage: 'Memory error occurred',
  },
  [ErrorCodes.DISK_ERROR]: {
    severity: 'critical',
    category: 'system',
    retryable: true,
    userMessage: 'Disk error occurred',
  },
  [ErrorCodes.NETWORK_ERROR]: {
    severity: 'high',
    category: 'system',
    retryable: true,
    userMessage: 'Network error occurred',
  },

  // Business Logic
  [ErrorCodes.BUSINESS_RULE_VIOLATION]: {
    severity: 'medium',
    category: 'business',
    retryable: false,
    userMessage: 'Business rule violation',
  },
  [ErrorCodes.INSUFFICIENT_FUNDS]: {
    severity: 'medium',
    category: 'business',
    retryable: false,
    userMessage: 'Insufficient funds',
  },
  [ErrorCodes.QUOTA_EXCEEDED]: {
    severity: 'medium',
    category: 'business',
    retryable: false,
    userMessage: 'Quota exceeded',
  },
  [ErrorCodes.FEATURE_DISABLED]: {
    severity: 'low',
    category: 'business',
    retryable: false,
    userMessage: 'Feature is disabled',
  },

  // Configuration
  [ErrorCodes.CONFIGURATION_ERROR]: {
    severity: 'critical',
    category: 'config',
    retryable: false,
    userMessage: 'Configuration error',
  },
  [ErrorCodes.MISSING_CONFIGURATION]: {
    severity: 'critical',
    category: 'config',
    retryable: false,
    userMessage: 'Missing configuration',
  },
  [ErrorCodes.INVALID_CONFIGURATION]: {
    severity: 'critical',
    category: 'config',
    retryable: false,
    userMessage: 'Invalid configuration',
  },

  // File Operations
  [ErrorCodes.FILE_NOT_FOUND]: {
    severity: 'medium',
    category: 'file',
    retryable: false,
    userMessage: 'File not found',
  },
  [ErrorCodes.FILE_ACCESS_DENIED]: {
    severity: 'high',
    category: 'file',
    retryable: false,
    userMessage: 'File access denied',
  },
  [ErrorCodes.FILE_CORRUPTED]: {
    severity: 'high',
    category: 'file',
    retryable: false,
    userMessage: 'File is corrupted',
  },
  [ErrorCodes.FILE_TOO_LARGE]: {
    severity: 'medium',
    category: 'file',
    retryable: false,
    userMessage: 'File too large',
  },
  [ErrorCodes.INVALID_FILE_FORMAT]: {
    severity: 'medium',
    category: 'file',
    retryable: false,
    userMessage: 'Invalid file format',
  },

  // Workflow & Process
  [ErrorCodes.WORKFLOW_ERROR]: {
    severity: 'high',
    category: 'workflow',
    retryable: true,
    userMessage: 'Workflow error occurred',
  },
  [ErrorCodes.PROCESS_INTERRUPTED]: {
    severity: 'medium',
    category: 'workflow',
    retryable: true,
    userMessage: 'Process was interrupted',
  },
  [ErrorCodes.INVALID_STATE]: {
    severity: 'medium',
    category: 'workflow',
    retryable: false,
    userMessage: 'Invalid state',
  },
  [ErrorCodes.DEPENDENCY_ERROR]: {
    severity: 'high',
    category: 'workflow',
    retryable: true,
    userMessage: 'Dependency error',
  },
};
