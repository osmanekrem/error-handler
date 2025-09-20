# @osmanekrem/error-handler

<div align="center">

[![npm version](https://img.shields.io/npm/v/@osmanekrem/error-handler.svg?style=flat-square)](https://www.npmjs.com/package/@osmanekrem/error-handler)
[![npm downloads](https://img.shields.io/npm/dm/@osmanekrem/error-handler.svg?style=flat-square)](https://www.npmjs.com/package/@osmanekrem/error-handler)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg?style=flat-square)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**Advanced error handling utilities for TypeScript applications with middleware, metrics, and monitoring support.**

[Quick Start](#-quick-start) • [Documentation](#-documentation) • [Examples](#-examples) • [API Reference](#-api-reference) • [Contributing](#-contributing)

</div>

## 📋 Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Documentation](#-documentation)
  - [Core Concepts](#core-concepts)
  - [Error Types](#error-types)
  - [Framework Integration](#framework-integration)
  - [Advanced Features](#advanced-features)
- [Examples](#-examples)
- [API Reference](#-api-reference)
- [Configuration](#-configuration)
- [Best Practices](#-best-practices)
- [Troubleshooting](#-troubleshooting)
- [Migration Guide](#-migration-guide)
- [Performance](#-performance)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

<div align="center">

| Feature | Description | Status |
|---------|-------------|--------|
| 🚀 **Structured Error Handling** | Consistent error types and codes | ✅ |
| 🔧 **TRPC Integration** | Seamless integration with tRPC | ✅ |
| 🛡️ **Type Safety** | Full TypeScript support | ✅ |
| 🔄 **Circuit Breaker** | Built-in circuit breaker pattern | ✅ |
| 📊 **Error Metadata** | Rich error context and metadata | ✅ |
| 🎯 **Factory Functions** | Pre-built error creators | ✅ |
| 🔍 **Type Guards** | Runtime error type checking | ✅ |
| 📝 **Comprehensive Logging** | Structured error logging | ✅ |
| 🌐 **Framework Middleware** | Express.js, Fastify, and Hono support | ✅ |
| 📈 **Error Metrics** | Built-in monitoring and analytics | ✅ |
| 🔔 **Prometheus Integration** | Production-ready metrics | ✅ |
| 🎛️ **Error Dashboard** | Real-time error monitoring | ✅ |
| 🔐 **Security Features** | Context sanitization and sensitive data protection | ✅ |
| 🔄 **Retry Strategies** | Multiple retry strategies for different scenarios | ✅ |
| 📦 **Error Caching** | Deduplication and caching system | ✅ |

</div>

## 🚀 Installation

```bash
# npm
npm install @osmanekrem/error-handler

# yarn
yarn add @osmanekrem/error-handler

# pnpm
pnpm add @osmanekrem/error-handler

# bun
bun add @osmanekrem/error-handler
```

### Peer Dependencies

```bash
# For tRPC integration (optional)
npm install @trpc/server

# For framework integrations (optional)
npm install express fastify hono
```

## 🏃‍♂️ Quick Start

### Basic Usage

```typescript
import { 
  AppError, 
  createError, 
  errorHandler,
  isAppError 
} from '@osmanekrem/error-handler';

// Create a structured error
const userError = createError.notFound('User', { userId: '123' });

// Handle errors with context
try {
  await riskyOperation();
} catch (error) {
  const appError = errorHandler(error, 'user-operation', {
    logErrors: true,
    sanitizeContext: true
  });
  throw appError;
}

// Type-safe error checking
if (isAppError(error)) {
  console.log('Error code:', error.code);
  console.log('Severity:', error.getSeverity());
}
```

### Framework Integration

```typescript
// Express.js
import express from 'express';
import { expressErrorMiddleware } from '@osmanekrem/error-handler';

const app = express();
app.use(expressErrorMiddleware({
  logErrors: true,
  includeStack: process.env.NODE_ENV === 'development'
}));

// Hono
import { Hono } from 'hono';
import { honoErrorMiddleware } from '@osmanekrem/error-handler';

const app = new Hono();
app.use('*', honoErrorMiddleware({
  logErrors: true,
  sanitizeContext: true
}));

// Fastify
import Fastify from 'fastify';
import { fastifyErrorPlugin } from '@osmanekrem/error-handler';

const fastify = Fastify();
await fastify.register(fastifyErrorPlugin, {
  logErrors: true
});
```

## 📚 Documentation

### Core Concepts

#### AppError Class

The `AppError` class is the foundation of the error handling system:

```typescript
import { AppError } from '@osmanekrem/error-handler';

const error = new AppError(
  'USER_NOT_FOUND',        // Error code
  'User not found',        // Message
  404,                     // HTTP status code
  true,                    // Is operational
  { userId: '123' }        // Context
);

// Error properties
console.log(error.code);           // 'USER_NOT_FOUND'
console.log(error.statusCode);     // 404
console.log(error.isOperational);  // true
console.log(error.getSeverity());  // 'medium'
console.log(error.timestamp);      // Date object
```

#### Error Codes System

The library includes 68+ predefined error codes organized by category:

```typescript
import { ErrorCodes } from '@osmanekrem/error-handler';

// Authentication & Authorization
ErrorCodes.UNAUTHORIZED
ErrorCodes.FORBIDDEN
ErrorCodes.TOKEN_EXPIRED

// Validation
ErrorCodes.VALIDATION_ERROR
ErrorCodes.MISSING_REQUIRED_FIELD
ErrorCodes.INVALID_FORMAT

// Database
ErrorCodes.DATABASE_ERROR
ErrorCodes.CONNECTION_ERROR
ErrorCodes.QUERY_ERROR

// External Services
ErrorCodes.EXTERNAL_SERVICE_ERROR
ErrorCodes.RATE_LIMIT_EXCEEDED
ErrorCodes.SERVICE_UNAVAILABLE
```

### Error Types

#### Factory Functions

Pre-built error creators for common scenarios:

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

// Business logic errors
const businessError = createError.businessRuleViolation('Insufficient balance');
const quotaError = createError.quotaExceeded('API calls', 1000);
```

#### Custom Error Classes

```typescript
import { BaseCustomError, DatabaseError, ValidationError } from '@osmanekrem/error-handler';

// Database-specific error
const dbError = new DatabaseError('Connection failed', {
  host: 'localhost',
  port: 5432,
  operation: 'connect'
});

// Validation error with field details
const validationError = new ValidationError('Invalid email format', {
  field: 'email',
  value: 'invalid-email',
  expectedFormat: 'user@domain.com'
});
```

### Framework Integration

#### Express.js Integration

```typescript
import express from 'express';
import { 
  expressErrorMiddleware, 
  asyncHandler,
  createError 
} from '@osmanekrem/error-handler';

const app = express();

// Global error middleware
app.use(expressErrorMiddleware({
  logErrors: true,
  includeStack: process.env.NODE_ENV === 'development',
  sanitizeContext: true,
  onError: (error) => {
    // Custom error handling
    console.log('Custom error handler:', error.code);
  }
}));

// Async route handler
app.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await getUser(req.params.id);
  if (!user) {
    throw createError.notFound('User', { userId: req.params.id });
  }
  res.json(user);
}));
```

#### Hono Integration

```typescript
import { Hono } from 'hono';
import { 
  honoErrorMiddleware, 
  honoErrorHandler,
  createHonoError 
} from '@osmanekrem/error-handler';

const app = new Hono();

// Middleware approach
app.use('*', honoErrorMiddleware({
  logErrors: true,
  includeStack: process.env.NODE_ENV === 'development',
  sanitizeContext: true,
  includeRequestInfo: true
}));

// Or using onError hook
app.onError(honoErrorHandler({
  logErrors: true,
  includeStack: process.env.NODE_ENV === 'development'
}));

// Route handlers
app.get('/users/:id', async (c) => {
  const user = await getUser(c.req.param('id'));
  if (!user) {
    throw createHonoError('USER_NOT_FOUND', 'User not found', 404, { 
      userId: c.req.param('id') 
    });
  }
  return c.json(user);
});
```

#### Fastify Integration

```typescript
import Fastify from 'fastify';
import { fastifyErrorPlugin, createFastifyError } from '@osmanekrem/error-handler';

const fastify = Fastify();

// Register error plugin
await fastify.register(fastifyErrorPlugin, {
  logErrors: true,
  includeStack: process.env.NODE_ENV === 'development'
});

// Route handlers
fastify.get('/users/:id', async (request, reply) => {
  const user = await getUser(request.params.id);
  if (!user) {
    throw createFastifyError('USER_NOT_FOUND', 'User not found', 404, {
      userId: request.params.id
    });
  }
  return user;
});
```

#### tRPC Integration

```typescript
import { initTRPC } from '@trpc/server';
import { toTRPCError, isAppError } from '@osmanekrem/error-handler';

const t = initTRPC.create();

const userRouter = t.router({
  getUser: t.procedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const user = await getUser(input.id);
        if (!user) {
          throw createError.notFound('User', { userId: input.id });
        }
        return user;
      } catch (error) {
        if (isAppError(error)) {
          throw toTRPCError(error);
        }
        throw error;
      }
    })
});
```

### Advanced Features

#### Circuit Breaker Pattern

```typescript
import { CircuitBreaker } from '@osmanekrem/error-handler';

const circuitBreaker = new CircuitBreaker({
  failureThreshold: 5,        // Open after 5 failures
  recoveryTimeout: 60000,     // 1 minute recovery time
  monitoringPeriod: 10000,    // 10 seconds monitoring
  halfOpenMaxCalls: 3         // Max calls in half-open state
});

// Execute with circuit breaker protection
try {
  const result = await circuitBreaker.execute(
    () => callExternalService(),
    'external-service'
  );
} catch (error) {
  if (error.code === 'SERVICE_UNAVAILABLE') {
    // Circuit breaker is open
    console.log('Service is down, using fallback');
  }
}

// Monitor circuit breaker state
console.log('State:', circuitBreaker.getState());
console.log('Healthy:', circuitBreaker.isHealthy());
console.log('Stats:', circuitBreaker.getStats());
```

#### Error Metrics and Monitoring

```typescript
import { ErrorMetrics, PrometheusMetrics } from '@osmanekrem/error-handler';

const metrics = new ErrorMetrics({
  enablePrometheus: true,
  customLabels: { service: 'user-service' },
  retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
  maxErrors: 10000
});

// Record errors
metrics.recordError(error, { 
  service: 'user-service',
  userId: '123',
  requestId: 'req-456'
});

// Get statistics
const stats = metrics.getStats();
console.log('Total errors:', stats.totalErrors);
console.log('Error rate:', stats.errorRate);
console.log('Top errors:', stats.topErrors);

// Prometheus metrics
const prometheus = new PrometheusMetrics({
  serviceName: 'user-service',
  version: '1.0.0'
});

// Export metrics for Prometheus
app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(prometheus.export());
});
```

#### Retry Strategies

```typescript
import { 
  retry, 
  RetryStrategy, 
  DatabaseRetryStrategy,
  ApiRetryStrategy 
} from '@osmanekrem/error-handler';

// Basic retry
const result = await retry(
  () => riskyOperation(),
  { maxAttempts: 3, delay: 1000 }
);

// Database retry strategy
const dbRetry = new DatabaseRetryStrategy({
  maxAttempts: 5,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2
});

const user = await dbRetry.execute(() => getUserFromDB(id));

// API retry strategy
const apiRetry = new ApiRetryStrategy({
  maxAttempts: 3,
  baseDelay: 500,
  maxDelay: 5000,
  retryableStatusCodes: [500, 502, 503, 504]
});

const data = await apiRetry.execute(() => callExternalAPI());
```

#### Error Caching and Deduplication

```typescript
import { ErrorCache, DeduplicationService } from '@osmanekrem/error-handler';

const errorCache = new ErrorCache({
  maxSize: 1000,
  ttl: 300000, // 5 minutes
  cleanupInterval: 60000 // 1 minute
});

const deduplication = new DeduplicationService({
  windowSize: 60000, // 1 minute
  maxDuplicates: 10
});

// Cache errors
errorCache.set('user-123', error);

// Deduplicate errors
const result = await deduplication.processError(error, {
  userId: '123',
  operation: 'getUser'
});

if (result.isDuplicate) {
  console.log('Duplicate error detected');
} else {
  console.log('New error, processing...');
}
```

## 🎯 Examples

### E-commerce API Example

```typescript
import { 
  createError, 
  errorHandler, 
  CircuitBreaker,
  ErrorMetrics 
} from '@osmanekrem/error-handler';

class OrderService {
  private circuitBreaker = new CircuitBreaker();
  private metrics = new ErrorMetrics();

  async createOrder(orderData: OrderData) {
    try {
      // Validate order data
      this.validateOrderData(orderData);
      
      // Check inventory with circuit breaker
      const inventory = await this.circuitBreaker.execute(
        () => this.checkInventory(orderData.items),
        'inventory-service'
      );
      
      // Process payment
      const payment = await this.processPayment(orderData.payment);
      
      // Create order
      const order = await this.saveOrder(orderData);
      
      return order;
    } catch (error) {
      const appError = errorHandler(error, 'create-order', {
        logErrors: true,
        sanitizeContext: true
      });
      
      this.metrics.recordError(appError, {
        service: 'order-service',
        operation: 'createOrder'
      });
      
      throw appError;
    }
  }

  private validateOrderData(data: OrderData) {
    if (!data.items || data.items.length === 0) {
      throw createError.validation('Order must contain at least one item');
    }
    
    if (!data.payment) {
      throw createError.missingRequiredField('payment');
    }
    
    if (data.total <= 0) {
      throw createError.businessRuleViolation('Order total must be greater than 0');
    }
  }

  private async checkInventory(items: OrderItem[]) {
    // External service call
    const response = await fetch('/api/inventory/check', {
      method: 'POST',
      body: JSON.stringify({ items })
    });
    
    if (!response.ok) {
      throw createError.external('InventoryService', 'Failed to check inventory');
    }
    
    return response.json();
  }
}
```

### Microservice Communication Example

```typescript
import { 
  createError, 
  CircuitBreaker,
  retry,
  ApiRetryStrategy 
} from '@osmanekrem/error-handler';

class UserService {
  private userCircuitBreaker = new CircuitBreaker({
    failureThreshold: 3,
    recoveryTimeout: 30000
  });
  
  private paymentRetry = new ApiRetryStrategy({
    maxAttempts: 3,
    baseDelay: 1000,
    retryableStatusCodes: [500, 502, 503, 504]
  });

  async getUserWithPaymentInfo(userId: string) {
    try {
      // Get user with circuit breaker protection
      const user = await this.userCircuitBreaker.execute(
        () => this.getUser(userId),
        'user-service'
      );
      
      if (!user) {
        throw createError.notFound('User', { userId });
      }
      
      // Get payment info with retry strategy
      const paymentInfo = await this.paymentRetry.execute(
        () => this.getPaymentInfo(userId),
        'payment-service'
      );
      
      return {
        ...user,
        paymentInfo
      };
    } catch (error) {
      if (error.code === 'SERVICE_UNAVAILABLE') {
        // Circuit breaker is open, return cached data
        return this.getCachedUser(userId);
      }
      throw error;
    }
  }
}
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

### Hono Integration

Seamless integration with Hono framework.

```typescript
import { Hono } from 'hono';
import { honoErrorMiddleware, honoErrorHandler, createHonoError } from '@osmanekrem/error-handler';

const app = new Hono();

// Using middleware approach
app.use('*', honoErrorMiddleware({
  logErrors: true,
  includeStack: process.env.NODE_ENV === 'development',
  sanitizeContext: true
}));

// Or using onError hook
app.onError(honoErrorHandler({
  logErrors: true,
  includeStack: process.env.NODE_ENV === 'development'
}));

// Route handlers
app.get('/users/:id', async (c) => {
  const user = await getUser(c.req.param('id'));
  if (!user) {
    throw createHonoError('USER_NOT_FOUND', 'User not found', 404, { 
      userId: c.req.param('id') 
    });
  }
  return c.json(user);
});

app.post('/users', async (c) => {
  const body = await c.req.json();
  if (!body.email) {
    throw createHonoError('MISSING_REQUIRED_FIELD', 'Email is required', 400, {
      field: 'email'
    });
  }
  // Create user logic
  return c.json({ success: true });
});
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

## 🎯 Best Practices

### 1. Use Structured Errors

```typescript
// ✅ Good - Structured and informative
throw createError.notFound('User', { 
  userId: '123',
  operation: 'getUser',
  timestamp: new Date().toISOString()
});

// ❌ Bad - Generic and unhelpful
throw new Error('User not found');
```

### 2. Include Rich Context

```typescript
// ✅ Good - Rich context for debugging
throw createError.database('Query failed', {
  query: 'SELECT * FROM users WHERE id = ?',
  parameters: ['123'],
  userId: '123',
  operation: 'getUser',
  database: 'postgres',
  connectionId: 'conn-456'
});

// ❌ Bad - Minimal context
throw createError.database('Query failed');
```

### 3. Use Circuit Breakers for External Services

```typescript
// ✅ Good - Protected external calls
const circuitBreaker = new CircuitBreaker();
const result = await circuitBreaker.execute(
  () => callExternalAPI(),
  'external-service'
);

// ❌ Bad - No protection
const result = await callExternalAPI();
```

### 4. Implement Proper Error Handling

```typescript
// ✅ Good - Comprehensive error handling
try {
  const user = await getUser(id);
} catch (error) {
  if (isAppErrorWithCode(error, 'USER_NOT_FOUND')) {
    return { success: false, message: 'User not found' };
  }
  
  if (isRetryableAppError(error)) {
    // Implement retry logic
    return retry(() => getUser(id), { maxAttempts: 3 });
  }
  
  throw errorHandler(error, 'getUser', {
    logErrors: true,
    sanitizeContext: true
  });
}

// ❌ Bad - Poor error handling
try {
  const user = await getUser(id);
} catch (error) {
  console.log(error); // Just logging
}
```

### 5. Use Type Guards for Error Checking

```typescript
// ✅ Good - Type-safe error checking
if (isAppError(error)) {
  console.log('Error code:', error.code);
  console.log('Severity:', error.getSeverity());
  
  if (error.isTypeOf('USER_NOT_FOUND')) {
    // Handle specific error type
  }
}

// ❌ Bad - Unsafe error checking
if (error.code === 'USER_NOT_FOUND') {
  // TypeScript error - error might not have code property
}
```

### 6. Implement Error Monitoring

```typescript
// ✅ Good - Comprehensive monitoring
const metrics = new ErrorMetrics({
  enablePrometheus: true,
  customLabels: { service: 'user-service' }
});

try {
  await riskyOperation();
} catch (error) {
  const appError = errorHandler(error, 'risky-operation');
  
  metrics.recordError(appError, {
    service: 'user-service',
    userId: '123',
    requestId: 'req-456'
  });
  
  throw appError;
}
```

### 7. Use Appropriate Error Codes

```typescript
// ✅ Good - Appropriate error codes
if (!user) {
  throw createError.notFound('User', { userId });
}

if (!isValidEmail(email)) {
  throw createError.invalidFormat('email', 'user@domain.com');
}

if (balance < amount) {
  throw createError.insufficientFunds(amount, balance);
}

// ❌ Bad - Generic error codes
if (!user) {
  throw createError.internal('User not found');
}
```

## 🔧 Troubleshooting

### Common Issues

#### 1. TypeScript Errors

**Problem**: TypeScript can't find module types
```typescript
// Error: Cannot find module '@osmanekrem/error-handler'
```

**Solution**: Ensure proper installation and TypeScript configuration
```bash
npm install @osmanekrem/error-handler
# or
yarn add @osmanekrem/error-handler
```

#### 2. Circuit Breaker Not Working

**Problem**: Circuit breaker always returns errors
```typescript
// Circuit breaker is always OPEN
```

**Solution**: Check configuration and failure threshold
```typescript
const circuitBreaker = new CircuitBreaker({
  failureThreshold: 5,        // Increase if needed
  recoveryTimeout: 60000,     // Check timeout value
  monitoringPeriod: 10000     // Adjust monitoring period
});
```

#### 3. Error Context Not Sanitized

**Problem**: Sensitive data in error logs
```typescript
// Password appears in error context
```

**Solution**: Enable context sanitization
```typescript
const appError = errorHandler(error, 'operation', {
  sanitizeContext: true  // Enable sanitization
});
```

#### 4. Metrics Not Recording

**Problem**: Error metrics not being recorded
```typescript
// metrics.getStats() returns empty data
```

**Solution**: Ensure metrics are properly initialized and errors are recorded
```typescript
const metrics = new ErrorMetrics({
  enablePrometheus: true,
  retentionPeriod: 24 * 60 * 60 * 1000
});

// Record errors explicitly
metrics.recordError(error, { service: 'my-service' });
```

### Debug Mode

Enable debug mode for detailed error information:

```typescript
const appError = errorHandler(error, 'operation', {
  logErrors: true,
  logLevel: 'debug',
  includeStack: true
});
```

### Performance Issues

If you experience performance issues:

1. **Disable stack traces in production**:
```typescript
const appError = errorHandler(error, 'operation', {
  includeStack: process.env.NODE_ENV === 'development'
});
```

2. **Limit error cache size**:
```typescript
const errorCache = new ErrorCache({
  maxSize: 1000,  // Reduce if needed
  ttl: 300000     // 5 minutes
});
```

3. **Use error batching**:
```typescript
// Batch errors for better performance
const errorBatcher = new ErrorBatcher({
  batchSize: 100,
  flushInterval: 5000
});
```

## 🔄 Migration Guide

### From Basic Error Handling

**Before**:
```typescript
try {
  const user = await getUser(id);
} catch (error) {
  console.error('Error:', error.message);
  throw new Error('User not found');
}
```

**After**:
```typescript
import { createError, errorHandler } from '@osmanekrem/error-handler';

try {
  const user = await getUser(id);
} catch (error) {
  const appError = errorHandler(error, 'getUser', {
    logErrors: true,
    sanitizeContext: true
  });
  throw appError;
}
```

### From Express Error Handling

**Before**:
```typescript
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
});
```

**After**:
```typescript
import { expressErrorMiddleware } from '@osmanekrem/error-handler';

app.use(expressErrorMiddleware({
  logErrors: true,
  includeStack: process.env.NODE_ENV === 'development'
}));
```

### From Custom Error Classes

**Before**:
```typescript
class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User not found: ${userId}`);
    this.name = 'UserNotFoundError';
  }
}
```

**After**:
```typescript
import { createError } from '@osmanekrem/error-handler';

// Use factory function
throw createError.notFound('User', { userId });
```

## ⚡ Performance

### Benchmarks

| Operation | Time (ms) | Memory (MB) |
|-----------|-----------|-------------|
| Create AppError | 0.01 | 0.1 |
| Error Handler | 0.05 | 0.2 |
| Circuit Breaker | 0.02 | 0.3 |
| Error Metrics | 0.03 | 0.5 |
| Error Caching | 0.01 | 0.2 |

### Performance Tips

1. **Use error caching** for frequently occurring errors
2. **Disable stack traces** in production
3. **Batch error metrics** for better performance
4. **Use circuit breakers** to prevent cascade failures
5. **Implement error deduplication** to reduce noise

### Memory Usage

```typescript
// Monitor memory usage
const metrics = new ErrorMetrics({
  maxErrors: 10000,  // Limit error records
  retentionPeriod: 24 * 60 * 60 * 1000  // 24 hours
});

// Clean up old errors
setInterval(() => {
  metrics.reset();
}, 24 * 60 * 60 * 1000); // Reset every 24 hours
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/osmanekrem/error-handler.git

# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build the project
npm run build

# Run linting
npm run lint
```

### Code Style

- Use TypeScript strict mode
- Follow ESLint rules
- Write comprehensive tests
- Update documentation
- Follow conventional commits

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 [Documentation](https://github.com/osmanekrem/error-handler#readme)
- 🐛 [Report Issues](https://github.com/osmanekrem/error-handler/issues)
- 💬 [Discussions](https://github.com/osmanekrem/error-handler/discussions)
- 📧 [Email Support](mailto:support@osmanekrem.com)

---

<div align="center">

**Made with ❤️ by [Osman Ekrem](https://github.com/osmanekrem)**

[⭐ Star on GitHub](https://github.com/osmanekrem/error-handler) • [📦 View on NPM](https://www.npmjs.com/package/@osmanekrem/error-handler) • [🐛 Report Bug](https://github.com/osmanekrem/error-handler/issues)

</div>
