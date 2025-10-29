/**
 * TypeScript type definitions for EmailListVerify API
 * Based on OpenAPI 3.0 specification
 * API Base URL: https://api.emaillistverify.com
 */

// ============================================================================
// Common Types
// ============================================================================

/**
 * Quality level for email verification
 * - standard: 1 credit per email, quick verification
 * - high: 2 credits per email, includes greylisting handling (up to 30 min delay)
 */
export type VerificationQuality = 'standard' | 'high';

/**
 * Email deliverability status result
 */
export type VerificationResult =
  | 'ok' // Email is valid and deliverable
  | 'unknown' // Unable to verify (no credits charged)
  | 'dead_server' // Domain doesn't exist or no MX server
  | 'invalid_mx' // MX servers misconfigured
  | 'email_disabled' // Email disabled or non-existent
  | 'antispam_system' // Anti-spam blocked verification (no credits charged)
  | 'ok_for_all' // Server accepts all emails (catch-all)
  | 'smtp_protocol' // SMTP communication error (no credits charged)
  | 'invalid_syntax' // Invalid email syntax (no credits charged)
  | 'disposable' // Temporary/disposable email
  | 'spamtrap' // Spam trap email
  | 'error_credit'; // Insufficient credits

/**
 * Email Service Provider
 */
export type EmailServiceProvider =
  | 'Google'
  | 'iCloud'
  | 'AOL'
  | 'Yahoo'
  | 'Zoho Mail'
  | 'Proton Mail'
  | 'Microsoft 365'
  | 'Seznam'
  | 'Namecheap'
  | 'Yandex'
  | 'Mail.ru';

/**
 * Gender estimation
 */
export type Gender = 'male' | 'female';

/**
 * Contact finder confidence level
 */
export type ConfidenceLevel = 'unknown' | 'low' | 'medium' | 'high';

/**
 * Disposable domain check result
 */
export type DisposableResult = 'ok' | 'disposable' | 'dead_server' | 'invalid_mx' | 'unknown';

/**
 * Email list processing status
 */
export type MaillistStatus =
  | 'uploaded' // Successfully uploaded, awaiting processing
  | 'processing' // Currently being verified
  | 'finished' // Verification complete
  | 'inQueue' // Waiting in queue (max 5 concurrent)
  | 'starting' // Verification starting
  | 'error'; // Error occurred (credits returned)

/**
 * Email job status
 */
export type EmailJobStatus = 'processing' | 'finished';

// ============================================================================
// Single Email Verification
// ============================================================================

/**
 * Response from /api/verifyEmail
 * Simple verification returning only the status
 */
export type VerifyEmailResponse = VerificationResult;

// ============================================================================
// Detailed Email Verification
// ============================================================================

/**
 * Response from /api/verifyEmailDetailed
 * Detailed verification with metadata
 */
export interface VerifyEmailDetailedResponse {
  /** The verified email address */
  email: string;
  /** Deliverability status */
  result: VerificationResult;
  /** Internal status of processing */
  internalResult: string | null;
  /** MX server for the email domain */
  mxServer: string | null;
  /** IP address of MX server */
  mxServerIp: string | null;
  /** Email Service Provider */
  esp: EmailServiceProvider | null;
  /** Local part of email (before @) */
  account: string;
  /** Tag part of email (after +) */
  tag: string | null;
  /** Is this a role-based email (info@, support@, etc.) */
  isRole: boolean;
  /** Is this a free email provider domain */
  isFree: boolean;
  /** Is this a no-reply email */
  isNoReply: boolean;
  /** Estimated first name */
  firstName: string | null;
  /** Estimated last name */
  lastName: string | null;
  /** Estimated gender */
  gender: Gender | null;
}

// ============================================================================
// Async Email Jobs
// ============================================================================

/**
 * Request body for /api/emailJobs (POST)
 */
export interface CreateEmailJobRequest {
  /** Email address to verify asynchronously */
  email: string;
  /** Quality of verification (default: standard) */
  quality?: VerificationQuality;
}

/**
 * Response from /api/emailJobs (POST)
 */
export interface CreateEmailJobResponse {
  /** Job ID */
  id: string;
  /** Email being verified */
  email: string;
  /** Quality level */
  quality: VerificationQuality;
}

