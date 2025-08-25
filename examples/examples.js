/**
 * EmailListVerify JavaScript SDK Examples
 */

const {
  EmailListVerifyClient,
  EmailValidator,
  BulkVerificationManager,
  EmailListVerifyException
} = require('../src/index');
const fs = require('fs').promises;

/**
 * Example: Verify a single email address
 */
async function exampleSingleVerification() {
  // Initialize client with your API key
  const client = new EmailListVerifyClient('YOUR_API_KEY_HERE');

  try {
    // Verify single email
    const result = await client.verifyEmail('test@example.com');
    console.log('Email:', result.email);
    console.log('Status:', result.status);
    console.log('Timestamp:', result.timestamp);

    // Verify with detailed information
    const detailedResult = await client.verifyEmailDetailed('test@example.com');
    console.log('Detailed result:', JSON.stringify(detailedResult, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

/**
 * Example: Verify multiple emails in batch
 */
async function exampleBatchVerification() {
  const client = new EmailListVerifyClient('YOUR_API_KEY_HERE');

  // List of emails to verify
  const emails = [
    'valid@example.com',
    'invalid@fake-domain-123456.com',
    'test@gmail.com',
    'info@company.com'
  ];

  try {
    // Verify batch
    const results = await client.verifyBatch(emails, 50);

    // Process results
    for (const result of results) {
      const status = result.status || 'unknown';
      const email = result.email || '';
      console.log(`${email}: ${status}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

/**
 * Example: Bulk verify emails from CSV file
 */
async function exampleBulkFileVerification() {
  const client = new EmailListVerifyClient('YOUR_API_KEY_HERE');
  const manager = new BulkVerificationManager(client);

  try {
    // Process CSV file
    const jobInfo = await manager.processCsvFile(
      'emails.csv',
      'verified_emails.csv',
      true // Wait for completion
    );

    console.log('Job completed:', jobInfo.file_id);
    console.log('Results saved to:', jobInfo.output_file);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

/**
 * Example: Start bulk verification without waiting
 */
async function exampleAsyncBulkVerification() {
  const client = new EmailListVerifyClient('YOUR_API_KEY_HERE');

  try {
    // Upload file for verification
    const fileId = await client.bulkUpload('emails.csv', 'my_email_list.csv');
    console.log('File uploaded with ID:', fileId);

    // Check status periodically
    let status;
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
        break;
      }

      // Wait 10 seconds before next check
      await new Promise(resolve => setTimeout(resolve, 10000));
    } while (status.status !== 'completed' && status.status !== 'failed');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

/**
 * Example: Use validation utilities
 */
function exampleEmailValidation() {
  const emails = [
    'valid@example.com',
    'invalid-email',
    'test@tempmail.com',
    'user@gmail.com'
  ];

  for (const email of emails) {
    console.log(`\nEmail: ${email}`);
    console.log(`Valid syntax: ${EmailValidator.isValidSyntax(email)}`);

    const domain = EmailValidator.extractDomain(email);
    if (domain) {
      console.log(`Domain: ${domain}`);
      console.log(`Disposable: ${EmailValidator.isDisposableDomain(domain)}`);
    }
  }
}

/**
 * Example: Check account credits
 */
async function exampleGetCredits() {
  const client = new EmailListVerifyClient('YOUR_API_KEY_HERE');

  try {
    const credits = await client.getCredits();
    console.log('Available credits:', credits.credits || 0);
    console.log('Used credits:', credits.used_credits || 0);
    console.log('Free credits:', credits.free_credits || 0);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

/**
 * Example: Handle API errors properly
 */
async function exampleErrorHandling() {
  const client = new EmailListVerifyClient('YOUR_API_KEY_HERE');

  try {
    // Attempt to verify email
    const result = await client.verifyEmail('test@example.com');

    if (result.status === 'ok') {
      console.log('Email is valid!');
    } else if (result.status === 'failed') {
      console.log('Email verification failed');
    } else {
      console.log('Unknown status:', result.status);
    }
  } catch (error) {
    if (error instanceof EmailListVerifyException) {
      console.error('API Error:', error.message);
    } else {
      console.error('Unexpected error:', error.message);
    }
  }
}

/**
 * Example: Process emails with custom logic
 */
async function exampleCustomProcessing() {
  const client = new EmailListVerifyClient('YOUR_API_KEY_HERE');

  try {
    // Read emails from file
    const emailsContent = await fs.readFile('email_list.txt', 'utf-8');
    const emails = emailsContent.split('\n').filter(e => e.trim());

    const validEmails = [];
    const invalidEmails = [];
    const unknownEmails = [];

    for (const email of emails) {
      try {
        const result = await client.verifyEmail(email);

        switch (result.status) {
          case 'ok':
            validEmails.push(email);
            break;
          case 'failed':
            invalidEmails.push(email);
            break;
          default:
            unknownEmails.push(email);
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error verifying ${email}:`, error.message);
        unknownEmails.push(email);
      }
    }

    // Save results to separate files
    await fs.writeFile('valid_emails.txt', validEmails.join('\n'));
    await fs.writeFile('invalid_emails.txt', invalidEmails.join('\n'));
    await fs.writeFile('unknown_emails.txt', unknownEmails.join('\n'));

    console.log('Processing complete!');
    console.log('Valid:', validEmails.length);
    console.log('Invalid:', invalidEmails.length);
    console.log('Unknown:', unknownEmails.length);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

/**
 * Example: Stream processing for large files
 */
async function exampleStreamProcessing() {
  const client = new EmailListVerifyClient('YOUR_API_KEY_HERE');
  const readline = require('readline');
  const fs = require('fs');

  const fileStream = fs.createReadStream('large_email_list.txt');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const outputStream = fs.createWriteStream('verification_results.csv');
  outputStream.write('email,status,timestamp\n');

  for await (const line of rl) {
    const email = line.trim();
    if (email) {
      try {
        const result = await client.verifyEmail(email);
        outputStream.write(`${result.email},${result.status},${result.timestamp}\n`);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        outputStream.write(`${email},error,${new Date().toISOString()}\n`);
      }
    }
  }

  outputStream.end();
  console.log('Stream processing complete!');
}

// Main function to run examples
async function main() {
  console.log('EmailListVerify JavaScript SDK Examples');
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
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  exampleSingleVerification,
  exampleBatchVerification,
  exampleBulkFileVerification,
  exampleAsyncBulkVerification,
  exampleEmailValidation,
  exampleGetCredits,
  exampleErrorHandling,
  exampleCustomProcessing,
  exampleStreamProcessing
};