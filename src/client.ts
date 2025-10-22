/**
 * Main EmailListVerify API client
 */

import type {
  ClientConfig,
  VerifyEmailResponse,
  VerifyEmailDetailedResponse,
  CreateEmailJobRequest,
  CreateEmailJobResponse,
  EmailJobResponse,
  FindContactRequest,
  FindContactResponse,
  CheckDisposableResponse,
  BulkUploadResponse,
  MaillistProgressResponse,
  DownloadMaillistOptions,
  DownloadMaillistResponse,
  CreditsResponse,
} from './types';
import { HttpClient, createHttpClient } from './utils/http';
import { ValidationError } from './utils/errors';
import { VERSION } from './version';

/**
 * Default configuration values
 */
const DEFAULT_BASE_URL = 'https://api.emaillistverify.com';
const DEFAULT_TIMEOUT = 30000; // 30 seconds

/**
 * EmailListVerify API Client
 * Provides methods for all EmailListVerify API endpoints
 */
export class EmailListVerifyClient {
  private readonly http: HttpClient;

  /**
   * Create a new EmailListVerify client
   *
   * @param apiKey - Your EmailListVerify API key
   * @param options - Optional configuration
   *
   * @example
   * ```typescript
   * const client = new EmailListVerifyClient('your-api-key');
   * ```
   */
  constructor(apiKey: string, options?: Partial<Omit<ClientConfig, 'apiKey'>>) {
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
      throw new ValidationError('API key is required and must be a non-empty string', 'apiKey');
    }

    // Build User-Agent header
    const userAgent = this.buildUserAgent();

