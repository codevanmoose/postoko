/**
 * Custom error class for Postoko application errors
 */
export class PostokoError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'PostokoError';
  }
}

/**
 * Common error codes
 */
export const ErrorCodes = {
  // Auth errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // Validation errors
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  
  // Quota errors
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  RATE_LIMITED: 'RATE_LIMITED',
  
  // Integration errors
  PLATFORM_ERROR: 'PLATFORM_ERROR',
  OAUTH_ERROR: 'OAUTH_ERROR',
  API_ERROR: 'API_ERROR',
  
  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

/**
 * Create standardized error responses
 */
export function createErrorResponse(error: PostokoError | Error) {
  if (error instanceof PostokoError) {
    return {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      success: false,
    };
  }
  
  return {
    error: {
      code: ErrorCodes.INTERNAL_ERROR,
      message: error.message || 'An unexpected error occurred',
    },
    success: false,
  };
}

/**
 * Common error factories
 */
export const Errors = {
  unauthorized: (message = 'Unauthorized') =>
    new PostokoError(message, ErrorCodes.UNAUTHORIZED, 401),
  
  notFound: (resource: string) =>
    new PostokoError(`${resource} not found`, ErrorCodes.NOT_FOUND, 404),
  
  validation: (message: string, details?: any) =>
    new PostokoError(message, ErrorCodes.VALIDATION_FAILED, 400, details),
  
  quotaExceeded: (resource: string, limit: number) =>
    new PostokoError(
      `${resource} quota exceeded. Limit: ${limit}`,
      ErrorCodes.QUOTA_EXCEEDED,
      429,
      { resource, limit }
    ),
  
  platformError: (platform: string, message: string) =>
    new PostokoError(
      `${platform} error: ${message}`,
      ErrorCodes.PLATFORM_ERROR,
      503,
      { platform }
    ),
};