/**
 * Response from /api/emailJobs/{id} (GET)
 */
export interface EmailJobResponse {
  /** Job ID */
  id: string;
  /** Email being verified */
  email: string;
  /** Quality level */
  quality: VerificationQuality;
  /** Job status */
  status: EmailJobStatus;
  /** Is greylisting being encountered */
  hasGreylist: boolean;
  /** When the job finished (ISO 8601) */
  finishedAt: string | null;
  /** When the job was created (ISO 8601) */
  createdAt: string;
  /** Verification result (null if still processing) */
  result: VerifyEmailDetailedResponse | null;
}

// ============================================================================
// Bulk File Upload
// ============================================================================

/**
 * Response from /api/verifyApiFile (POST)
 * Returns the file ID as plain text
 */
export type BulkUploadResponse = string;

// ============================================================================
// Find Contact
// ============================================================================

/**
 * Request body for /api/findContact (POST)
 */
export interface FindContactRequest {
  /** First name of contact (optional) */
  firstName?: string;
  /** Last name of contact (optional) */
  lastName?: string;
  /** Email domain of company (required) */
  domain: string;
}

/**
 * Contact email result
 */
export interface ContactEmailResult {
  /** Found email address */
  email: string;
  /** Confidence level */
  confidence: ConfidenceLevel;
}

/**
 * Response from /api/findContact (POST)
 * Array of possible contact emails with confidence levels
 */
export type FindContactResponse = ContactEmailResult[];

// ============================================================================
// Disposable Domain Check
// ============================================================================

/**
 * Response from /api/checkDisposable (POST)
 */
export interface CheckDisposableResponse {
  /** The checked domain */
  domain: string;
  /** Disposability status */
  result: DisposableResult;
  /** Internal result status */
  internalResult: string | null;
  /** MX server for the domain */
  mxServer: string | null;
  /** IP address of MX server */
  mxServerIp: string | null;
}

// ============================================================================
// Email List Progress
// ============================================================================

/**
 * Credit information for email list
 */
export interface MaillistCredits {
  /** Credits charged when list started */
  charged: number | null;
  /** Credits returned for failed verifications */
  returned: number | null;
}

/**
 * Response from /api/maillists/{id}/progress (GET)
 */
export interface MaillistProgressResponse {
  /** Processing status */
  status: MaillistStatus;
  /** Completion percentage (0-100) */
  progress: number;
  /** Credit information */
  credits: MaillistCredits;
  /** Name of uploaded file */
  name: string;
  /** When list was uploaded (ISO 8601) */
  createdAt: string;
  /** Last update time (ISO 8601) */
  updatedAt: string;
}

// ============================================================================
// Download Email List
// ============================================================================

/**
 * Options for downloading email list results
 */
export interface DownloadMaillistOptions {
  /** Add first name column */
  addFirstName?: boolean;
  /** Add last name column */
  addLastName?: boolean;
  /** Add gender column */
  addGender?: boolean;
  /** Add is-no-reply column */
  addIsNoReply?: boolean;
  /** Add is-free column */
  addIsFree?: boolean;
  /** Add is-role column */
  addIsRole?: boolean;
  /** Add result column (default: true) */
  addResult?: boolean;
  /** Add email column */
  addEmail?: boolean;
  /** Include original columns (default: true) */
  addOriginal?: boolean;
  /** Include rows without emails */
  addNoEmailRows?: boolean;
  /** Include duplicate emails */
  addDuplicates?: boolean;
  /** Add MX server column */
  addMxServer?: boolean;
  /** Add ESP column */
  addEsp?: boolean;
  /** Add internal result column */
  addInternalResult?: boolean;
  /** Output format */
  format?: 'csv' | 'xlsx';
  /** Filter by result types (comma-separated or array) */
  results?: string | string[];
}

/**
 * Response from /api/maillists/{id} (GET)
 * Returns file content (CSV or XLSX binary)
 */
export type DownloadMaillistResponse = string | Buffer;

// ============================================================================
// Credits
// ============================================================================

/**
 * On-demand credits information
 */
export interface OnDemandCredits {
  /** Available on-demand credits */
  available: number;
}

