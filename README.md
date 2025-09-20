# @osmanekrem/error-handler

Advanced error handling utilities for TypeScript applications with TRPC support.

## Features

- 🚀 **Structured Error Handling** - Consistent error types and codes
- 🔧 **TRPC Integration** - Seamless integration with tRPC
- 🛡️ **Type Safety** - Full TypeScript support
- 🔄 **Circuit Breaker** - Built-in circuit breaker pattern
- 📊 **Error Metadata** - Rich error context and metadata
- 🎯 **Factory Functions** - Pre-built error creators
- 🔍 **Type Guards** - Runtime error type checking
- 📝 **Comprehensive Logging** - Structured error logging

## Installation

```bash
npm install @osmanekrem/error-handler
# or
yarn add @osmanekrem/error-handler
# or
pnpm add @osmanekrem/error-handler
```

## Quick Start

```typescript
import { AppError, createError, errorHandler, CircuitBreaker } from '@osmanekrem/error-handler';

// Create a custom error
const error = createError.notFound('User', { userId: '123' });

// Handle errors
try {
  // Some operation
} catch (err) {
  const appError = errorHandler(err, 'user-operation');
  throw appError;
}

// Use circuit breaker
const circuitBreaker = new CircuitBreaker();
const result = await circuitBreaker.execute(() => riskyOperation());
```

## API Reference

### AppError

The main error class with structured error handling.

```typescript
import { AppError } from '@osmanekrem/error-handler';

const error = new AppError(
  'USER_NOT_FOUND',
  'User not found',
  404,
  true, // isOperational
  { userId: '123' } // context
);

// Check error properties
console.log(error.code); // 'USER_NOT_FOUND'
console.log(error.statusCode); // 404
console.log(error.isOperational); // true
console.log(error.getSeverity()); // 'medium'
```

### Error Factory Functions

Pre-built error creators for common scenarios.

```typescript
import { createError } from '@osmanekrem/error-handler';

// Authentication errors
const authError = createError.unauthorized('Invalid token');
const forbiddenError = createError.forbidden('Access denied');

// Validation errors
const validationError = createError.validation('Invalid email format');
const missingField = createError.missingRequiredField('email');

// Resource errors
const notFound = createError.notFound('User', { userId: '123' });
const conflict = createError.conflict('Email already exists');

// Database errors
const dbError = createError.database('Connection failed');
const queryError = createError.queryError('SELECT * FROM users');

// External service errors
const serviceError = createError.external('PaymentService', 'API timeout');
const rateLimit = createError.rateLimitExceeded('API', 60); // retry after 60s
```

### TRPC Integration

Convert AppError to TRPCError for tRPC compatibility.

```typescript
import { toTRPCError } from '@osmanekrem/error-handler';
import { TRPCError } from '@trpc/server';

try {
  // Some operation
} catch (error) {
  if (isAppError(error)) {
    throw toTRPCError(error);
  }
  throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Unknown error' });
}
```

### Error Handler

Global error handler with logging and context.

```typescript
import { errorHandler, withErrorHandling } from '@osmanekrem/error-handler';

// Manual error handling
try {
  // Some operation
} catch (error) {
  const appError = errorHandler(error, 'user-operation', {
    logErrors: true,
    logLevel: 'error',
    includeStack: true,
    sanitizeContext: true,
  });
  throw appError;
}

// Higher-order function
const safeOperation = withErrorHandling(
  async (userId: string) => {
    // Risky operation
    return await getUser(userId);
  },
  'get-user',
  { logErrors: true }
);
```

### Circuit Breaker

Protect against cascading failures.

```typescript
import { CircuitBreaker } from '@osmanekrem/error-handler';

const circuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  recoveryTimeout: 60000, // 1 minute
  halfOpenMaxCalls: 3,
});

// Execute with circuit breaker protection
try {
  const result = await circuitBreaker.execute(
    () => callExternalService(),
    'external-service'
  );
} catch (error) {
  // Handle circuit breaker errors
}

// Check circuit breaker state
console.log(circuitBreaker.getState());
console.log(circuitBreaker.isHealthy());
console.log(circuitBreaker.getStats());
```

