/**
 * EmailListVerify SDK for TypeScript/JavaScript
 * Official SDK for the EmailListVerify API
 *
 * @packageDocumentation
 */

export { VERSION } from './version';

// Export main client
export { EmailListVerifyClient } from './client';

// Export all types
export type {
  // Configuration
  ClientConfig,
  // Common types
  VerificationQuality,
  VerificationResult,
  EmailServiceProvider,
  Gender,
  ConfidenceLevel,
  DisposableResult,
  MaillistStatus,
  EmailJobStatus,
  // Single email verification
  VerifyEmailResponse,
  VerifyEmailDetailedResponse,
  // Async email jobs
  CreateEmailJobRequest,
  CreateEmailJobResponse,
  EmailJobResponse,
  // Bulk verification
  BulkUploadResponse,
  MaillistProgressResponse,
  DownloadMaillistOptions,
  DownloadMaillistResponse,
  MaillistCredits,
  // Find contact
  FindContactRequest,
  FindContactResponse,
  ContactEmailResult,
  // Disposable check
  CheckDisposableResponse,
  // Credits
  CreditsResponse,
  OnDemandCredits,
  SubscriptionCredits,
  // Placement test
  PlacementTestStatus,
  PlacementLocation,
  PlacementTestESP,
  PlacementTestAccountType,
  CreatePlacementTestRequest,
  CreatePlacementTestResponse,
  PlacementTestRecipient,
  PlacementTestSummary,
  PlacementTestResponse,
  // Error types
  ApiErrorResponse,
} from './types';

// Export error classes
export {
  EmailListVerifyError,
  AuthenticationError,
  ForbiddenError,
  InsufficientCreditsError,
  TooManyJobsError,
  NotFoundError,
  EmailJobNotFoundError,
  MaillistNotFoundError,
  PlacementTestNotFoundError,
  BadRequestError,
  InvalidFileError,
  MaillistNotFinishedError,
  RateLimitError,
  NetworkError,
  TimeoutError,
  ValidationError,
  ParseError,
  // Type guards
  isEmailListVerifyError,
  isAuthenticationError,
  isInsufficientCreditsError,
  isRateLimitError,
  isNotFoundError,
  isNetworkError,
  isValidationError,
  isPlacementTestNotFoundError,
} from './utils/errors';
