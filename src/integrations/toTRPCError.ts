import { AppError } from '../core/AppError';

// TRPC types - optional dependency
type TRPCError = {
  code: string;
  message: string;
  cause?: unknown;
};

/**
 * Convert AppError to TRPCError for tRPC compatibility
 */
export const toTRPCError = (error: AppError): TRPCError => {
  const trpcErrorCode = getTRPCErrorCode(error.statusCode);
  
  return {
    code: trpcErrorCode,
    message: error.message,
    cause: error,
  };
};

/**
 * Map HTTP status codes to tRPC error codes
 */
function getTRPCErrorCode(statusCode: number): 'BAD_REQUEST' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'METHOD_NOT_SUPPORTED' | 'TIMEOUT' | 'CONFLICT' | 'PRECONDITION_FAILED' | 'PAYLOAD_TOO_LARGE' | 'UNPROCESSABLE_CONTENT' | 'TOO_MANY_REQUESTS' | 'CLIENT_CLOSED_REQUEST' | 'INTERNAL_SERVER_ERROR' {
  switch (statusCode) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 405:
      return 'METHOD_NOT_SUPPORTED';
    case 408:
      return 'TIMEOUT';
    case 409:
      return 'CONFLICT';
    case 412:
      return 'PRECONDITION_FAILED';
    case 413:
      return 'PAYLOAD_TOO_LARGE';
    case 422:
      return 'UNPROCESSABLE_CONTENT';
    case 429:
      return 'TOO_MANY_REQUESTS';
    case 499:
      return 'CLIENT_CLOSED_REQUEST';
    default:
      return 'INTERNAL_SERVER_ERROR';
  }
}
