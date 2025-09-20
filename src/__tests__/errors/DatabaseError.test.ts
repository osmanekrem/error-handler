import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseError, createDatabaseError } from '../../errors/DatabaseError';

describe('DatabaseError', () => {
  describe('constructor', () => {
    it('should create database error with basic properties', () => {
      const error = new DatabaseError('CONNECTION_FAILED', 'Database connection lost', {
        connectionId: 'conn-123',
        operation: 'SELECT'
      });

      expect(error.code).toBe('CONNECTION_FAILED');
      expect(error.message).toBe('Database connection lost');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error.domain).toBe('database');
      expect(error.context.connectionId).toBe('conn-123');
      expect(error.context.operation).toBe('SELECT');
    });

    it('should create database error with subCode', () => {
      const error = new DatabaseError('QUERY_ERROR', 'Query failed', {}, 'TIMEOUT');

      expect(error.subCode).toBe('TIMEOUT');
      expect(error.getFullCode()).toBe('database.QUERY_ERROR.TIMEOUT');
    });
  });

  describe('methods', () => {
    let error: DatabaseError;

    beforeEach(() => {
      error = new DatabaseError('QUERY_ERROR', 'Query failed', {
        query: 'SELECT * FROM users',
        table: 'users',
        constraint: 'users_email_key',
        operation: 'SELECT',
        connectionId: 'conn-123',
        transactionId: 'txn-456',
        executionTime: 1500
      });
    });

    it('should get query', () => {
      expect(error.getQuery()).toBe('SELECT * FROM users');
    });

    it('should get table', () => {
      expect(error.getTable()).toBe('users');
    });

    it('should get constraint', () => {
      expect(error.getConstraint()).toBe('users_email_key');
    });

    it('should get operation', () => {
      expect(error.getOperation()).toBe('SELECT');
    });

    it('should get connection info', () => {
      const info = error.getConnectionInfo();
      expect(info.connectionId).toBe('conn-123');
      expect(info.transactionId).toBe('txn-456');
    });

    it('should get execution time', () => {
      expect(error.getExecutionTime()).toBe(1500);
    });

    it('should check if connection error', () => {
      expect(error.isConnectionError()).toBe(false);
      
      const connectionError = new DatabaseError('CONNECTION_ERROR', 'Connection failed');
      expect(connectionError.isConnectionError()).toBe(true);
    });

    it('should check if query error', () => {
      expect(error.isQueryError()).toBe(true);
      
      const connectionError = new DatabaseError('CONNECTION_ERROR', 'Connection failed');
      expect(connectionError.isQueryError()).toBe(false);
    });

    it('should check if constraint violation', () => {
      expect(error.isConstraintViolation()).toBe(false);
      
      const constraintError = new DatabaseError('CONSTRAINT_VIOLATION', 'Constraint failed');
      expect(constraintError.isConstraintViolation()).toBe(true);
    });

    it('should check if transaction error', () => {
      expect(error.isTransactionError()).toBe(false);
      
      const transactionError = new DatabaseError('TRANSACTION_ERROR', 'Transaction failed');
      expect(transactionError.isTransactionError()).toBe(true);
    });
  });

  describe('factory functions', () => {
    it('should create connection failed error', () => {
      const error = createDatabaseError.connectionFailed('Connection lost', {
        connectionId: 'conn-123'
      });

      expect(error.code).toBe('CONNECTION_FAILED');
      expect(error.message).toBe('Connection lost');
      expect(error.context.connectionId).toBe('conn-123');
    });

    it('should create query failed error', () => {
      const error = createDatabaseError.queryFailed('SELECT * FROM users', 'Query failed');

      expect(error.code).toBe('QUERY_ERROR');
      expect(error.message).toBe('Query failed');
      expect(error.context.query).toBe('SELECT * FROM users');
    });

    it('should create constraint violation error', () => {
      const error = createDatabaseError.constraintViolation('users_email_key', 'Duplicate email');

      expect(error.code).toBe('CONSTRAINT_VIOLATION');
      expect(error.message).toBe('Duplicate email');
      expect(error.context.constraint).toBe('users_email_key');
    });

    it('should create transaction failed error', () => {
      const error = createDatabaseError.transactionFailed('Transaction rollback');

      expect(error.code).toBe('TRANSACTION_ERROR');
      expect(error.message).toBe('Transaction rollback');
      expect(error.context.operation).toBe('TRANSACTION');
    });

    it('should create timeout error', () => {
      const error = createDatabaseError.timeout('SELECT', 5000);

      expect(error.code).toBe('TIMEOUT');
      expect(error.message).toBe('SELECT timed out after 5000ms');
      expect(error.context.operation).toBe('SELECT');
    });

    it('should create deadlock error', () => {
      const error = createDatabaseError.deadlock('Deadlock detected');

      expect(error.code).toBe('DEADLOCK');
      expect(error.message).toBe('Deadlock detected');
    });

    it('should create lock timeout error', () => {
      const error = createDatabaseError.lockTimeout('users');

      expect(error.code).toBe('LOCK_TIMEOUT');
      expect(error.message).toBe('Lock timeout on table users');
      expect(error.context.table).toBe('users');
    });
  });
});
