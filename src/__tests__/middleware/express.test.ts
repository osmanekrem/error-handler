import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { expressErrorMiddleware, asyncHandler } from '../../middleware/express';
import { AppError } from '../../core/AppError';
import { createError } from '../../factories/createError';

// Mock Express objects
const createMockRequest = (overrides: Partial<Request> = {}): Partial<Request> => ({
  method: 'GET',
  url: '/users/123',
  path: '/users/123',
  query: { page: '1' },
  params: { id: '123' },
  headers: { 'authorization': 'Bearer token123' },
  body: { name: 'John' },
  ...overrides
});

const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis()
  };
  return res;
};

const createMockNext = (): NextFunction => vi.fn();

describe('Express Error Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = createMockRequest();
    res = createMockResponse();
    next = createMockNext();
  });

  describe('expressErrorMiddleware', () => {
    it('should handle AppError correctly', () => {
      const error = createError.notFound('User', { userId: '123' });
      const middleware = expressErrorMiddleware({ includeRequestInfo: false });

      middleware(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
          statusCode: 404,
          context: { 
            userId: '123',
            handlerContext: 'GET /users/123'
          }
        }
      });
    });

    it('should handle unknown errors', () => {
      const error = new Error('Unknown error');
      const middleware = expressErrorMiddleware({ includeRequestInfo: false });

      middleware(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Unknown error',
          statusCode: 500,
          context: expect.any(Object)
        }
      });
    });

    it('should include request information in context', () => {
      const error = createError.database('Query failed');
      const middleware = expressErrorMiddleware({ includeRequestInfo: true });

      middleware(error, req as Request, res as Response, next);

      const callArgs = (res.json as any).mock.calls[0][0];
      expect(callArgs.error.code).toBe('DATABASE_ERROR');
      expect(callArgs.error.message).toBe('Query failed');
      expect(callArgs.error.statusCode).toBe(500);
      expect(callArgs.error.context.request).toEqual({
        method: 'GET',
        url: '/users/123',
        path: '/users/123',
        query: { page: '1' },
        params: { id: '123' },
        headers: expect.any(Object),
        body: expect.any(Object)
      });
    });

    it('should sanitize sensitive information', () => {
      const error = createError.database('Query failed');
      const middleware = expressErrorMiddleware({ 
        includeRequestInfo: true,
        sanitizeRequest: true
      });

      middleware(error, req as Request, res as Response, next);

      const callArgs = (res.json as any).mock.calls[0][0];
      expect(callArgs.error.context.request).toBeDefined();
      expect(callArgs.error.context.request.headers.authorization).toBe('[REDACTED]');
    });

    it('should call custom error handler', () => {
      const customHandler = vi.fn();
      const error = createError.database('Query failed');
      const middleware = expressErrorMiddleware({ 
        customErrorHandler: customHandler,
        includeRequestInfo: false
      });

      middleware(error, req as Request, res as Response, next);

      expect(customHandler).toHaveBeenCalledWith(
        expect.any(AppError),
        req,
        res
      );
    });

    it('should include stack trace in development', () => {
      const error = createError.database('Query failed');
      const middleware = expressErrorMiddleware({ 
        includeStack: true,
        includeRequestInfo: false
      });

      middleware(error, req as Request, res as Response, next);

      const callArgs = (res.json as any).mock.calls[0][0];
      expect(callArgs.error.stack).toBeDefined();
    });
  });

  describe('asyncHandler', () => {
    it('should catch async errors and pass to next', async () => {
      const error = createError.database('Query failed');
      const asyncFn = vi.fn().mockRejectedValue(error);
      const handler = asyncHandler(asyncFn);

      handler(req as Request, res as Response, next);

      // Wait for async operation to complete
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should pass successful results through', async () => {
      const result = { id: '123', name: 'John' };
      const asyncFn = vi.fn().mockResolvedValue(result);
      const handler = asyncHandler(asyncFn);

      await handler(req as Request, res as Response, next);

      expect(asyncFn).toHaveBeenCalledWith(req, res, next);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