    this.http = createHttpClient({
      apiKey: apiKey.trim(),
      baseUrl: options?.baseUrl || DEFAULT_BASE_URL,
      timeout: options?.timeout || DEFAULT_TIMEOUT,
      headers: {
        'User-Agent': userAgent,
        ...options?.headers, // Custom headers override defaults
      },
    });
  }

  // ========================================================================
  // Single Email Verification
  // ========================================================================

  /**
   * Verify a single email address (simple)
   * Returns only the deliverability status
   *
   * Credits: 1 per email
   *
   * @param email - Email address to verify
   * @returns Verification result status
   *
   * @example
   * ```typescript
   * const result = await client.verifyEmail('test@example.com');
   * console.log(result); // 'ok' | 'invalid' | 'disposable' | ...
   * ```
   */
  async verifyEmail(email: string): Promise<VerifyEmailResponse> {
    this.validateEmail(email);

    const response = await this.http.get<VerifyEmailResponse>('/api/verifyEmail', { email });
    return response.data;
  }

  /**
   * Verify a single email address (detailed)
   * Returns comprehensive verification data including ESP, name estimation, etc.
   *
   * Credits: 1 per email
   *
   * @param email - Email address to verify
   * @returns Detailed verification result with metadata
   *
   * @example
   * ```typescript
   * const result = await client.verifyEmailDetailed('john.doe@gmail.com');
   * console.log(result.esp); // 'Google'
   * console.log(result.firstName); // 'John'
   * console.log(result.isRole); // false
   * ```
   */
  async verifyEmailDetailed(email: string): Promise<VerifyEmailDetailedResponse> {
    this.validateEmail(email);

    const response = await this.http.get<VerifyEmailDetailedResponse>('/api/verifyEmailDetailed', {
      email,
    });
    return response.data;
  }

  // ========================================================================
  // Async Email Jobs
  // ========================================================================

  /**
   * Create an asynchronous email verification job
   * Use for high-quality verification that may take up to 30 minutes due to greylisting
   *
   * Credits: 1 (standard) or 2 (high quality)
   *
   * @param request - Email and quality level
   * @returns Created job information
   *
   * @example
   * ```typescript
   * const job = await client.createEmailJob({
   *   email: 'test@example.com',
   *   quality: 'high' // optional, defaults to 'standard'
   * });
   * console.log(job.id); // Use this ID to check status later
   * ```
   */
  async createEmailJob(request: CreateEmailJobRequest): Promise<CreateEmailJobResponse> {
    this.validateEmail(request.email);

    const response = await this.http.post<CreateEmailJobResponse>('/api/emailJobs', request);
    return response.data;
  }

  /**
   * Get the status and result of an async email verification job
   *
   * @param jobId - Job ID returned from createEmailJob
   * @returns Job status and result (if finished)
   *
   * @example
   * ```typescript
   * const job = await client.getEmailJob('job-id-123');
   * if (job.status === 'finished') {
   *   console.log(job.result); // Detailed verification result
   * }
   * ```
   */
  async getEmailJob(jobId: string): Promise<EmailJobResponse> {
    this.validateRequired(jobId, 'jobId');

    const response = await this.http.get<EmailJobResponse>(`/api/emailJobs/${jobId}`);
    return response.data;
  }

  // ========================================================================
  // Contact Finder
  // ========================================================================

  /**
   * Find contact email addresses
   * Search for professional email addresses by name and domain
   *
   * Credits: 5-10 per search
   *
   * @param request - Contact search parameters
   * @returns Array of found emails with confidence levels
   *
   * @example
   * ```typescript
   * const contacts = await client.findContact({
   *   firstName: 'John',
   *   lastName: 'Doe',
   *   domain: 'example.com'
   * });
   * contacts.forEach(c => console.log(`${c.email} (${c.confidence})`));
   * ```
   */
  async findContact(request: FindContactRequest): Promise<FindContactResponse> {
    this.validateRequired(request.domain, 'domain');

    const response = await this.http.post<FindContactResponse>('/api/findContact', request);
    return response.data;
  }

  // ========================================================================
  // Disposable Domain Check
  // ========================================================================

  /**
   * Check if a domain is disposable/temporary
   * Fast check without full email verification
   *
   * Credits: 1 per check
   *
   * @param domain - Domain to check
   * @returns Disposable check result
   *
   * @example
   * ```typescript
   * const result = await client.checkDisposable('tempmail.com');
   * console.log(result.result); // 'disposable'
   * ```
   */
  async checkDisposable(domain: string): Promise<CheckDisposableResponse> {
    this.validateRequired(domain, 'domain');

    // Note: API uses POST method with query parameter (unusual pattern)
    const response = await this.http.post<CheckDisposableResponse>(
      '/api/checkDisposable',
      undefined, // No request body
      { domain } // Query parameter
    );
    return response.data;
  }

  // ========================================================================
  // Bulk Email List Verification
  // ========================================================================

  /**
   * Upload a file for bulk email verification
   * Accepts CSV or TXT files with email addresses
   *
   * @param file - File to upload (Blob, File, or Buffer)
   * @param filename - Name of the file
   * @returns File ID for tracking progress
   *
   * @example
   * ```typescript
   * const fileId = await client.uploadBulkFile(fileBlob, 'emails.csv');
   * console.log(fileId); // Use this ID to check progress
   * ```
   */
  async uploadBulkFile(file: Blob | Buffer, filename: string): Promise<BulkUploadResponse> {
    this.validateRequired(file, 'file');
    this.validateRequired(filename, 'filename');

    const formData = new FormData();

    // Handle both Blob (browser) and Buffer (Node.js)
    // Note: API expects field name 'file_contents' (snake_case)
    if (file instanceof Buffer) {
      formData.append('file_contents', new Blob([file]), filename);
    } else {
      formData.append('file_contents', file, filename);
    }

    const response = await this.http.postFormData<BulkUploadResponse>(
      '/api/verifyApiFile',
      formData
    );
    return response.data;
  }

  /**
   * Get the progress of a bulk email list verification
   *
   * @param fileId - File ID returned from uploadBulkFile
   * @returns Progress information including status and completion percentage
   *
   * @example
   * ```typescript
   * const progress = await client.getBulkProgress('file-id-123');
   * console.log(`${progress.progress}% complete`);
   * console.log(`Status: ${progress.status}`);
   * ```
   */
  async getBulkProgress(fileId: string): Promise<MaillistProgressResponse> {
    this.validateRequired(fileId, 'fileId');

    const response = await this.http.get<MaillistProgressResponse>(
      `/api/maillists/${fileId}/progress`
    );
    return response.data;
  }

  /**
   * Download bulk verification results
   * List must be finished before downloading
   *
   * @param fileId - File ID returned from uploadBulkFile
   * @param options - Download options (columns to include, format, filters)
   * @returns File content (CSV or XLSX)
   *
   * @example
   * ```typescript
   * const results = await client.downloadBulkResults('file-id-123', {
   *   format: 'csv',
   *   addFirstName: true,
   *   addLastName: true,
   *   results: ['ok', 'unknown'] // Only include these statuses
   * });
   * ```
   */
  async downloadBulkResults(
    fileId: string,
    options?: DownloadMaillistOptions
  ): Promise<DownloadMaillistResponse> {
    this.validateRequired(fileId, 'fileId');

    // Convert options to query params
    const params: Record<string, string | number | boolean> = {};
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) {
          // Handle array values (convert to comma-separated string)
          if (Array.isArray(value)) {
            params[key] = value.join(',');
          } else if (
            typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean'
          ) {
            params[key] = value;
          }
        }
      });
    }

    const response = await this.http.get<DownloadMaillistResponse>(
      `/api/maillists/${fileId}`,
      params
    );
    return response.data;
  }

  /**
   * Delete a bulk email list
   * Removes the list and frees up a concurrent slot
   *
   * @param fileId - File ID to delete
   *
   * @example
   * ```typescript
   * await client.deleteBulkList('file-id-123');
   * ```
   */
  async deleteBulkList(fileId: string): Promise<void> {
    this.validateRequired(fileId, 'fileId');

    await this.http.delete(`/api/maillists/${fileId}`);
  }

  // ========================================================================
  // Credits
  // ========================================================================

  /**
   * Get your account credit balance
   * Shows both on-demand credits and subscription credits (if applicable)
   *
   * @returns Credit information
   *
   * @example
   * ```typescript
   * const credits = await client.getCredits();
   * console.log(`On-demand: ${credits.onDemand.available}`);
   * if (credits.subscription) {
   *   console.log(`Subscription: ${credits.subscription.available}`);
   *   console.log(`Expires: ${credits.subscription.expiresAt}`);
   * }
   * ```
   */
  async getCredits(): Promise<CreditsResponse> {
    const response = await this.http.get<CreditsResponse>('/api/credits');
    return response.data;
  }

  // ========================================================================
  // Validation Helpers
  // ========================================================================

  /**
   * Validate email format (basic check)
   */
  private validateEmail(email: string): void {
    if (!email || typeof email !== 'string') {
      throw new ValidationError('Email is required and must be a string', 'email');
    }

    const trimmed = email.trim();
    if (trimmed === '') {
      throw new ValidationError('Email cannot be empty', 'email');
    }

    // Basic email format check
    if (!trimmed.includes('@') || trimmed.length < 3) {
      throw new ValidationError('Invalid email format', 'email');
    }
  }

  /**
   * Validate required field
   */
  private validateRequired(value: unknown, fieldName: string): void {
    if (value === undefined || value === null || value === '') {
      throw new ValidationError(`${fieldName} is required`, fieldName);
    }
  }

  /**
   * Build User-Agent header
   */
  private buildUserAgent(): string {
    const runtime =
      typeof process !== 'undefined' && process.versions?.node
        ? `Node.js/${process.version}`
        : 'Browser';

    return `emaillistverify-sdk-js/${VERSION} (${runtime})`;
  }
}