### Type Guards

Runtime error type checking.

```typescript
import { isAppError, isAppErrorWithCode, isRetryableAppError } from '@osmanekrem/error-handler';

try {
  // Some operation
} catch (error) {
  if (isAppError(error)) {
    console.log('AppError:', error.code);
  }
  
  if (isAppErrorWithCode(error, 'USER_NOT_FOUND')) {
    // Handle specific error
  }
  
  if (isRetryableAppError(error)) {
    // Retry logic
  }
}
```

## Error Codes

The library includes predefined error codes for consistency:

### Authentication & Authorization
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Access denied
- `TOKEN_EXPIRED` - Token has expired
- `INVALID_TOKEN` - Invalid token
- `INSUFFICIENT_PERMISSIONS` - Insufficient permissions

### Validation
- `VALIDATION_ERROR` - Validation failed
- `INVALID_INPUT` - Invalid input provided
- `MISSING_REQUIRED_FIELD` - Required field is missing
- `INVALID_FORMAT` - Invalid format

### Resource Management
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource conflict
- `DUPLICATE_RESOURCE` - Resource already exists
- `RESOURCE_LOCKED` - Resource is locked
- `RESOURCE_EXPIRED` - Resource has expired

### Database
- `DATABASE_ERROR` - Database operation failed
- `CONNECTION_ERROR` - Database connection failed
- `QUERY_ERROR` - Database query failed
- `TRANSACTION_ERROR` - Database transaction failed
- `CONSTRAINT_VIOLATION` - Database constraint violation

### External Services
- `EXTERNAL_SERVICE_ERROR` - External service error
- `SERVICE_UNAVAILABLE` - Service temporarily unavailable
- `RATE_LIMIT_EXCEEDED` - Rate limit exceeded
- `API_ERROR` - API error occurred

### System
- `INTERNAL_SERVER_ERROR` - Internal server error
- `TIMEOUT` - Operation timed out
- `MEMORY_ERROR` - Memory error occurred
- `DISK_ERROR` - Disk error occurred
- `NETWORK_ERROR` - Network error occurred

## Error Metadata

Each error includes metadata for monitoring and alerting:

```typescript
import { getErrorMetadata } from '@osmanekrem/error-handler';

const metadata = getErrorMetadata(error);
console.log(metadata);
// {
//   code: 'USER_NOT_FOUND',
//   severity: 'medium',
//   category: 'resource',
//   retryable: false,
//   userMessage: 'User not found',
//   isOperational: true,
//   statusCode: 404,
//   timestamp: Date
// }
```

## Best Practices

### 1. Use Structured Errors
```typescript
// ✅ Good
throw createError.notFound('User', { userId: '123' });

// ❌ Bad
throw new Error('User not found');
```

### 2. Include Context
```typescript
// ✅ Good
throw createError.database('Query failed', { 
  query: 'SELECT * FROM users',
  userId: '123',
  operation: 'getUser'
});

// ❌ Bad
throw createError.database('Query failed');
```

### 3. Use Circuit Breakers for External Services
```typescript
// ✅ Good
const circuitBreaker = new CircuitBreaker();
const result = await circuitBreaker.execute(() => callExternalAPI());

// ❌ Bad
const result = await callExternalAPI(); // No protection
```

### 4. Handle Errors Appropriately
```typescript
// ✅ Good
try {
  const user = await getUser(id);
} catch (error) {
  if (isAppErrorWithCode(error, 'USER_NOT_FOUND')) {
    return { success: false, message: 'User not found' };
  }
  throw errorHandler(error, 'getUser');
}

// ❌ Bad
try {
  const user = await getUser(id);
} catch (error) {
  console.log(error); // Just logging
}
```

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guidelines.

## Support

For support, please open an issue on GitHub.
