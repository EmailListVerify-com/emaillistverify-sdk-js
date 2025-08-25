/**
 * EmailListVerify TypeScript SDK Examples
 */

import {
  EmailListVerifyClient,
  EmailValidator,
  BulkVerificationManager,
  EmailListVerifyException,
  VerificationResult,
  DetailedVerificationResult,
  BulkStatus
} from '../src/index';
import * as fs from 'fs/promises';
import * as readline from 'readline';
import { createReadStream, createWriteStream } from 'fs';

/**
 * Example: Verify a single email address
 */
async function exampleSingleVerification(): Promise<void> {
  // Initialize client with your API key
  const client = new EmailListVerifyClient('YOUR_API_KEY_HERE');

  try {
    // Verify single email
    const result: VerificationResult = await client.verifyEmail('test@example.com');
    console.log('Email:', result.email);
    console.log('Status:', result.status);
    console.log('Timestamp:', result.timestamp);

    // Verify with detailed information
    const detailedResult: DetailedVerificationResult = await client.verifyEmailDetailed('test@example.com');
    console.log('Detailed result:', JSON.stringify(detailedResult, null, 2));

    // Access detailed fields
    if (detailedResult.disposable) {
      console.log('Warning: This is a disposable email address');
    }
    if (detailedResult.role) {
      console.log('This appears to be a role-based email');
    }
  } catch (error) {
    if (error instanceof EmailListVerifyException) {
      console.error('API Error:', error.message);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

/**
 * Example: Verify multiple emails in batch
 */
async function exampleBatchVerification(): Promise<void> {
  const client = new EmailListVerifyClient('YOUR_API_KEY_HERE');

  // List of emails to verify
  const emails: string[] = [
    'valid@example.com',
    'invalid@fake-domain-123456.com',
    'test@gmail.com',
    'info@company.com'
  ];

  try {
    // Verify batch
    const results: VerificationResult[] = await client.verifyBatch(emails, 50);

    // Process results with type safety
    results.forEach((result) => {
      console.log(`${result.email}: ${result.status}`);
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
    });

    // Filter results by status
    const validEmails = results.filter(r => r.status === 'ok');
    const invalidEmails = results.filter(r => r.status === 'failed');
    const errorEmails = results.filter(r => r.status === 'error');

    console.log(`\nSummary:`);
    console.log(`Valid: ${validEmails.length}`);
    console.log(`Invalid: ${invalidEmails.length}`);
    console.log(`Errors: ${errorEmails.length}`);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
  }
}

/**
 * Example: Bulk verify emails from CSV file with progress tracking
 */
async function exampleBulkFileVerification(): Promise<void> {
  const client = new EmailListVerifyClient('YOUR_API_KEY_HERE');
  const manager = new BulkVerificationManager(client);

  try {
    // Process CSV file with progress callback
    const jobInfo = await manager.processCsvFile(
      'emails.csv',
      'verified_emails.csv',
      true, // Wait for completion
      (status: BulkStatus) => {
        // Progress callback
        console.log(`Progress: ${status.progress || 0}%`);
        console.log(`Processed: ${status.processed || 0}/${status.total || 0}`);
      }
    );

    console.log('Job completed:', jobInfo.file_id);
    console.log('Started:', jobInfo.start_time);
    console.log('Completed:', jobInfo.end_time);
    console.log('Results saved to:', jobInfo.output_file);

    // Display final statistics
    if (jobInfo.final_status) {
      console.log('\nFinal Statistics:');
      console.log(`Valid: ${jobInfo.final_status.valid || 0}`);
      console.log(`Invalid: ${jobInfo.final_status.invalid || 0}`);
      console.log(`Unknown: ${jobInfo.final_status.unknown || 0}`);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
  }
}

/**
 * Example: Start bulk verification without waiting (async processing)
 */
async function exampleAsyncBulkVerification(): Promise<void> {
  const client = new EmailListVerifyClient('YOUR_API_KEY_HERE');

  try {
    // Upload file for verification
    const fileId: string = await client.bulkUpload('emails.csv', 'my_email_list.csv');
    console.log('File uploaded with ID:', fileId);

    // Check status periodically
    let status: BulkStatus;
    do {
      status = await client.getBulkStatus(fileId);
      console.log('Status:', status.status);
      console.log('Progress:', `${status.progress || 0}%`);

      if (status.status === 'completed') {
        // Download results
        const allResults = await client.downloadBulkResult(fileId, 'all');
        const cleanResults = await client.downloadBulkResult(fileId, 'clean');

        // Save results
        await fs.writeFile('all_results.csv', allResults);
        await fs.writeFile('clean_results.csv', cleanResults);

        console.log('Results downloaded successfully!');
        console.log(`Total processed: ${status.total}`);
        console.log(`Valid: ${status.valid}`);
        console.log(`Invalid: ${status.invalid}`);
        break;
      }

      // Wait 10 seconds before next check
      await new Promise(resolve => setTimeout(resolve, 10000));
    } while (status.status === 'queued' || status.status === 'processing');
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
  }
}

/**
 * Example: Use validation utilities with TypeScript
 */
function exampleEmailValidation(): void {
  const emails: string[] = [
    'valid@example.com',
    'invalid-email',
    'test@tempmail.com',
    'user@gmail.com',
    'admin@company.com',
    'support@business.org'
  ];

  emails.forEach((email) => {
    console.log(`\nEmail: ${email}`);
    console.log(`Valid syntax: ${EmailValidator.isValidSyntax(email)}`);

    const domain: string | null = EmailValidator.extractDomain(email);
    const username: string | null = EmailValidator.extractUsername(email);

    if (domain) {
      console.log(`Domain: ${domain}`);
      console.log(`Disposable: ${EmailValidator.isDisposableDomain(domain)}`);
    }

    if (username) {
      console.log(`Username: ${username}`);
      console.log(`Role email: ${EmailValidator.isRoleEmail(email)}`);
    }

    console.log(`Normalized: ${EmailValidator.normalize(email)}`);
  });
}

/**
 * Example: Check account credits with type safety
 */
async function exampleGetCredits(): Promise<void> {
  const client = new EmailListVerifyClient('YOUR_API_KEY_HERE');

  try {
    const credits = await client.getCredits();
    console.log('Account Credits Information:');
    console.log('Available credits:', credits.credits);
    console.log('Used credits:', credits.used_credits);
    console.log('Free credits:', credits.free_credits);

    if (credits.plan) {
      console.log('Current plan:', credits.plan);
    }

    if (credits.expires_at) {
      console.log('Expires at:', credits.expires_at);
    }

    // Check if low on credits
    if (credits.credits < 100) {
      console.warn('Warning: Low credit balance!');
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
  }
}

/**
 * Example: Handle API errors with proper typing
 */
async function exampleErrorHandling(): Promise<void> {
  const client = new EmailListVerifyClient('YOUR_API_KEY_HERE');

  try {
    // Attempt to verify email
    const result: VerificationResult = await client.verifyEmail('test@example.com');

    switch (result.status) {
      case 'ok':
        console.log('Email is valid!');
        break;
      case 'failed':
        console.log('Email verification failed');
        break;
      case 'unknown':
        console.log('Email status unknown');
        break;
      case 'error':
        console.log('Error during verification:', result.error);
        break;
      default:
        // TypeScript ensures all cases are handled
        const exhaustiveCheck: never = result.status;
        console.log('Unexpected status:', exhaustiveCheck);
    }
  } catch (error) {
    if (error instanceof EmailListVerifyException) {
      console.error('API Error:', error.message);
      // Handle specific API errors
    } else if (error instanceof Error) {
      console.error('Unexpected error:', error.message);
    } else {
      console.error('Unknown error:', error);
    }
  }
}

/**
 * Example: Process emails with custom logic and TypeScript interfaces
 */
interface EmailProcessingResult {
  valid: string[];
  invalid: string[];
  unknown: string[];
  errors: Array<{ email: string; error: string }>;
}

async function exampleCustomProcessing(): Promise<EmailProcessingResult> {
  const client = new EmailListVerifyClient('YOUR_API_KEY_HERE');

  try {
    // Read emails from file
    const emailsContent = await fs.readFile('email_list.txt', 'utf-8');
    const emails: string[] = emailsContent
      .split('\n')
      .map(e => e.trim())
      .filter(e => e.length > 0);

    const result: EmailProcessingResult = {
      valid: [],
      invalid: [],
      unknown: [],
      errors: []
    };

    // Process emails with proper error handling
    for (const email of emails) {
      try {
        const verificationResult = await client.verifyEmail(email);

        switch (verificationResult.status) {
          case 'ok':
            result.valid.push(email);
            break;
          case 'failed':
            result.invalid.push(email);
            break;
          case 'unknown':
            result.unknown.push(email);
            break;
          case 'error':
            result.errors.push({
              email,
              error: verificationResult.error || 'Unknown error'
            });
            break;
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error verifying ${email}:`, errorMessage);
        result.errors.push({ email, error: errorMessage });
      }
    }

    // Save results to separate files
    await fs.writeFile('valid_emails.txt', result.valid.join('\n'));
    await fs.writeFile('invalid_emails.txt', result.invalid.join('\n'));
    await fs.writeFile('unknown_emails.txt', result.unknown.join('\n'));

    if (result.errors.length > 0) {
      const errorLog = result.errors
        .map(e => `${e.email}: ${e.error}`)
        .join('\n');
      await fs.writeFile('error_emails.txt', errorLog);
    }

    console.log('Processing complete!');
    console.log('Valid:', result.valid.length);
    console.log('Invalid:', result.invalid.length);
    console.log('Unknown:', result.unknown.length);
    console.log('Errors:', result.errors.length);

    return result;
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    throw error;
  }
}

/**
 * Example: Stream processing for large files with TypeScript
 */
async function exampleStreamProcessing(): Promise<void> {
  const client = new EmailListVerifyClient('YOUR_API_KEY_HERE');

  const fileStream = createReadStream('large_email_list.txt');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const outputStream = createWriteStream('verification_results.csv');
  outputStream.write('email,status,timestamp\n');

  let processedCount = 0;
  let validCount = 0;
  let invalidCount = 0;

  for await (const line of rl) {
    const email = line.trim();
    if (email) {
      try {
        const result = await client.verifyEmail(email);
        outputStream.write(`${result.email},${result.status},${result.timestamp}\n`);

        processedCount++;
        if (result.status === 'ok') validCount++;
        else if (result.status === 'failed') invalidCount++;

        // Log progress every 100 emails
        if (processedCount % 100 === 0) {
          console.log(`Processed: ${processedCount} (Valid: ${validCount}, Invalid: ${invalidCount})`);
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        outputStream.write(`${email},error,${new Date().toISOString()}\n`);
      }
    }
  }

  outputStream.end();
  console.log('\nStream processing complete!');
  console.log(`Total processed: ${processedCount}`);
  console.log(`Valid: ${validCount}`);
  console.log(`Invalid: ${invalidCount}`);
}

/**
 * Example: Manage multiple bulk jobs with TypeScript
 */
async function exampleMultipleJobs(): Promise<void> {
  const client = new EmailListVerifyClient('YOUR_API_KEY_HERE');
  const manager = new BulkVerificationManager(client);

  try {
    // Start multiple jobs
    const jobs = await Promise.all([
      manager.processCsvFile('emails1.csv', 'results1.csv', false),
      manager.processCsvFile('emails2.csv', 'results2.csv', false),
      manager.processCsvFile('emails3.csv', 'results3.csv', false)
    ]);

    console.log('Started', jobs.length, 'jobs');

    // Monitor all jobs
    let allCompleted = false;
    while (!allCompleted) {
      allCompleted = true;

      for (const job of jobs) {
        const status = await manager.getJobStatus(job.file_id);
        console.log(`Job ${job.file_id}: ${status.status}`);

        if (status.status !== 'completed') {
          allCompleted = false;
        }
      }

      if (!allCompleted) {
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    console.log('All jobs completed!');

    // Clear completed jobs from memory
    const cleared = manager.clearCompletedJobs();
    console.log(`Cleared ${cleared} completed jobs from memory`);

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
  }
}

// Main function to run examples
async function main(): Promise<void> {
  console.log('EmailListVerify TypeScript SDK Examples');
  console.log('========================================');

  // Uncomment to run examples (remember to set your API key first):
  // await exampleSingleVerification();
  // await exampleBatchVerification();
  // await exampleBulkFileVerification();
  // exampleEmailValidation();
  // await exampleGetCredits();
  // await exampleErrorHandling();
  // await exampleCustomProcessing();
  // await exampleStreamProcessing();
  // await exampleMultipleJobs();
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

// Export examples for testing
export {
  exampleSingleVerification,
  exampleBatchVerification,
  exampleBulkFileVerification,
  exampleAsyncBulkVerification,
  exampleEmailValidation,
  exampleGetCredits,
  exampleErrorHandling,
  exampleCustomProcessing,
  exampleStreamProcessing,
  exampleMultipleJobs
};
