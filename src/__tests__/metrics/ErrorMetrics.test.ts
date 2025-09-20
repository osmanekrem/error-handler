import { describe, it, expect, beforeEach } from 'vitest';
import { ErrorMetrics } from '../../metrics/ErrorMetrics';
import { createError } from '../../factories/createError';

describe('ErrorMetrics', () => {
  let metrics: ErrorMetrics;

  beforeEach(() => {
    metrics = new ErrorMetrics({
      maxErrors: 100,
      retentionPeriod: 60000 // 1 minute for testing
    });
  });

  describe('recordError', () => {
    it('should record error with context', () => {
      const error = createError.database('Query failed', { query: 'SELECT * FROM users' });
      const context = { service: 'user-service', userId: '123' };

      metrics.recordError(error, context);

      const stats = metrics.getStats();
      expect(stats.totalErrors).toBe(1);
      expect(stats.errorsByCode['DATABASE_ERROR']).toBe(1);
    });

    it('should record multiple errors', () => {
      const error1 = createError.database('Query failed');
      const error2 = createError.validation('Invalid input');
      const error3 = createError.database('Connection failed');

      metrics.recordError(error1);
      metrics.recordError(error2);
      metrics.recordError(error3);

      const stats = metrics.getStats();
      expect(stats.totalErrors).toBe(3);
      expect(stats.errorsByCode['DATABASE_ERROR']).toBe(2);
      expect(stats.errorsByCode['VALIDATION_ERROR']).toBe(1);
    });

    it('should respect maxErrors limit', () => {
      const metrics = new ErrorMetrics({ maxErrors: 2 });

      metrics.recordError(createError.database('Error 1'));
      metrics.recordError(createError.database('Error 2'));
      metrics.recordError(createError.database('Error 3'));

      const stats = metrics.getStats();
      expect(stats.totalErrors).toBe(2);
    });
  });

  describe('getStats', () => {
    it('should return comprehensive statistics', () => {
      const error1 = createError.database('Query failed');
      const error2 = createError.validation('Invalid input');
      const error3 = createError.database('Connection failed');

      metrics.recordError(error1, { service: 'user-service' });
      metrics.recordError(error2, { service: 'auth-service' });
      metrics.recordError(error3, { service: 'user-service' });

      const stats = metrics.getStats();

      expect(stats.totalErrors).toBe(3);
      expect(stats.errorsByCode['DATABASE_ERROR']).toBe(2);
      expect(stats.errorsByCode['VALIDATION_ERROR']).toBe(1);
      expect(stats.errorsBySeverity['critical']).toBe(2);
      expect(stats.errorsBySeverity['medium']).toBe(1);
      expect(stats.errorsByCategory['database']).toBe(2);
      expect(stats.errorsByCategory['validation']).toBe(1);
      expect(stats.errorRate).toBeGreaterThanOrEqual(0);
      expect(stats.topErrors).toHaveLength(2);
    });

    it('should calculate error rates correctly', () => {
      const error = createError.database('Query failed');
      
      // Record errors over time
      metrics.recordError(error);
      
      // Wait a bit to simulate time passing
      const startTime = Date.now();
      while (Date.now() - startTime < 100) {
        // Wait 100ms
      }
      
      metrics.recordError(error);

      const stats = metrics.getStats();
      expect(stats.errorRate).toBeGreaterThan(0);
    });
  });

  describe('getErrorsByTimeRange', () => {
    it('should return errors within time range', () => {
      const now = new Date();
      const error1 = createError.database('Error 1');
      const error2 = createError.database('Error 2');

      metrics.recordError(error1);
      
      // Wait a bit
      const startTime = Date.now();
      while (Date.now() - startTime < 100) {
        // Wait 100ms
      }
      
      metrics.recordError(error2);

      const start = new Date(now.getTime() - 1000);
      const end = new Date(now.getTime() + 1000);
      const errors = metrics.getErrorsByTimeRange(start, end);

      expect(errors).toHaveLength(2);
    });
  });

  describe('getErrorsBySeverity', () => {
    it('should return errors by severity', () => {
      const error1 = createError.database('Critical error'); // critical
      const error2 = createError.validation('Validation error'); // medium
      const error3 = createError.database('Another critical error'); // critical

      metrics.recordError(error1);
      metrics.recordError(error2);
      metrics.recordError(error3);

      const criticalErrors = metrics.getErrorsBySeverity('critical');
      const mediumErrors = metrics.getErrorsBySeverity('medium');

      expect(criticalErrors).toHaveLength(2);
      expect(mediumErrors).toHaveLength(1);
    });
  });

  describe('getErrorsByCode', () => {
    it('should return errors by code', () => {
      const error1 = createError.database('Database error');
      const error2 = createError.validation('Validation error');
      const error3 = createError.database('Another database error');

      metrics.recordError(error1);
      metrics.recordError(error2);
      metrics.recordError(error3);

      const databaseErrors = metrics.getErrorsByCode('DATABASE_ERROR');
      const validationErrors = metrics.getErrorsByCode('VALIDATION_ERROR');

      expect(databaseErrors).toHaveLength(2);
      expect(validationErrors).toHaveLength(1);
    });
  });

  describe('getRecentErrors', () => {
    it('should return recent errors', () => {
      const error = createError.database('Recent error');
      metrics.recordError(error);

      const recentErrors = metrics.getRecentErrors(1); // Last 1 minute
      expect(recentErrors).toHaveLength(1);
    });
  });

  describe('reset', () => {
    it('should reset all metrics', () => {
      const error = createError.database('Query failed');
      metrics.recordError(error);

      expect(metrics.getStats().totalErrors).toBe(1);

      metrics.reset();

      expect(metrics.getStats().totalErrors).toBe(0);
    });
  });

  describe('exportMetrics', () => {
    it('should export metrics for external systems', () => {
      const error = createError.database('Query failed');
      metrics.recordError(error, { service: 'user-service' });

      const exported = metrics.exportMetrics();

      expect(exported).toHaveProperty('timestamp');
      expect(exported).toHaveProperty('stats');
      expect(exported).toHaveProperty('customLabels');
      expect(exported).toHaveProperty('retentionPeriod');
      expect(exported).toHaveProperty('maxErrors');
    });
  });
});
