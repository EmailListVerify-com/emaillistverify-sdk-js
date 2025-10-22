import { describe, it, expect } from 'vitest';
import {
  EmailListVerifyError,
  AuthenticationError,
  ForbiddenError,
  InsufficientCreditsError,
  TooManyJobsError,
  NotFoundError,
  EmailJobNotFoundError,
  MaillistNotFoundError,
  BadRequestError,
  InvalidFileError,
  MaillistNotFinishedError,
  RateLimitError,
  NetworkError,
  TimeoutError,
  ValidationError,
  ParseError,
  isAuthenticationError,
  isInsufficientCreditsError,
  isRateLimitError,
  isNotFoundError,
  isNetworkError,
  isValidationError,
} from '../../src/utils/errors';

describe('Error Classes', () => {
  describe('EmailListVerifyError (base)', () => {
    it('should create base error with message', () => {
      const error = new EmailListVerifyError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('EmailListVerifyError');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(EmailListVerifyError);
    });

    it('should include response data', () => {
      const responseData = { statusCode: 400, message: 'Bad request', error: 'Bad Request' };
      const error = new EmailListVerifyError(
        'Test error',
        400,
        'TEST_CODE',
        responseData
      );
      expect(error.response).toEqual(responseData);
    });

    it('should include error code', () => {
      const error = new EmailListVerifyError(
        'Test error',
        undefined,
        'TEST_CODE'
      );
      expect(error.code).toBe('TEST_CODE');
    });

    it('should include status code', () => {
      const error = new EmailListVerifyError(
        'Test error',
        400,
        'TEST_CODE'
      );
      expect(error.statusCode).toBe(400);
    });

    it('should include cause', () => {
      const cause = new Error('Original error');
      const error = new EmailListVerifyError(
        'Test error',
        undefined,
        'TEST_CODE',
        undefined,
        cause
      );
      expect(error.cause).toBe(cause);
    });
  });

  describe('AuthenticationError (401)', () => {
    it('should create authentication error', () => {
      const error = new AuthenticationError('Invalid API key');
      expect(error.message).toBe('Invalid API key');
      expect(error.name).toBe('AuthenticationError');
      expect(error.code).toBe('AUTH_ERROR');
      expect(error.statusCode).toBe(401);
      expect(error).toBeInstanceOf(EmailListVerifyError);
      expect(error).toBeInstanceOf(AuthenticationError);
    });

    it('should be detected by type guard', () => {
      const error = new AuthenticationError('Test');
      expect(isAuthenticationError(error)).toBe(true);
      expect(isValidationError(error)).toBe(false);
    });
  });

  describe('ForbiddenError (403)', () => {
    it('should create forbidden error', () => {
      const error = new ForbiddenError('Access denied');
      expect(error.message).toBe('Access denied');
      expect(error.code).toBe('FORBIDDEN');
      expect(error.statusCode).toBe(403);
    });

    // Note: No type guard for ForbiddenError - check statusCode === 403 instead
  });

  describe('InsufficientCreditsError (403)', () => {
    it('should create insufficient credits error', () => {
      const error = new InsufficientCreditsError('Not enough credits');
      expect(error.code).toBe('INSUFFICIENT_CREDITS');
      expect(error.statusCode).toBe(403);
    });

    it('should be detected by type guard', () => {
      const error = new InsufficientCreditsError('Test');
      expect(isInsufficientCreditsError(error)).toBe(true);
    });
  });

  describe('TooManyJobsError (403)', () => {
    it('should create too many jobs error', () => {
      const error = new TooManyJobsError('Job limit reached');
      expect(error.code).toBe('TOO_MANY_JOBS');
      expect(error.statusCode).toBe(403);
    });

    // Note: No type guard for TooManyJobsError
  });

  describe('NotFoundError (404)', () => {
    it('should create not found error', () => {
      const error = new NotFoundError('Resource not found');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.statusCode).toBe(404);
    });

    it('should be detected by type guard', () => {
      const error = new NotFoundError('Test');
      expect(isNotFoundError(error)).toBe(true);
    });
  });

  describe('EmailJobNotFoundError (404)', () => {
    it('should create email job not found error', () => {
      const error = new EmailJobNotFoundError('job-123');
      expect(error.code).toBe('NOT_FOUND'); // Inherits from NotFoundError
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('EmailJobNotFoundError');
    });

    // Note: No dedicated type guard - use isNotFoundError() instead
  });

  describe('MaillistNotFoundError (404)', () => {
    it('should create maillist not found error', () => {
      const error = new MaillistNotFoundError('list-123');
      expect(error.code).toBe('NOT_FOUND'); // Inherits from NotFoundError
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('MaillistNotFoundError');
    });

    // Note: No dedicated type guard - use isNotFoundError() instead
  });

  describe('BadRequestError (400)', () => {
    it('should create bad request error', () => {
      const error = new BadRequestError('Invalid request');
      expect(error.code).toBe('BAD_REQUEST');
      expect(error.statusCode).toBe(400);
    });

    // Note: No type guard for BadRequestError
  });

  describe('InvalidFileError (400)', () => {
    it('should create invalid file error', () => {
      const error = new InvalidFileError('Invalid file format');
      expect(error.code).toBe('INVALID_FILE');
      expect(error.statusCode).toBe(400);
    });

    // Note: No type guard for InvalidFileError
  });

  describe('MaillistNotFinishedError (400)', () => {
    it('should create maillist not finished error', () => {
      const error = new MaillistNotFinishedError('Processing not complete');
      expect(error.code).toBe('MAILLIST_NOT_FINISHED');
      expect(error.statusCode).toBe(400);
    });

    // Note: No type guard for MaillistNotFinishedError
  });

  describe('RateLimitError (429)', () => {
    it('should create rate limit error', () => {
      const error = new RateLimitError('Rate limit exceeded');
      expect(error.code).toBe('RATE_LIMIT');
      expect(error.statusCode).toBe(429);
    });

    it('should be detected by type guard', () => {
      const error = new RateLimitError('Test');
      expect(isRateLimitError(error)).toBe(true);
    });
  });

  describe('NetworkError (client-side)', () => {
    it('should create network error', () => {
      const error = new NetworkError('Network request failed');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.statusCode).toBeUndefined();
    });

    it('should be detected by type guard', () => {
      const error = new NetworkError('Test');
      expect(isNetworkError(error)).toBe(true);
    });

    it('should include cause', () => {
      const cause = new Error('Connection refused');
      const error = new NetworkError('Network failed', cause);
      expect(error.cause).toBe(cause);
    });
  });

  describe('TimeoutError (client-side)', () => {
    it('should create timeout error', () => {
      const error = new TimeoutError('Request timed out');
      expect(error.code).toBe('TIMEOUT');
      expect(error.statusCode).toBeUndefined();
    });

    // Note: No type guard for TimeoutError
  });

  describe('ValidationError (client-side)', () => {
    it('should create validation error', () => {
      const error = new ValidationError('Invalid input');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBeUndefined();
    });

    it('should be detected by type guard', () => {
      const error = new ValidationError('Test');
      expect(isValidationError(error)).toBe(true);
    });
  });

  describe('ParseError (client-side)', () => {
    it('should create parse error', () => {
      const error = new ParseError('Failed to parse response');
      expect(error.code).toBe('PARSE_ERROR');
      expect(error.statusCode).toBeUndefined();
    });

    // Note: No type guard for ParseError
  });

  describe('Type Guards', () => {
    it('should return false for non-error objects', () => {
      expect(isAuthenticationError(null)).toBe(false);
      expect(isValidationError(undefined)).toBe(false);
      expect(isNetworkError({ message: 'test' })).toBe(false);
      expect(isRateLimitError(new Error('test'))).toBe(false);
    });

    it('should return false for different error types', () => {
      const authError = new AuthenticationError('Test');
      expect(isValidationError(authError)).toBe(false);
      expect(isNetworkError(authError)).toBe(false);

      const validationError = new ValidationError('Test');
      expect(isAuthenticationError(validationError)).toBe(false);
      expect(isNetworkError(validationError)).toBe(false);
    });

    it('should handle error inheritance correctly', () => {
      const authError = new AuthenticationError('Test');
      expect(authError).toBeInstanceOf(EmailListVerifyError);
      expect(authError).toBeInstanceOf(Error);
    });
  });
});