/**
 * Subscription credits information
 */
export interface SubscriptionCredits {
  /** Available subscription credits */
  available: number;
  /** When subscription expires (ISO 8601) */
  expiresAt: string;
}

/**
 * Response from /api/credits (GET)
 */
export interface CreditsResponse {
  /** On-demand credits (never expire) */
  onDemand: OnDemandCredits;
  /** Subscription credits (optional, if user has subscription) */
  subscription?: SubscriptionCredits;
}

// ============================================================================
// Error Response
// ============================================================================

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  /** HTTP status code */
  statusCode: number;
  /** Error message */
  message: string;
  /** Error type */
  error: string;
}

// ============================================================================
// Client Configuration
// ============================================================================

/**
 * Configuration options for EmailListVerifyClient
 */
export interface ClientConfig {
  /** API key for authentication */
  apiKey: string;
  /** Base URL for API (default: https://api.emaillistverify.com) */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Additional headers to include in all requests */
  headers?: Record<string, string>;
}

// ============================================================================
// Inbox Placement Test
// ============================================================================

/**
 * Placement test status
 */
export type PlacementTestStatus = 'running' | 'complete';

/**
 * Email placement location
 */
export type PlacementLocation = 'inbox' | 'category' | 'spam' | 'waiting' | 'missing';

/**
 * Email Service Provider for placement tests
 */
export type PlacementTestESP = 'google' | 'yahoo' | 'outlook' | 'zoho' | 'other';

/**
 * Email account type
 */
export type PlacementTestAccountType = 'personal' | 'professional';

/**
 * Request body for /api/inboxPlacementTests (POST)
 */
export interface CreatePlacementTestRequest {
  /** Optional name for the placement test */
  name?: string;
  /** Optional webhook URL to receive results when test completes */
  webhookUrl?: string;
}

/**
 * Response from /api/inboxPlacementTests (POST)
 */
export interface CreatePlacementTestResponse {
  /** Unique identifier for the placement test (MongoDB ObjectId) */
  id: string;
  /** Tracking code to include in test emails (e.g., "ELV-A1B2C3D4E5") */
  code: string;
  /** Name of the placement test */
  name: string;
  /** List of seed email addresses to send test emails to */
  emails: string[];
  /** Current status of the placement test */
  status: PlacementTestStatus;
  /** Timestamp when the test was created (ISO 8601) */
  createdAt: string;
}

/**
 * Placement test recipient result
 */
export interface PlacementTestRecipient {
  /** Seed email address */
  email: string;
  /** Email service provider */
  esp: PlacementTestESP;
  /** Type of email account */
  type: PlacementTestAccountType;
  /** Where the email landed */
  placement: PlacementLocation;
  /** When the email was detected (ISO 8601), null if waiting/missing */
  foundAt: string | null;
}

/**
 * Summary of placement results
 */
export interface PlacementTestSummary {
  /** Percentage of emails that landed in primary inbox */
  inbox: number;
  /** Percentage of emails that landed in promotions/social/updates folder */
  promotions: number;
  /** Percentage of emails that landed in spam folder */
  spam: number;
  /** Percentage of emails not yet detected (test still running) */
  waiting: number;
  /** Percentage of emails not found (may have bounced or been blocked) */
  missing: number;
}

/**
 * Response from /api/inboxPlacementTests/{code} (GET)
 */
export interface PlacementTestResponse {
  /** ID of the user who created the test */
  userId: number | null;
  /** Name of the placement test */
  name: string;
  /** Tracking code for the test */
  code: string;
  /** Current status of the test */
  status: PlacementTestStatus;
  /** Email address that sent the test (auto-detected) */
  sender: string | null;
  /** List of seed emails with placement results */
  recipients: PlacementTestRecipient[];
  /** Summary of placement results as percentages */
  summary: PlacementTestSummary;
  /** When the test was created (ISO 8601) */
  createdAt: string;
  /** When the test was last updated (ISO 8601) */
  updatedAt: string | null;
}

// ============================================================================
// Type Exports
// ============================================================================

/**
 * Re-export all types for convenience
 */
export // Already exported above, this is just for documentation
 type {};
