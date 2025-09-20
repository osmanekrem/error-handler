import { describe, it, expect, vi } from 'vitest';
import { retry, Retryable } from '../../recovery/RetryDecorator';
import { createError } from '../../factories/createError';

describe('RetryDecorator', () => {
  describe('retry function', () => {
    it('should succeed on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      
      const result = await retry(fn, { maxAttempts: 3, backoff: 'fixed', delay: 100 });
      
      expect(result.result).toBe('success');
      expect(result.attempts).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      let attempt = 0;
      const fn = vi.fn().mockImplementation(() => {
        attempt++;
        if (attempt < 3) {
          throw createError.database('Connection failed');
        }
        return 'success';
      });
      
      const result = await retry(fn, { maxAttempts: 3, backoff: 'fixed', delay: 10 });
      
      expect(result.result).toBe('success');
      expect(result.attempts).toBe(3);
      expect(result.errors).toHaveLength(2);
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should fail after max attempts', async () => {
      const fn = vi.fn().mockRejectedValue(createError.database('Connection failed'));
      
      await expect(retry(fn, { maxAttempts: 2, backoff: 'fixed', delay: 10 }))
        .rejects.toThrow('Connection failed');
      
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should not retry non-retryable errors', async () => {
      const fn = vi.fn().mockRejectedValue(createError.validation('Invalid input'));
      
      await expect(retry(fn, { maxAttempts: 3, backoff: 'fixed', delay: 10 }))
        .rejects.toThrow('Invalid input');
      
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should use exponential backoff', async () => {
      const fn = vi.fn().mockRejectedValue(createError.database('Connection failed'));
      const startTime = Date.now();
      
      try {
        await retry(fn, { maxAttempts: 3, backoff: 'exponential', delay: 100 });
      } catch (error) {
        // Expected to fail
      }
      
      const duration = Date.now() - startTime;
      // Should take at least 100 + 200 = 300ms
      expect(duration).toBeGreaterThanOrEqual(300);
    });

    it('should call onRetry callback', async () => {
      const onRetry = vi.fn();
      const fn = vi.fn().mockRejectedValue(createError.database('Connection failed'));
      
      try {
        await retry(fn, { 
          maxAttempts: 2, 
          backoff: 'fixed', 
          delay: 10,
          onRetry 
        });
      } catch (error) {
        // Expected to fail
      }
      
      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(expect.any(Object), 1);
    });

    it('should call onMaxRetriesExceeded callback', async () => {
      const onMaxRetriesExceeded = vi.fn();
      const fn = vi.fn().mockRejectedValue(createError.database('Connection failed'));
      
      try {
        await retry(fn, { 
          maxAttempts: 2, 
          backoff: 'fixed', 
          delay: 10,
          onMaxRetriesExceeded 
        });
      } catch (error) {
        // Expected to fail
      }
      
      expect(onMaxRetriesExceeded).toHaveBeenCalledTimes(1);
      expect(onMaxRetriesExceeded).toHaveBeenCalledWith(expect.any(Object), 2);
    });
  });

  describe('Retryable decorator', () => {
    class TestService {
      @Retryable({ maxAttempts: 3, backoff: 'fixed', delay: 10 })
      async riskyOperation(shouldFail: boolean): Promise<{ result: string; attempts: number; errors: any[] }> {
        if (shouldFail) {
          throw createError.database('Operation failed');
        }
        return { result: 'success', attempts: 1, errors: [] };
      }
    }

    it('should retry decorated method', async () => {
      const service = new TestService();
      
      await expect(service.riskyOperation(true))
        .rejects.toThrow('Operation failed');
    });

    it('should succeed decorated method', async () => {
      const service = new TestService();
      
      const result = await service.riskyOperation(false);
      expect(result).toEqual({
        result: {
          result: 'success',
          attempts: 1,
          errors: []
        },
        attempts: 1,
        errors: []
      });
    });
  });
});
