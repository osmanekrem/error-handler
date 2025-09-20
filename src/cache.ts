/**
 * Error caching and deduplication exports
 * Error cache, deduplication service
 */

export { ErrorCache, DeduplicationService } from './cache/index';
export type { 
  ErrorCacheOptions, 
  CachedError, 
  ErrorCacheStats,
  DeduplicationOptions, 
  DeduplicationResult 
} from './cache/index';
