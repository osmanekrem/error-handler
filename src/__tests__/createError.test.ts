import { describe, it, expect } from 'vitest';
import { createError } from '../factories/createError';
import { ErrorCodes } from '../core/ErrorCodes';

describe('createError', () => {
  describe('Authentication errors', () => {
    it('should create unauthorized error', () => {
      const error = createError.unauthorized('Invalid token');
      
      expect(error.code).toBe(ErrorCodes.UNAUTHORIZED);
      expect(error.message).toBe('Invalid token');
      expect(error.statusCode).toBe(401);
      expect(error.isOperational).toBe(true);
    });

    it('should create forbidden error', () => {
      const error = createError.forbidden('Access denied');
      
      expect(error.code).toBe(ErrorCodes.FORBIDDEN);
      expect(error.message).toBe('Access denied');
      expect(error.statusCode).toBe(403);
    });

    it('should create token expired error', () => {
      const error = createError.tokenExpired('Token has expired');
      
      expect(error.code).toBe(ErrorCodes.TOKEN_EXPIRED);
      expect(error.message).toBe('Token has expired');
      expect(error.statusCode).toBe(401);
    });
  });

  describe('Validation errors', () => {
    it('should create validation error', () => {
      const error = createError.validation('Invalid input');
      
      expect(error.code).toBe(ErrorCodes.VALIDATION_ERROR);
      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
    });

    it('should create missing required field error', () => {
      const error = createError.missingRequiredField('email');
      
      expect(error.code).toBe(ErrorCodes.MISSING_REQUIRED_FIELD);
      expect(error.message).toBe("Required field 'email' is missing");
      expect(error.statusCode).toBe(400);
    });

    it('should create invalid format error', () => {
      const error = createError.invalidFormat('email', 'valid email address');
      
      expect(error.code).toBe(ErrorCodes.INVALID_FORMAT);
      expect(error.message).toBe("Invalid format for field 'email', expected: valid email address");
      expect(error.statusCode).toBe(400);
    });
  });

  describe('Resource errors', () => {
    it('should create not found error', () => {
      const error = createError.notFound('User');
      
      expect(error.code).toBe(ErrorCodes.NOT_FOUND);
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
    });

    it('should create conflict error', () => {
      const error = createError.conflict('Email already exists');
      
      expect(error.code).toBe(ErrorCodes.CONFLICT);
      expect(error.message).toBe('Email already exists');
      expect(error.statusCode).toBe(409);
    });

    it('should create duplicate resource error', () => {
      const error = createError.duplicateResource('User');
      
      expect(error.code).toBe(ErrorCodes.DUPLICATE_RESOURCE);
      expect(error.message).toBe('User already exists');
      expect(error.statusCode).toBe(409);
    });
  });

  describe('Database errors', () => {
    it('should create database error', () => {
      const error = createError.database('Connection failed');
      
      expect(error.code).toBe(ErrorCodes.DATABASE_ERROR);
      expect(error.message).toBe('Connection failed');
      expect(error.statusCode).toBe(500);
    });

    it('should create query error', () => {
      const error = createError.queryError('SELECT * FROM users');
      
      expect(error.code).toBe(ErrorCodes.QUERY_ERROR);
      expect(error.message).toBe('Database query failed: SELECT * FROM users');
      expect(error.statusCode).toBe(500);
    });
  });

  describe('External service errors', () => {
    it('should create external service error', () => {
      const error = createError.external('PaymentService', 'API timeout');
      
      expect(error.code).toBe(ErrorCodes.EXTERNAL_SERVICE_ERROR);
      expect(error.message).toBe('PaymentService: API timeout');
      expect(error.statusCode).toBe(502);
    });

    it('should create rate limit exceeded error', () => {
      const error = createError.rateLimitExceeded('API', 60);
      
      expect(error.code).toBe(ErrorCodes.RATE_LIMIT_EXCEEDED);
      expect(error.message).toBe('Rate limit exceeded for API');
      expect(error.statusCode).toBe(429);
      expect(error.context?.retryAfter).toBe(60);
    });
  });

  describe('System errors', () => {
    it('should create internal server error', () => {
      const error = createError.internal('Something went wrong');
      
      expect(error.code).toBe(ErrorCodes.INTERNAL_SERVER_ERROR);
      expect(error.message).toBe('Something went wrong');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(false);
    });

    it('should create timeout error', () => {
      const error = createError.timeout('Database query', 5000);
      
      expect(error.code).toBe(ErrorCodes.TIMEOUT);
      expect(error.message).toBe('Database query timed out after 5000ms');
      expect(error.statusCode).toBe(408);
    });
  });

  describe('File errors', () => {
    it('should create file not found error', () => {
      const error = createError.fileNotFound('config.json');
      
      expect(error.code).toBe(ErrorCodes.FILE_NOT_FOUND);
      expect(error.message).toBe('File not found: config.json');
      expect(error.statusCode).toBe(404);
    });

    it('should create file too large error', () => {
      const error = createError.fileTooLarge('image.jpg', 1024, 512);
      
      expect(error.code).toBe(ErrorCodes.FILE_TOO_LARGE);
      expect(error.message).toBe('File too large: image.jpg (1024 bytes, max 512 bytes)');
      expect(error.statusCode).toBe(413);
    });
  });
});
