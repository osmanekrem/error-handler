import { describe, it, expect } from 'vitest';
import { AppError } from '../core/AppError';

describe('AppError', () => {
  it('should create error with basic properties', () => {
    const error = new AppError('TEST_ERROR', 'Test message', 400);
    
    expect(error.name).toBe('AppError');
    expect(error.code).toBe('TEST_ERROR');
    expect(error.message).toBe('Test message');
    expect(error.statusCode).toBe(400);
    expect(error.isOperational).toBe(true);
    expect(error.timestamp).toBeInstanceOf(Date);
  });

  it('should create error with context', () => {
    const context = { userId: '123', operation: 'test' };
    const error = new AppError('TEST_ERROR', 'Test message', 400, true, context);
    
    expect(error.context).toEqual(context);
  });

  it('should create non-operational error', () => {
    const error = new AppError('TEST_ERROR', 'Test message', 500, false);
    
    expect(error.isOperational).toBe(false);
  });

  it('should convert to JSON', () => {
    const context = { userId: '123' };
    const error = new AppError('TEST_ERROR', 'Test message', 400, true, context);
    const json = error.toJSON();
    
    expect(json).toMatchObject({
      name: 'AppError',
      code: 'TEST_ERROR',
      message: 'Test message',
      statusCode: 400,
      isOperational: true,
      context,
    });
    expect(json.timestamp).toBeDefined();
    expect(json.stack).toBeDefined();
  });

  it('should convert to object', () => {
    const context = { userId: '123' };
    const error = new AppError('TEST_ERROR', 'Test message', 400, true, context);
    const obj = error.toObject();
    
    expect(obj).toMatchObject({
      code: 'TEST_ERROR',
      message: 'Test message',
      statusCode: 400,
      isOperational: true,
      context,
    });
    expect(obj.timestamp).toBeDefined();
    expect(obj.stack).toBeUndefined();
  });

  it('should check error type', () => {
    const error = new AppError('TEST_ERROR', 'Test message', 400);
    
    expect(error.isTypeOf('TEST_ERROR')).toBe(true);
    expect(error.isTypeOf('OTHER_ERROR')).toBe(false);
  });

  it('should check if operational', () => {
    const operationalError = new AppError('TEST_ERROR', 'Test message', 400, true);
    const nonOperationalError = new AppError('TEST_ERROR', 'Test message', 500, false);
    
    expect(operationalError.isOperationalError()).toBe(true);
    expect(nonOperationalError.isOperationalError()).toBe(false);
  });

  it('should get severity level', () => {
    const error400 = new AppError('TEST_ERROR', 'Test message', 400);
    const error500 = new AppError('TEST_ERROR', 'Test message', 500);
    const error200 = new AppError('TEST_ERROR', 'Test message', 200);
    
    expect(error400.getSeverity()).toBe('high');
    expect(error500.getSeverity()).toBe('critical');
    expect(error200.getSeverity()).toBe('low');
  });
});
