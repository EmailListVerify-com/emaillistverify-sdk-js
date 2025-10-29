/**
 * Error handling for EmailListVerify SDK
 */

import type { ApiErrorResponse } from '../types';

/**
 * Base error class for all EmailListVerify SDK errors
 */
export class EmailListVerifyError extends Error {
  /**
   * HTTP status code (if applicable)
   */
  public readonly statusCode?: number;

  /**
   * Error code/type from API
   */
  public readonly code?: string;

  /**
   * Original error response from API
   */
  public readonly response?: ApiErrorResponse;

  /**
   * Original cause of error (if applicable)
   */
  public readonly cause?: Error;

  constructor(
    message: string,
    statusCode?: number,
    code?: string,
    response?: ApiErrorResponse,
    cause?: Error
  ) {
    super(message);
    this.name = 'EmailListVerifyError';
    this.statusCode = statusCode;
    this.code = code;
    this.response = response;
    this.cause = cause;

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Authentication error - Invalid API key
 * HTTP 401
 */
export class AuthenticationError extends EmailListVerifyError {
  constructor(message = 'Invalid API key', response?: ApiErrorResponse) {
    super(message, 401, 'AUTH_ERROR', response);
    this.name = 'AuthenticationError';
  }
}

/**
 * Forbidden error - Insufficient permissions or credits
 * HTTP 403
 */
export class ForbiddenError extends EmailListVerifyError {
  constructor(message = 'Forbidden', response?: ApiErrorResponse) {
    super(message, 403, 'FORBIDDEN', response);
    this.name = 'ForbiddenError';
  }
}

/**
 * Not enough credits error
 * HTTP 403 with specific message
 */
export class InsufficientCreditsError extends EmailListVerifyError {
  public readonly creditsRequired?: number;

  constructor(message: string, creditsRequired?: number, response?: ApiErrorResponse) {
    super(message, 403, 'INSUFFICIENT_CREDITS', response);
    this.name = 'InsufficientCreditsError';
    this.creditsRequired = creditsRequired;
  }
}

/**
 * Too many concurrent jobs error
 * HTTP 403
 */
export class TooManyJobsError extends EmailListVerifyError {
  constructor(message = 'Too many running email jobs', response?: ApiErrorResponse) {
    super(message, 403, 'TOO_MANY_JOBS', response);
    this.name = 'TooManyJobsError';
  }
}

/**
 * Resource not found error
 * HTTP 404
 */
export class NotFoundError extends EmailListVerifyError {
  public readonly resourceType?: string;
  public readonly resourceId?: string;

  constructor(
    message = 'Resource not found',
    resourceType?: string,
    resourceId?: string,
    response?: ApiErrorResponse
  ) {
    super(message, 404, 'NOT_FOUND', response);
    this.name = 'NotFoundError';
    this.resourceType = resourceType;
    this.resourceId = resourceId;
  }
}

/**
 * Email job not found error
 * HTTP 404
 */
export class EmailJobNotFoundError extends NotFoundError {
  constructor(jobId: string, response?: ApiErrorResponse) {
    super('Email job not found', 'EmailJob', jobId, response);
    this.name = 'EmailJobNotFoundError';
  }
}

/**
 * Email list not found error
 * HTTP 404
 */
export class MaillistNotFoundError extends NotFoundError {
  constructor(listId: string, response?: ApiErrorResponse) {
    super('Email list not found', 'Maillist', listId, response);
    this.name = 'MaillistNotFoundError';
  }
}

/**
 * Placement test not found error
 * HTTP 404
 */
export class PlacementTestNotFoundError extends NotFoundError {
  constructor(code?: string, response?: ApiErrorResponse) {
    super(
      code ? `Placement test not found: ${code}` : 'Placement test not found',
      'PlacementTest',
      code,
      response
    );
    this.name = 'PlacementTestNotFoundError';
  }
}

/**
 * Bad request error - Invalid input
 * HTTP 400
 */
export class BadRequestError extends EmailListVerifyError {
  constructor(message = 'Bad request', response?: ApiErrorResponse) {
    super(message, 400, 'BAD_REQUEST', response);
    this.name = 'BadRequestError';
  }
}

/**
 * Invalid file error - File format or content issues
 * HTTP 400
 */
export class InvalidFileError extends EmailListVerifyError {
  constructor(message: string, response?: ApiErrorResponse) {
    super(message, 400, 'INVALID_FILE', response);
    this.name = 'InvalidFileError';
  }
}

/**
 * Email list not finished error - Trying to download/delete unfinished list
 * HTTP 400
 */
export class MaillistNotFinishedError extends EmailListVerifyError {
  constructor(message = 'Maillist has not finished yet', response?: ApiErrorResponse) {
    super(message, 400, 'MAILLIST_NOT_FINISHED', response);
    this.name = 'MaillistNotFinishedError';
  }
}

/**
 * Rate limit error - Too many requests
 * HTTP 429
 */
export class RateLimitError extends EmailListVerifyError {
  public readonly retryAfter?: number;

  constructor(message = 'Rate limit exceeded', retryAfter?: number, response?: ApiErrorResponse) {
    super(message, 429, 'RATE_LIMIT', response);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Network error - Connection issues, timeout, etc.
 */
export class NetworkError extends EmailListVerifyError {
  constructor(message: string, cause?: Error) {
    super(message, undefined, 'NETWORK_ERROR', undefined, cause);
    this.name = 'NetworkError';
  }
}

/**
 * Request timeout error
 */
export class TimeoutError extends EmailListVerifyError {
  constructor(message = 'Request timeout', cause?: Error) {
    super(message, undefined, 'TIMEOUT', undefined, cause);
    this.name = 'TimeoutError';
  }
}

/**
 * Validation error - Client-side validation failed
 */
export class ValidationError extends EmailListVerifyError {
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(message, undefined, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * Parse error - Failed to parse API response
 */
export class ParseError extends EmailListVerifyError {
  constructor(message: string, cause?: Error) {
    super(message, undefined, 'PARSE_ERROR', undefined, cause);
    this.name = 'ParseError';
  }
}

/**
 * Create appropriate error from HTTP response
 */
export function createErrorFromResponse(
  statusCode: number,
  responseBody: string | ApiErrorResponse | null,
  defaultMessage = 'API request failed'
): EmailListVerifyError {
  let apiResponse: ApiErrorResponse | undefined;
  let message = defaultMessage;

  // Try to parse error response
  if (typeof responseBody === 'object' && responseBody !== null) {
    apiResponse = responseBody;
    message = apiResponse.message || defaultMessage;
  } else if (typeof responseBody === 'string') {
    try {
      apiResponse = JSON.parse(responseBody) as ApiErrorResponse;
      message = apiResponse.message || defaultMessage;
    } catch {
      message = responseBody || defaultMessage;
    }
  }

  // Map status codes to specific error types
  switch (statusCode) {
    case 400: {
      // Check for specific 400 error types
      if (message.toLowerCase().includes('file')) {
        return new InvalidFileError(message, apiResponse);
      }
      if (message.toLowerCase().includes('not finished')) {
        return new MaillistNotFinishedError(message, apiResponse);
      }
      return new BadRequestError(message, apiResponse);
    }

    case 401:
      return new AuthenticationError(message, apiResponse);

    case 403: {
      // Check for specific 403 error types
      if (message.toLowerCase().includes('credit')) {
        // Try to extract credits required from message
        const match = message.match(/(\d+)\s+required/);
        const creditsRequired = match ? parseInt(match[1], 10) : undefined;
        return new InsufficientCreditsError(message, creditsRequired, apiResponse);
      }
      if (message.toLowerCase().includes('too many')) {
        return new TooManyJobsError(message, apiResponse);
      }
      return new ForbiddenError(message, apiResponse);
    }

    case 404: {
      // Check for specific 404 error types
      if (message.toLowerCase().includes('email job')) {
        // Try to extract job ID from context
        return new EmailJobNotFoundError('unknown', apiResponse);
      }
      if (
        message.toLowerCase().includes('email list') ||
        message.toLowerCase().includes('maillist')
      ) {
        return new MaillistNotFoundError('unknown', apiResponse);
      }
      if (message.toLowerCase().includes('placement test')) {
        return new PlacementTestNotFoundError(undefined, apiResponse);
      }
      return new NotFoundError(message, undefined, undefined, apiResponse);
    }

    case 429:
      return new RateLimitError(message, undefined, apiResponse);

    default:
      return new EmailListVerifyError(message, statusCode, 'API_ERROR', apiResponse);
  }
}

/**
 * Check if an error is an instance of EmailListVerifyError
 */
export function isEmailListVerifyError(error: unknown): error is EmailListVerifyError {
  return error instanceof EmailListVerifyError;
}

/**
 * Type guard for specific error types
 */
export function isAuthenticationError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError;
}

export function isInsufficientCreditsError(error: unknown): error is InsufficientCreditsError {
  return error instanceof InsufficientCreditsError;
}

export function isRateLimitError(error: unknown): error is RateLimitError {
  return error instanceof RateLimitError;
}

export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError;
}

export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isPlacementTestNotFoundError(error: unknown): error is PlacementTestNotFoundError {
  return error instanceof PlacementTestNotFoundError;
}
