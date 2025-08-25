/**
 * EmailListVerify SDK TypeScript Definitions
 */

export interface EmailListVerifyOptions {
  timeout?: number;
}

export interface VerificationResult {
  email: string;
  status: 'ok' | 'failed' | 'unknown' | 'error';
  timestamp: string;
  error?: string;
}

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
}

export interface CreditsInfo {
  credits: number;
  used_credits: number;
  free_credits: number;
  plan?: string;
  expires_at?: string;
}

export interface BulkStatus {
  file_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number;
  total?: number;
  processed?: number;
  valid?: number;
  invalid?: number;
  unknown?: number;
  error?: string;
}

export interface JobInfo {
  file_id: string;
  input_file: string;
  output_file: string;
  start_time: string;
  end_time?: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  final_status?: BulkStatus;
  last_status?: BulkStatus;
}

export interface WaitOptions {
  checkInterval?: number;
  maxWait?: number;
}

export declare class EmailListVerifyException extends Error {
  constructor(message: string);
}

export declare class EmailListVerifyClient {
  constructor(apiKey: string, options?: EmailListVerifyOptions);
  
  verifyEmail(email: string): Promise<VerificationResult>;
  verifyEmailDetailed(email: string): Promise<DetailedVerificationResult>;
  getCredits(): Promise<CreditsInfo>;
  bulkUpload(filePath: string, filename?: string): Promise<string>;
  getBulkStatus(fileId: string): Promise<BulkStatus>;
  downloadBulkResult(fileId: string, resultType?: 'all' | 'clean'): Promise<string>;
  verifyBatch(emails: string[], maxBatchSize?: number): Promise<VerificationResult[]>;
  waitForBulkCompletion(fileId: string, options?: WaitOptions): Promise<BulkStatus>;
}

export declare class EmailValidator {
  static isValidSyntax(email: string): boolean;
  static extractDomain(email: string): string | null;
  static extractUsername(email: string): string | null;
  static isDisposableDomain(domain: string): boolean;
  static isRoleEmail(email: string): boolean;
  static normalize(email: string): string;
}

export declare class BulkVerificationManager {
  constructor(client: EmailListVerifyClient);
  
  processCsvFile(inputFile: string, outputFile: string, waitForCompletion?: boolean, progressCallback?: (status: BulkStatus) => void): Promise<JobInfo>;
  getJobStatus(fileId: string): Promise<JobInfo>;
  getActiveJobs(): Map<string, JobInfo>;
  clearCompletedJobs(): number;
}