import axios, { AxiosInstance } from 'axios';

export type EmailVerificationResult = 
  | 'ok'
  | 'invalid'
  | 'invalid_mx'
  | 'accept_all'
  | 'ok_for_all'
  | 'disposable'
  | 'role'
  | 'email_disabled'
  | 'dead_server'
  | 'unknown';

export interface EmailVerificationResponse {
  email: string;
  result: EmailVerificationResult;
  isValid: boolean;
  isDisposable: boolean;
  isRole: boolean;
  isCatchAll: boolean;
}

export interface BulkVerificationResponse {
  results: EmailVerificationResponse[];
  processed: number;
  valid: number;
  invalid: number;
}

export class EmailListVerifyError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'EmailListVerifyError';
  }
}

export class EmailListVerify {
  private apiKey: string;
  private baseUrl: string;
  private client: AxiosInstance;

  constructor(apiKey: string, options?: { baseUrl?: string }) {
    if (!apiKey) {
      throw new EmailListVerifyError('API key is required');
    }

    this.apiKey = apiKey;
    this.baseUrl = options?.baseUrl || 'https://apps.emaillistverify.com/api';
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'User-Agent': 'emaillistverify-sdk-js/1.0.0'
      }
    });
  }

  /**
   * Verify a single email address
   */
  async verifyEmail(email: string): Promise<EmailVerificationResponse> {
    if (!email) {
      throw new EmailListVerifyError('Email is required');
    }

    try {
      const response = await this.client.get('/verifyEmail', {
        params: {
          secret: this.apiKey,
          email: email
        }
      });

      const result = response.data as EmailVerificationResult;
      
      return this.parseResult(email, result);
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new EmailListVerifyError('Invalid API key', 'AUTH_ERROR');
      }
      if (error.response?.status === 429) {
        throw new EmailListVerifyError('Rate limit exceeded', 'RATE_LIMIT');
      }
      throw new EmailListVerifyError(
        `Failed to verify email: ${error.message}`,
        'API_ERROR'
      );
    }
  }

  /**
   * Verify multiple email addresses
   */
  async verifyBulk(emails: string[]): Promise<BulkVerificationResponse> {
    if (!emails || emails.length === 0) {
      throw new EmailListVerifyError('Email list is required');
    }

    const results: EmailVerificationResponse[] = [];
    let valid = 0;
    let invalid = 0;

    // Process emails in parallel with batching
    const batchSize = 10;
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(email => this.verifyEmail(email).catch(_ => ({
          email,
          result: 'unknown' as EmailVerificationResult,
          isValid: false,
          isDisposable: false,
          isRole: false,
          isCatchAll: false
        })))
      );
      
      for (const result of batchResults) {
        results.push(result);
        if (result.isValid) {
          valid++;
        } else {
          invalid++;
        }
      }
    }

    return {
      results,
      processed: emails.length,
      valid,
      invalid
    };
  }

  /**
   * Parse API result into structured response
   */
  private parseResult(email: string, result: EmailVerificationResult): EmailVerificationResponse {
    const isValid = result === 'ok';
    const isDisposable = result === 'disposable';
    const isRole = result === 'role';
    const isCatchAll = result === 'accept_all' || result === 'ok_for_all';

    return {
      email,
      result,
      isValid,
      isDisposable,
      isRole,
      isCatchAll
    };
  }

  /**
   * Get remaining API credits (if available)
   */
  async getCredits(): Promise<number | null> {
    try {
      const response = await this.client.get('/credits', {
        params: {
          secret: this.apiKey
        }
      });
      return response.data.credits || null;
    } catch {
      return null;
    }
  }
}

// Default export
export default EmailListVerify;