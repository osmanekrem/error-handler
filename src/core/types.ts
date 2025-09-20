/**
 * Type definitions for @bmad/error-handling
 */

import { AppError } from "./AppError";

export interface AppErrorOptions {
  code: string;
  message: string;
  statusCode?: number;
  isOperational?: boolean;
  context?: Record<string, unknown>;
}

export interface ErrorContext {
  [key: string]: unknown;
}

export interface ErrorHandlerOptions {
  logErrors?: boolean;
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
  includeStack?: boolean;
  sanitizeContext?: boolean;
  onError?: (error: AppError) => void;
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
  halfOpenMaxCalls: number;
}

export interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime?: Date;
  nextAttemptTime?: Date;
  successCount: number;
  callCount: number;
}

export interface ErrorMetadata {
  code: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'auth' | 'validation' | 'resource' | 'database' | 'external' | 'system' | 'business' | 'config' | 'file' | 'workflow';
  retryable: boolean;
  userMessage: string;
  isOperational: boolean;
  statusCode: number;
  timestamp: Date;
}

export interface CircuitBreakerStats {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  totalCalls: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  failureRate: number;
  lastFailureTime?: Date;
  nextAttemptTime?: Date;
  isHealthy: boolean;
}
