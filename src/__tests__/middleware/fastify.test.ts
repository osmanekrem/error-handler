import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { fastifyErrorPlugin, createFastifyError } from '../../middleware/fastify';
import { AppError } from '../../core/AppError';
import { createError } from '../../factories/createError';

// Mock Fastify objects
const createMockFastify = (): Partial<FastifyInstance> => ({
  setErrorHandler: vi.fn(),
  decorate: vi.fn(),
  log: {
    error: vi.fn()
  }
});

const createMockRequest = (overrides: Partial<FastifyRequest> = {}): Partial<FastifyRequest> => ({
  method: 'GET',
  url: '/users/123',
  routerPath: '/users/:id',
  query: { page: '1' },
  params: { id: '123' },
  headers: { 'authorization': 'Bearer token123' },
  body: { name: 'John' },
  ...overrides
});

const createMockReply = (): Partial<FastifyReply> => ({
  status: vi.fn().mockReturnThis(),
  send: vi.fn().mockReturnThis()
});

describe('Fastify Error Plugin', () => {
  let fastify: Partial<FastifyInstance>;
  let req: Partial<FastifyRequest>;
  let reply: Partial<FastifyReply>;

  beforeEach(() => {
    fastify = createMockFastify();
    req = createMockRequest();
    reply = createMockReply();
  });

  describe('fastifyErrorPlugin', () => {
    it('should register error handler', async () => {
      await fastifyErrorPlugin(fastify as FastifyInstance, {});

      expect(fastify.setErrorHandler).toHaveBeenCalled();
      expect(fastify.decorate).toHaveBeenCalledWith('createError', expect.any(Function));
    });

    it('should handle AppError correctly', async () => {
      await fastifyErrorPlugin(fastify as FastifyInstance, { includeRequestInfo: false });
      
      const errorHandler = (fastify.setErrorHandler as any).mock.calls[0][0];
      const error = createError.notFound('User', { userId: '123' });

      await errorHandler(error, req as FastifyRequest, reply as FastifyReply);

      expect(reply.status).toHaveBeenCalledWith(404);
      expect(reply.send).toHaveBeenCalledWith({
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
          statusCode: 404,
          context: { 
            userId: '123',
            handlerContext: 'GET /users/:id'
          }
        }
      });
    });

    it('should handle unknown errors', async () => {
      await fastifyErrorPlugin(fastify as FastifyInstance, { includeRequestInfo: false });
      
      const errorHandler = (fastify.setErrorHandler as any).mock.calls[0][0];
      const error = new Error('Unknown error');

      await errorHandler(error, req as FastifyRequest, reply as FastifyReply);

      expect(reply.status).toHaveBeenCalledWith(500);
      expect(reply.send).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Unknown error',
          statusCode: 500,
          context: expect.any(Object)
        }
      });
    });

    it('should include request information in context', async () => {
      await fastifyErrorPlugin(fastify as FastifyInstance, { includeRequestInfo: true });
      
      const errorHandler = (fastify.setErrorHandler as any).mock.calls[0][0];
      const error = createError.database('Query failed');

      await errorHandler(error, req as FastifyRequest, reply as FastifyReply);

      const callArgs = (reply.send as any).mock.calls[0][0];
      expect(callArgs.error.context.request).toBeDefined();
      expect(callArgs.error.context.request).toEqual({
        method: 'GET',
        url: '/users/123',
        path: '/users/:id',
        query: { page: '1' },
        params: { id: '123' },
        headers: expect.any(Object),
        body: expect.any(Object)
      });
    });

    it('should sanitize sensitive information', async () => {
      await fastifyErrorPlugin(fastify as FastifyInstance, { 
        includeRequestInfo: true,
        sanitizeRequest: true
      });
      
      const errorHandler = (fastify.setErrorHandler as any).mock.calls[0][0];
      const error = createError.database('Query failed');

      await errorHandler(error, req as FastifyRequest, reply as FastifyReply);

      const callArgs = (reply.send as any).mock.calls[0][0];
      expect(callArgs.error.context.request).toBeDefined();
      expect(callArgs.error.context.request.headers.authorization).toBe('[REDACTED]');
    });

    it('should call custom error handler', async () => {
      const customHandler = vi.fn();
      await fastifyErrorPlugin(fastify as FastifyInstance, { 
        customErrorHandler: customHandler,
        includeRequestInfo: false
      });
      
      const errorHandler = (fastify.setErrorHandler as any).mock.calls[0][0];
      const error = createError.database('Query failed');

      await errorHandler(error, req as FastifyRequest, reply as FastifyReply);

      expect(customHandler).toHaveBeenCalledWith(
        expect.any(AppError),
        req,
        reply
      );
    });

    it('should handle custom error handler failure', async () => {
      const customHandler = vi.fn().mockRejectedValue(new Error('Handler failed'));
      await fastifyErrorPlugin(fastify as FastifyInstance, { 
        customErrorHandler: customHandler,
        includeRequestInfo: false
      });
      
      const errorHandler = (fastify.setErrorHandler as any).mock.calls[0][0];
      const error = createError.database('Query failed');

      await errorHandler(error, req as FastifyRequest, reply as FastifyReply);

      expect(fastify.log?.error).toHaveBeenCalledWith(expect.any(Error), 'Custom error handler failed');
    });
  });

  describe('createFastifyError', () => {
    it('should create AppError with correct properties', () => {
      const error = createFastifyError('USER_NOT_FOUND', 'User not found', 404, { userId: '123' });

      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe('USER_NOT_FOUND');
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
      expect(error.context).toEqual({ userId: '123' });
    });

    it('should use default status code', () => {
      const error = createFastifyError('INTERNAL_ERROR', 'Something went wrong');

      expect(error.statusCode).toBe(500);
    });
  });
});
