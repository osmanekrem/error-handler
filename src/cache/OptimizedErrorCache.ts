/**
 * Optimized error cache with LRU eviction and batch operations
 */

export interface CachedError {
  error: any;
  timestamp: number;
  count: number;
  lastAccessed: number;
}

export interface ErrorCacheOptions {
  maxSize: number;
  ttl: number;
  cleanupInterval: number;
}

export class OptimizedErrorCache {
  private cache = new Map<string, CachedError>();
  private accessOrder: string[] = [];
  private maxSize: number;
  private ttl: number;
  private cleanupInterval: number;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(options: Partial<ErrorCacheOptions> = {}) {
    this.maxSize = options.maxSize || 1000;
    this.ttl = options.ttl || 300000; // 5 minutes
    this.cleanupInterval = options.cleanupInterval || 60000; // 1 minute
    
    this.startCleanup();
  }

  set(key: string, error: any): void {
    const now = Date.now();
    
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    const cachedError: CachedError = {
      error,
      timestamp: now,
      count: 1,
      lastAccessed: now,
    };

    this.cache.set(key, cachedError);
    this.updateAccessOrder(key);
  }

  get(key: string): any | undefined {
    const cached = this.cache.get(key);
    if (!cached) return undefined;

    const now = Date.now();
    if (now - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      return undefined;
    }

    cached.lastAccessed = now;
    cached.count++;
    this.updateAccessOrder(key);
    return cached.error;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.removeFromAccessOrder(key);
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  size(): number {
    return this.cache.size;
  }

  getStats() {
    const now = Date.now();
    const errors = Array.from(this.cache.values());
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl,
      totalErrors: errors.length,
      expiredErrors: errors.filter(e => now - e.timestamp > this.ttl).length,
      averageAccessCount: errors.reduce((sum, e) => sum + e.count, 0) / errors.length || 0,
      oldestError: Math.min(...errors.map(e => e.timestamp)),
      newestError: Math.max(...errors.map(e => e.timestamp)),
    };
  }

  // Batch operations for better performance
  setBatch(entries: Array<[string, any]>): void {
    const now = Date.now();
    
    entries.forEach(([key, error]) => {
      if (this.cache.size >= this.maxSize) {
        this.evictOldest();
      }

      const cachedError: CachedError = {
        error,
        timestamp: now,
        count: 1,
        lastAccessed: now,
      };

      this.cache.set(key, cachedError);
      this.updateAccessOrder(key);
    });
  }

  getBatch(keys: string[]): Map<string, any> {
    const results = new Map<string, any>();
    const now = Date.now();

    keys.forEach(key => {
      const cached = this.cache.get(key);
      if (cached && now - cached.timestamp <= this.ttl) {
        cached.lastAccessed = now;
        cached.count++;
        this.updateAccessOrder(key);
        results.set(key, cached.error);
      }
    });

    return results;
  }

  private evictOldest(): void {
    if (this.accessOrder.length === 0) return;
    
    const oldestKey = this.accessOrder[0];
    this.cache.delete(oldestKey);
    this.accessOrder.shift();
  }

  private updateAccessOrder(key: string): void {
    // Remove from current position
    this.removeFromAccessOrder(key);
    // Add to end (most recently accessed)
    this.accessOrder.push(key);
  }

  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
    });
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    this.clear();
  }
}
