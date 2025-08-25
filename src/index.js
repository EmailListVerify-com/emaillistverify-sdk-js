/**
 * EmailListVerify JavaScript SDK
 * JavaScript/Node.js wrapper for EmailListVerify REST API
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

class EmailListVerifyException extends Error {
  constructor(message) {
    super(message);
    this.name = 'EmailListVerifyException';
  }
}

class EmailListVerifyClient {
  static BASE_URL = 'https://apps.emaillistverify.com/api';
  static VERSION = '1.0.0';

  /**
   * Initialize EmailListVerify client
   * @param {string} apiKey - Your EmailListVerify API key
   * @param {Object} options - Additional options
   * @param {number} options.timeout - Request timeout in milliseconds (default: 30000)
   * @throws {EmailListVerifyException}
   */
  constructor(apiKey, options = {}) {
    if (!apiKey) {
      throw new EmailListVerifyException('API key is required');
    }

    this.apiKey = apiKey;
    this.timeout = options.timeout || 30000;

    // Configure axios instance
    this.client = axios.create({
      baseURL: EmailListVerifyClient.BASE_URL,
      timeout: this.timeout,
      headers: {
        'User-Agent': `EmailListVerify-JS-SDK/${EmailListVerifyClient.VERSION}`
      }
    });
  }

  /**
   * Make HTTP request to API
   * @private
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<*>} API response
   * @throws {EmailListVerifyException}
   */
  async _makeRequest(endpoint, options = {}) {
    const { method = 'GET', params = {}, data = null, formData = null } = options;

    // Add API key to params
    params.secret = this.apiKey;

    const config = {
      method,
      url: endpoint,
      params
    };

    if (formData) {
      config.data = formData;
      config.headers = formData.getHeaders();
    } else if (data) {
      config.data = data;
    }

    try {
      const response = await this.client.request(config);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new EmailListVerifyException(
          `API error ${error.response.status}: ${error.response.data}`
        );
      } else if (error.request) {
        throw new EmailListVerifyException(`Request failed: ${error.message}`);
      } else {
        throw new EmailListVerifyException(`Error: ${error.message}`);
      }
    }
  }

  /**
   * Verify a single email address
   * @param {string} email - Email address to verify
   * @returns {Promise<Object>} Verification result
   * @throws {EmailListVerifyException}
   */
  async verifyEmail(email) {
    if (!email) {
      throw new EmailListVerifyException('Email address is required');
    }

    const result = await this._makeRequest('verifyEmail', {
      params: { email }
    });

    // Parse response
    if (typeof result === 'string') {
      return {
        email,
        status: result.trim(),
        timestamp: new Date().toISOString()
      };
    }

    return result;
  }

  /**
   * Verify email with detailed information
   * @param {string} email - Email address to verify
   * @returns {Promise<Object>} Detailed verification result
   * @throws {EmailListVerifyException}
   */
  async verifyEmailDetailed(email) {
    if (!email) {
      throw new EmailListVerifyException('Email address is required');
    }

    return await this._makeRequest('verifyEmailDetailed', {
      params: { email }
    });
  }

  /**
   * Get account credits information
   * @returns {Promise<Object>} Account credits info
   * @throws {EmailListVerifyException}
   */
  async getCredits() {
    return await this._makeRequest('getCredits');
  }

  /**
   * Upload file for bulk verification
   * @param {string} filePath - Path to CSV file with emails
   * @param {string} [filename] - Optional custom filename
   * @returns {Promise<string>} File ID for tracking
   * @throws {EmailListVerifyException}
   */
  async bulkUpload(filePath, filename = null) {
    if (!fs.existsSync(filePath)) {
      throw new EmailListVerifyException(`File not found: ${filePath}`);
    }

    if (!filename) {
      const now = new Date();
      filename = `bulk_verify_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}.csv`;
    }

    const formData = new FormData();
    formData.append('file_contents', fs.createReadStream(filePath), {
      filename,
      contentType: 'text/csv'
    });

    const result = await this._makeRequest('verifApiFile', {
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
   * Get bulk verification status
   * @param {string} fileId - File ID from bulk_upload
   * @returns {Promise<Object>} Verification status and progress
   * @throws {EmailListVerifyException}
   */
  async getBulkStatus(fileId) {
    if (!fileId) {
      throw new EmailListVerifyException('File ID is required');
    }

    return await this._makeRequest('getApiFileInfo', {
      params: { file_id: fileId }
    });
  }

  /**
   * Download bulk verification results
   * @param {string} fileId - File ID from bulk_upload
   * @param {string} [resultType='all'] - 'all' or 'clean'
   * @returns {Promise<string>} CSV content with results
   * @throws {EmailListVerifyException}
   */
  async downloadBulkResult(fileId, resultType = 'all') {
    if (!fileId) {
      throw new EmailListVerifyException('File ID is required');
    }

    if (!['all', 'clean'].includes(resultType)) {
      throw new EmailListVerifyException("result_type must be 'all' or 'clean'");
    }

    const endpoint = resultType === 'all' ? 'downloadApiFile' : 'downloadCleanFile';
    return await this._makeRequest(endpoint, {
      params: { file_id: fileId }
    });
  }

  /**
   * Verify multiple emails in batches
   * @param {string[]} emails - List of email addresses
   * @param {number} [maxBatchSize=100] - Maximum emails per batch
   * @returns {Promise<Object[]>} List of verification results
   */
  async verifyBatch(emails, maxBatchSize = 100) {
    const results = [];

    for (let i = 0; i < emails.length; i += maxBatchSize) {
      const batch = emails.slice(i, i + maxBatchSize);

      for (const email of batch) {
        try {
          const result = await this.verifyEmail(email);
          results.push(result);
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          results.push({
            email,
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    return results;
  }

  /**
   * Wait for bulk verification to complete
   * @param {string} fileId - File ID from bulk_upload
   * @param {Object} options - Waiting options
   * @param {number} options.checkInterval - Seconds between checks (default: 10)
   * @param {number} options.maxWait - Maximum seconds to wait (default: 3600)
   * @returns {Promise<Object>} Final status when completed
   * @throws {EmailListVerifyException}
   */
  async waitForBulkCompletion(fileId, options = {}) {
    const { checkInterval = 10, maxWait = 3600 } = options;
    const startTime = Date.now();

    while ((Date.now() - startTime) / 1000 < maxWait) {
      const status = await this.getBulkStatus(fileId);

      if (status.status === 'completed') {
        return status;
      } else if (status.status === 'failed') {
        throw new EmailListVerifyException(
          `Bulk verification failed: ${status.error || 'Unknown error'}`
        );
      }

      await new Promise(resolve => setTimeout(resolve, checkInterval * 1000));
    }

    throw new EmailListVerifyException(
      `Timeout waiting for bulk verification (waited ${maxWait}s)`
    );
  }
}

/**
 * Helper class for email validation utilities
 */
class EmailValidator {
  /**
   * Check if email has valid syntax
   * @param {string} email - Email address to check
   * @returns {boolean} True if syntax is valid
   */
  static isValidSyntax(email) {
    const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return pattern.test(email);
  }

  /**
   * Extract domain from email address
   * @param {string} email - Email address
   * @returns {string|null} Domain part or null
   */
  static extractDomain(email) {
    if (email.includes('@')) {
      return email.split('@')[1].toLowerCase();
    }
    return null;
  }

  /**
   * Extract username from email address
   * @param {string} email - Email address
   * @returns {string|null} Username part or null
   */
  static extractUsername(email) {
    if (email.includes('@')) {
      return email.split('@')[0];
    }
    return null;
  }

  /**
   * Check if domain is in common disposable email domains list
   * @param {string} domain - Domain to check
   * @returns {boolean} True if domain appears to be disposable
   */
  static isDisposableDomain(domain) {
    const disposableDomains = new Set([
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

    return disposableDomains.has(domain.toLowerCase());
  }

  /**
   * Check if email appears to be a role account
   * @param {string} email - Email address to check
   * @returns {boolean} True if email appears to be a role account
   */
  static isRoleEmail(email) {
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
   * @param {string} email - Email address to normalize
   * @returns {string} Normalized email address
   */
  static normalize(email) {
    return email.toLowerCase().trim();
  }
}

/**
 * Manager for handling bulk email verification workflows
 */
class BulkVerificationManager {
  /**
   * Initialize bulk verification manager
   * @param {EmailListVerifyClient} client - EmailListVerifyClient instance
   */
  constructor(client) {
    this.client = client;
    this.activeJobs = new Map();
  }

  /**
   * Process CSV file with email verification
   * @param {string} inputFile - Path to input CSV file
   * @param {string} outputFile - Path to save results
   * @param {boolean} [waitForCompletion=true] - Whether to wait for completion
   * @returns {Promise<Object>} Job information
   */
  async processCsvFile(inputFile, outputFile, waitForCompletion = true) {
    // Upload file
    const fileId = await this.client.bulkUpload(inputFile);

    const jobInfo = {
      file_id: fileId,
      input_file: inputFile,
      output_file: outputFile,
      start_time: new Date().toISOString(),
      status: 'processing'
    };

    this.activeJobs.set(fileId, jobInfo);

    if (waitForCompletion) {
      // Wait for completion
      const finalStatus = await this.client.waitForBulkCompletion(fileId);

      // Download results
      const results = await this.client.downloadBulkResult(fileId, 'all');

      // Save to output file
      fs.writeFileSync(outputFile, results);

      jobInfo.status = 'completed';
      jobInfo.end_time = new Date().toISOString();
      jobInfo.final_status = finalStatus;

      this.activeJobs.set(fileId, jobInfo);
    }

    return jobInfo;
  }

  /**
   * Get status of a verification job
   * @param {string} fileId - File ID to check
   * @returns {Promise<Object>} Job status information
   * @throws {EmailListVerifyException}
   */
  async getJobStatus(fileId) {
    if (!this.activeJobs.has(fileId)) {
      throw new EmailListVerifyException(`Unknown job ID: ${fileId}`);
    }

    const status = await this.client.getBulkStatus(fileId);
    const jobInfo = this.activeJobs.get(fileId);
    jobInfo.last_status = status;

    return jobInfo;
  }

  /**
   * Get all active jobs
   * @returns {Map} All active jobs
   */
  getActiveJobs() {
    return this.activeJobs;
  }
}

module.exports = {
  EmailListVerifyClient,
  EmailValidator,
  BulkVerificationManager,
  EmailListVerifyException
};