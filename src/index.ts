/**
 * EmailListVerify TypeScript SDK
 * TypeScript/JavaScript wrapper for EmailListVerify REST API
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';

/**
 * Custom exception for EmailListVerify API errors
 */
export class EmailListVerifyException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmailListVerifyException';
    Object.setPrototypeOf(this, EmailListVerifyException.prototype);
  }
}

/**
 * Email verification status types
 */
export type VerificationStatus = 'ok' | 'failed' | 'unknown' | 'error';

/**
 * Options for EmailListVerify client
 */
export interface EmailListVerifyOptions {
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Base URL for API (optional, uses default) */
  baseURL?: string;
}

/**
 * Basic verification result
 */
export interface VerificationResult {
  email: string;
  status: VerificationStatus;
  timestamp: string;
  error?: string;
}

/**
 * Detailed verification result with additional fields
 */
export interface DetailedVerificationResult extends VerificationResult {
  reason?: string;
  disposable?: boolean;
  role?: boolean;
  free?: boolean;
  syntax?: boolean;
  dns?: boolean;
  mx?: boolean;
  smtp?: boolean;
  catch_all?: boolean;
  score?: number;
  user?: string;
  domain?: string;
}

/**
 * Account credits information
 */
export interface CreditsInfo {
  credits: number;
  used_credits: number;
  free_credits: number;
  plan?: string;
  expires_at?: string;
}

/**
 * Bulk verification status
 */
export interface BulkStatus {
  file_id: string;
  status: 'processing' | 'completed' | 'failed' | 'queued';
  progress?: number;
  total?: number;
  processed?: number;
  valid?: number;
  invalid?: number;
  unknown?: number;
  error?: string;
  created_at?: string;
  completed_at?: string;
}

/**
 * Job information for bulk verification
 */
export interface JobInfo {
  file_id: string;
  input_file: string;
  output_file: string;
  start_time: string;
  end_time?: string;
  status: string;
  final_status?: BulkStatus;
  last_status?: BulkStatus;
}

/**
 * Options for waiting for bulk completion
 */
export interface WaitOptions {
  /** Seconds between status checks (default: 10) */
  checkInterval?: number;
  /** Maximum seconds to wait (default: 3600) */
  maxWait?: number;
  /** Callback function for progress updates */
  onProgress?: (status: BulkStatus) => void;
}

/**
 * Request options for internal use
 */
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params?: Record<string, any>;
  data?: any;
  formData?: FormData;
}

/**
 * Main client for EmailListVerify API
 */
export class EmailListVerifyClient {
  private static readonly BASE_URL = 'https://apps.emaillistverify.com/api';
  private static readonly VERSION = '1.0.0';

  private readonly apiKey: string;
  private readonly timeout: number;
  private readonly client: AxiosInstance;

  /**
   * Initialize EmailListVerify client
   * @param apiKey - Your EmailListVerify API key
   * @param options - Additional configuration options
   * @throws {EmailListVerifyException} If API key is not provided
   */
  constructor(apiKey: string, options: EmailListVerifyOptions = {}) {
    if (!apiKey) {
      throw new EmailListVerifyException('API key is required');
    }

    this.apiKey = apiKey;
    this.timeout = options.timeout || 30000;

    // Configure axios instance
    this.client = axios.create({
      baseURL: options.baseURL || EmailListVerifyClient.BASE_URL,
      timeout: this.timeout,
      headers: {
        'User-Agent': `EmailListVerify-TS-SDK/${EmailListVerifyClient.VERSION}`
      }
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      this.handleAxiosError.bind(this)
    );
  }

  /**
   * Handle axios errors
   * @private
   */
  private handleAxiosError(error: AxiosError): Promise<never> {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      throw new EmailListVerifyException(
        `API error ${status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`
      );
    } else if (error.request) {
      throw new EmailListVerifyException(`Request failed: ${error.message}`);
    } else {
      throw new EmailListVerifyException(`Error: ${error.message}`);
    }
  }

