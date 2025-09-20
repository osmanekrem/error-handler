import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import { honoErrorHandler, createHonoError } from '../../middleware/hono';
import { AppError } from '../../core/AppError';
import { createError } from '../../factories/createError';

describe('Hono Error Handler', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
  });

  describe('honoErrorHandler', () => {
    it('should handle AppError correctly', async () => {
      const error = createError.notFound('User', { userId: '123' });
      const errorHandler = honoErrorHandler({ includeRequestInfo: false });

      app.onError(errorHandler);
      app.get('/users/:id', () => {
        throw error;
      });

      const res = await app.request('/users/123');
      
      expect(res.status).toBe(404);
      
      const data = await res.json();
      expect(data.error.code).toBe('NOT_FOUND');
      expect(data.error.message).toBe('User not found');
      expect(data.error.statusCode).toBe(404);
    });

    it('should handle unknown errors', async () => {
      const error = new Error('Unknown error');
      const errorHandler = honoErrorHandler({ includeRequestInfo: false });

      app.onError(errorHandler);
      app.get('/users/:id', () => {
        throw error;
      });

      const res = await app.request('/users/123');
      
      expect(res.status).toBe(500);
      
      const data = await res.json();
      expect(data.error.code).toBe('INTERNAL_SERVER_ERROR');
      expect(data.error.message).toBe('Unknown error');
    });

    it('should include request information in context', async () => {
      const error = createError.database('Query failed');
      const errorHandler = honoErrorHandler({ includeRequestInfo: true });

      app.onError(errorHandler);
      app.get('/users/:id', () => {
        throw error;
      });

      const res = await app.request('/users/123');
      
      expect(res.status).toBe(500);
      
      const data = await res.json();
      expect(data.error.code).toBe('DATABASE_ERROR');
      expect(data.error.context.request).toBeDefined();
      expect(data.error.context.request.method).toBe('GET');
    });

    it('should sanitize sensitive information', async () => {
      const error = createError.database('Query failed');
      const errorHandler = honoErrorHandler({ 
        includeRequestInfo: true,
        sanitizeRequest: true
      });

      app.onError(errorHandler);
      app.get('/users/:id', () => {
        throw error;
      });

      const res = await app.request('/users/123', {
        headers: {
          'authorization': 'Bearer token123'
        }
      });
      
      expect(res.status).toBe(500);
      
      const data = await res.json();
      expect(data.error.context.request).toBeDefined();
      expect(data.error.context.request.headers.authorization).toBe('[REDACTED]');
    });

    it('should call custom error handler', async () => {
      const customHandler = vi.fn();
      const error = createError.database('Query failed');
      const errorHandler = honoErrorHandler({ 
        customErrorHandler: customHandler,
        includeRequestInfo: false
      });

      app.onError(errorHandler);
      app.get('/users/:id', () => {
        throw error;
      });

      await app.request('/users/123');

      expect(customHandler).toHaveBeenCalledWith(
        expect.any(AppError),
        expect.any(Object)
      );
    });

    it('should include stack trace when requested', async () => {
      const error = createError.database('Query failed');
      const errorHandler = honoErrorHandler({ 
        includeStack: true,
        includeRequestInfo: false
      });

      app.onError(errorHandler);
      app.get('/users/:id', () => {
        throw error;
      });

      const res = await app.request('/users/123');
      
      expect(res.status).toBe(500);
      
      const data = await res.json();
      expect(data.error.stack).toBeDefined();
    });
  });

  describe('createHonoError', () => {
    it('should create AppError with correct properties', () => {
      const error = createHonoError('TEST_ERROR', 'Test message', 400, { userId: '123' });
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.message).toBe('Test message');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
      expect(error.context).toEqual({ userId: '123' });
    });

    it('should create AppError with default values', () => {
      const error = createHonoError('TEST_ERROR', 'Test message');
      
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error.context).toBeUndefined();
    });
  });

  describe('Integration tests', () => {
    it('should work with multiple routes', async () => {
      const errorHandler = honoErrorHandler({ includeRequestInfo: false });

      app.onError(errorHandler);
      
      app.get('/users/:id', () => {
        throw createError.notFound('User', { userId: '123' });
      });

      app.post('/users', () => {
        throw createError.validation('Invalid input');
      });

      const userRes = await app.request('/users/123');
      expect(userRes.status).toBe(404);
      
      const userData = await userRes.json();
      expect(userData.error.code).toBe('NOT_FOUND');

      const createRes = await app.request('/users', { method: 'POST' });
      expect(createRes.status).toBe(400);
      
      const createData = await createRes.json();
      expect(createData.error.code).toBe('VALIDATION_ERROR');
    });

    it('should work with async routes', async () => {
      const errorHandler = honoErrorHandler({ includeRequestInfo: false });

      app.onError(errorHandler);
      
      app.get('/users/:id', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        throw createError.database('Query failed');
      });

      const res = await app.request('/users/123');
      
      expect(res.status).toBe(500);
      
      const data = await res.json();
      expect(data.error.code).toBe('DATABASE_ERROR');
    });
  });
});