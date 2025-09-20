import { describe, it, expect, beforeEach } from 'vitest';
import { ErrorSerializer } from '../../serialization/ErrorSerializer';
import { createError } from '../../factories/createError';
import { DatabaseError } from '../../errors/DatabaseError';
import { ValidationError } from '../../errors/ValidationError';
import { BusinessError } from '../../errors/BusinessError';

describe('ErrorSerializer', () => {
  let serializer: ErrorSerializer;

  beforeEach(() => {
    serializer = new ErrorSerializer({
      includeStack: true,
      includeContext: true,
      includeMetadata: true
    });
  });

  describe('serialize', () => {
    it('should serialize AppError', () => {
      const error = createError.database('Query failed');
      const serialized = serializer.serialize(error);

      expect(serialized.type).toBe('AppError');
      expect(serialized.code).toBe('DATABASE_ERROR');
      expect(serialized.message).toBe('Query failed');
      expect(serialized.statusCode).toBe(500);
      expect(serialized.isOperational).toBe(true);
      expect(serialized.timestamp).toBeDefined();
      expect(serialized.stack).toBeDefined();
    });

    it('should serialize DatabaseError', () => {
      const error = new DatabaseError('CONNECTION_FAILED', 'Connection lost', {
        connectionId: 'conn-123',
        operation: 'SELECT'
      }, 'TIMEOUT');

      const serialized = serializer.serialize(error);

      expect(serialized.type).toBe('DatabaseError');
      expect(serialized.code).toBe('CONNECTION_FAILED');
      expect(serialized.metadata?.domain).toBe('database');
      expect(serialized.metadata?.subCode).toBe('TIMEOUT');
      expect(serialized.context?.connectionId).toBe('conn-123');
    });

    it('should serialize ValidationError', () => {
      const error = new ValidationError('INVALID_EMAIL', 'Email format is invalid', {
        field: 'email',
        value: 'invalid-email',
        expectedFormat: 'user@domain.com'
      });

      const serialized = serializer.serialize(error);

      expect(serialized.type).toBe('ValidationError');
      expect(serialized.code).toBe('INVALID_EMAIL');
      expect(serialized.metadata?.domain).toBe('validation');
      expect(serialized.context?.field).toBe('email');
    });

    it('should serialize BusinessError', () => {
      const error = new BusinessError('INSUFFICIENT_FUNDS', 'Not enough money', {
        entity: 'account',
        entityId: 'acc-123',
        financialImpact: 1000
      });

      const serialized = serializer.serialize(error);

      expect(serialized.type).toBe('BusinessError');
      expect(serialized.code).toBe('INSUFFICIENT_FUNDS');
      expect(serialized.metadata?.domain).toBe('business');
      expect(serialized.context?.entity).toBe('account');
    });

    it('should sanitize sensitive context', () => {
      const error = createError.database('Query failed', {
        password: 'secret123',
        token: 'abc123',
        normalField: 'value'
      });

      const serialized = serializer.serialize(error);

      expect(serialized.context?.password).toBe('[REDACTED]');
      expect(serialized.context?.token).toBe('[REDACTED]');
      expect(serialized.context?.normalField).toBe('value');
    });
  });

  describe('deserialize', () => {
    it('should deserialize AppError', () => {
      const error = createError.database('Query failed');
      const serialized = serializer.serialize(error);
      const deserialized = serializer.deserialize(serialized);

      expect(deserialized).toBeInstanceOf(Error);
      expect(deserialized.code).toBe('DATABASE_ERROR');
      expect(deserialized.message).toBe('Query failed');
      expect(deserialized.statusCode).toBe(500);
    });

    it('should deserialize DatabaseError', () => {
      const error = new DatabaseError('CONNECTION_FAILED', 'Connection lost', {
        connectionId: 'conn-123'
      }, 'TIMEOUT');

      const serialized = serializer.serialize(error);
      const deserialized = serializer.deserialize(serialized);

      expect(deserialized).toBeInstanceOf(DatabaseError);
      expect(deserialized.code).toBe('CONNECTION_FAILED');
      expect(deserialized.subCode).toBe('TIMEOUT');
      expect(deserialized.context.connectionId).toBe('conn-123');
    });

    it('should deserialize ValidationError', () => {
      const error = new ValidationError('INVALID_EMAIL', 'Email format is invalid', {
        field: 'email'
      });

      const serialized = serializer.serialize(error);
      const deserialized = serializer.deserialize(serialized);

      expect(deserialized).toBeInstanceOf(ValidationError);
      expect(deserialized.code).toBe('INVALID_EMAIL');
      expect(deserialized.context.field).toBe('email');
    });

    it('should deserialize BusinessError', () => {
      const error = new BusinessError('INSUFFICIENT_FUNDS', 'Not enough money', {
        entity: 'account'
      });

      const serialized = serializer.serialize(error);
      const deserialized = serializer.deserialize(serialized);

      expect(deserialized).toBeInstanceOf(BusinessError);
      expect(deserialized.code).toBe('INSUFFICIENT_FUNDS');
      expect(deserialized.context.entity).toBe('account');
    });
  });

  describe('serializeMultiple', () => {
    it('should serialize multiple errors', () => {
      const errors = [
        createError.database('Query failed'),
        createError.validation('Invalid input')
      ];

      const serialized = serializer.serializeMultiple(errors);

      expect(serialized).toHaveLength(2);
      expect(serialized[0].type).toBe('AppError');
      expect(serialized[1].type).toBe('AppError');
    });
  });

  describe('deserializeMultiple', () => {
    it('should deserialize multiple errors', () => {
      const errors = [
        createError.database('Query failed'),
        createError.validation('Invalid input')
      ];

      const serialized = serializer.serializeMultiple(errors);
      const deserialized = serializer.deserializeMultiple(serialized);

      expect(deserialized).toHaveLength(2);
      expect(deserialized[0].code).toBe('DATABASE_ERROR');
      expect(deserialized[1].code).toBe('VALIDATION_ERROR');
    });
  });

  describe('serializeToString', () => {
    it('should serialize error to string', () => {
      const error = createError.database('Query failed');
      const serialized = serializer.serializeToString(error);

      expect(typeof serialized).toBe('string');
      expect(JSON.parse(serialized)).toHaveProperty('code', 'DATABASE_ERROR');
    });
  });

  describe('deserializeFromString', () => {
    it('should deserialize error from string', () => {
      const error = createError.database('Query failed');
      const serialized = serializer.serializeToString(error);
      const deserialized = serializer.deserializeFromString(serialized);

      expect(deserialized.code).toBe('DATABASE_ERROR');
      expect(deserialized.message).toBe('Query failed');
    });
  });
});