  /**
   * Make HTTP request to API
   * @private
   */
  private async makeRequest<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { method = 'GET', params = {}, data = null, formData = null } = options;

    // Add API key to params
    params.secret = this.apiKey;

    const config: AxiosRequestConfig = {
      method,
      url: endpoint,
      params
    };

    if (formData) {
      config.data = formData;
      config.headers = {
        ...config.headers,
        ...formData.getHeaders()
      };
    } else if (data) {
      config.data = data;
    }

    const response = await this.client.request<T>(config);
    return response.data;
  }

  /**
   * Verify a single email address
   * @param email - Email address to verify
   * @returns Verification result
   * @throws {EmailListVerifyException} If email is not provided or API error occurs
   */
  async verifyEmail(email: string): Promise<VerificationResult> {
    if (!email) {
      throw new EmailListVerifyException('Email address is required');
    }

    const result = await this.makeRequest<string | VerificationResult>('verifyEmail', {
      params: { email }
    });

    // Parse response
    if (typeof result === 'string') {
      return {
        email,
        status: result.trim() as VerificationStatus,
        timestamp: new Date().toISOString()
      };
    }

    return result;
  }

  /**
   * Verify email with detailed information
   * @param email - Email address to verify
   * @returns Detailed verification result
   * @throws {EmailListVerifyException} If email is not provided or API error occurs
   */
  async verifyEmailDetailed(email: string): Promise<DetailedVerificationResult> {
    if (!email) {
      throw new EmailListVerifyException('Email address is required');
    }

    return await this.makeRequest<DetailedVerificationResult>('verifyEmailDetailed', {
      params: { email }
    });
  }

  /**
   * Get account credits information
   * @returns Account credits info
   * @throws {EmailListVerifyException} On API error
   */
  async getCredits(): Promise<CreditsInfo> {
    return await this.makeRequest<CreditsInfo>('getCredits');
  }

  /**
   * Upload file for bulk verification
   * @param filePath - Path to CSV file with emails
   * @param filename - Optional custom filename
   * @returns File ID for tracking
   * @throws {EmailListVerifyException} If file not found or API error occurs
   */
  async bulkUpload(filePath: string, filename?: string): Promise<string> {
    if (!fs.existsSync(filePath)) {
      throw new EmailListVerifyException(`File not found: ${filePath}`);
    }

    if (!filename) {
      const now = new Date();
      filename = `bulk_verify_${this.formatDate(now)}.csv`;
    }

    const formData = new FormData();
    formData.append('file_contents', fs.createReadStream(filePath), {
      filename,
      contentType: 'text/csv'
    });

    const result = await this.makeRequest<string | { file_id: string }>('verifApiFile', {
      method: 'POST',
      params: { filename },
      formData
    });

    if (typeof result === 'string') {
      return result.trim();
    } else if (result && result.file_id) {
      return result.file_id;
    }

    throw new EmailListVerifyException('Failed to get file ID from response');
  }

  /**
   * Format date for filename
   * @private
   */
  private formatDate(date: Date): string {
    return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}_${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}${String(date.getSeconds()).padStart(2, '0')}`;
  }

  /**
   * Get bulk verification status
   * @param fileId - File ID from bulk_upload
   * @returns Verification status and progress
   * @throws {EmailListVerifyException} If file ID not provided or API error occurs
   */
  async getBulkStatus(fileId: string): Promise<BulkStatus> {
    if (!fileId) {
      throw new EmailListVerifyException('File ID is required');
    }

    return await this.makeRequest<BulkStatus>('getApiFileInfo', {
      params: { file_id: fileId }
    });
  }

  /**
   * Download bulk verification results
   * @param fileId - File ID from bulk_upload
   * @param resultType - 'all' or 'clean' (default: 'all')
   * @returns CSV content with results
   * @throws {EmailListVerifyException} If parameters invalid or API error occurs
   */
  async downloadBulkResult(fileId: string, resultType: 'all' | 'clean' = 'all'): Promise<string> {
    if (!fileId) {
      throw new EmailListVerifyException('File ID is required');
    }

    if (!['all', 'clean'].includes(resultType)) {
      throw new EmailListVerifyException("result_type must be 'all' or 'clean'");
    }

    const endpoint = resultType === 'all' ? 'downloadApiFile' : 'downloadCleanFile';
    return await this.makeRequest<string>(endpoint, {
      params: { file_id: fileId }
    });
  }

  /**
   * Verify multiple emails in batches
   * @param emails - List of email addresses
   * @param maxBatchSize - Maximum emails per batch (default: 100)
   * @returns List of verification results
   */
  async verifyBatch(emails: string[], maxBatchSize: number = 100): Promise<VerificationResult[]> {
    const results: VerificationResult[] = [];

    for (let i = 0; i < emails.length; i += maxBatchSize) {
      const batch = emails.slice(i, i + maxBatchSize);

      for (const email of batch) {
        try {
          const result = await this.verifyEmail(email);
          results.push(result);

          // Rate limiting
          await this.delay(100);
        } catch (error) {
          results.push({
            email,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    return results;
  }

  /**
   * Wait for bulk verification to complete
   * @param fileId - File ID from bulk_upload
   * @param options - Waiting options
   * @returns Final status when completed
   * @throws {EmailListVerifyException} On timeout or failure
   */
  async waitForBulkCompletion(fileId: string, options: WaitOptions = {}): Promise<BulkStatus> {
    const { checkInterval = 10, maxWait = 3600, onProgress } = options;
    const startTime = Date.now();

    while ((Date.now() - startTime) / 1000 < maxWait) {
      const status = await this.getBulkStatus(fileId);

      if (onProgress) {
        onProgress(status);
      }

      if (status.status === 'completed') {
        return status;
      } else if (status.status === 'failed') {
        throw new EmailListVerifyException(
          `Bulk verification failed: ${status.error || 'Unknown error'}`
        );
      }

      await this.delay(checkInterval * 1000);
    }

    throw new EmailListVerifyException(
      `Timeout waiting for bulk verification (waited ${maxWait}s)`
    );
  }

  /**
   * Utility method for delays
   * @private
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Helper class for email validation utilities
 */
export class EmailValidator {
  private static readonly EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  private static readonly DISPOSABLE_DOMAINS = new Set([
    'tempmail.com',
    'throwaway.email',
    'guerrillamail.com',
    'mailinator.com',
    '10minutemail.com',
    'trashmail.com',
    'yopmail.com',
    'temp-mail.org',
    'fakeinbox.com',
    'dispostable.com',
    'mailnator.com',
    'temporarymail.net'
  ]);

  /**
   * Check if email has valid syntax
   * @param email - Email address to check
   * @returns True if syntax is valid
   */
  static isValidSyntax(email: string): boolean {
    return this.EMAIL_REGEX.test(email);
  }

  /**
   * Extract domain from email address
   * @param email - Email address
   * @returns Domain part or null
   */
  static extractDomain(email: string): string | null {
    if (email.includes('@')) {
      return email.split('@')[1].toLowerCase();
    }
    return null;
  }

  /**
   * Extract username from email address
   * @param email - Email address
   * @returns Username part or null
   */
  static extractUsername(email: string): string | null {
    if (email.includes('@')) {
      return email.split('@')[0];
    }
    return null;
  }

  /**
   * Check if domain is in common disposable email domains list
   * @param domain - Domain to check
   * @returns True if domain appears to be disposable
   */
  static isDisposableDomain(domain: string): boolean {
    return this.DISPOSABLE_DOMAINS.has(domain.toLowerCase());
  }

  /**
   * Check if email appears to be a role account
   * @param email - Email address to check
   * @returns True if email appears to be a role account
   */
  static isRoleEmail(email: string): boolean {
    const roleNames = [
      'admin', 'info', 'contact', 'support', 'sales',
      'help', 'office', 'mail', 'team', 'billing',
      'legal', 'noreply', 'no-reply', 'postmaster',
      'webmaster', 'abuse', 'security'
    ];

    const username = this.extractUsername(email);
    if (!username) return false;

    return roleNames.includes(username.toLowerCase());
  }

  /**
   * Normalize email address
   * @param email - Email address to normalize
   * @returns Normalized email address
   */
  static normalize(email: string): string {
    return email.toLowerCase().trim();
  }
}

/**
 * Manager for handling bulk email verification workflows
 */
export class BulkVerificationManager {
  private client: EmailListVerifyClient;
  private activeJobs: Map<string, JobInfo>;

  /**
   * Initialize bulk verification manager
   * @param client - EmailListVerifyClient instance
   */
  constructor(client: EmailListVerifyClient) {
    this.client = client;
    this.activeJobs = new Map();
  }

  /**
   * Process CSV file with email verification
   * @param inputFile - Path to input CSV file
   * @param outputFile - Path to save results
   * @param waitForCompletion - Whether to wait for completion
   * @param onProgress - Optional progress callback
   * @returns Job information
   */
  async processCsvFile(
    inputFile: string,
    outputFile: string,
    waitForCompletion: boolean = true,
    onProgress?: (status: BulkStatus) => void
  ): Promise<JobInfo> {
    // Upload file
    const fileId = await this.client.bulkUpload(inputFile);

    const jobInfo: JobInfo = {
      file_id: fileId,
      input_file: inputFile,
      output_file: outputFile,
      start_time: new Date().toISOString(),
      status: 'processing'
    };

    this.activeJobs.set(fileId, jobInfo);

    if (waitForCompletion) {
      // Wait for completion with progress callback
      const finalStatus = await this.client.waitForBulkCompletion(fileId, {
        onProgress
      });

      // Download results
      const results = await this.client.downloadBulkResult(fileId, 'all');

      // Save to output file
      await fs.promises.writeFile(outputFile, results);

      jobInfo.status = 'completed';
      jobInfo.end_time = new Date().toISOString();
      jobInfo.final_status = finalStatus;

      this.activeJobs.set(fileId, jobInfo);
    }

    return jobInfo;
  }

  /**
   * Get status of a verification job
   * @param fileId - File ID to check
   * @returns Job status information
   * @throws {EmailListVerifyException} If job ID not found
   */
  async getJobStatus(fileId: string): Promise<JobInfo> {
    if (!this.activeJobs.has(fileId)) {
      throw new EmailListVerifyException(`Unknown job ID: ${fileId}`);
    }

    const status = await this.client.getBulkStatus(fileId);
    const jobInfo = this.activeJobs.get(fileId)!;
    jobInfo.last_status = status;

    if (status.status === 'completed' && jobInfo.status !== 'completed') {
      jobInfo.status = 'completed';
      jobInfo.end_time = new Date().toISOString();
      jobInfo.final_status = status;
    }

    return jobInfo;
  }

  /**
   * Get all active jobs
   * @returns Map of all active jobs
   */
  getActiveJobs(): Map<string, JobInfo> {
    return new Map(this.activeJobs);
  }

  /**
   * Clear completed jobs from memory
   * @returns Number of jobs cleared
   */
  clearCompletedJobs(): number {
    let cleared = 0;
    for (const [fileId, job] of this.activeJobs.entries()) {
      if (job.status === 'completed') {
        this.activeJobs.delete(fileId);
        cleared++;
      }
    }
    return cleared;
  }

  /**
   * Cancel a job (remove from tracking)
   * @param fileId - File ID to cancel
   * @returns True if job was found and removed
   */
  cancelJob(fileId: string): boolean {
    return this.activeJobs.delete(fileId);
  }
}

// Export everything as default as well for convenience
export default {
  EmailListVerifyClient,
  EmailValidator,
  BulkVerificationManager,
  EmailListVerifyException
};
