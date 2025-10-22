/**
 * Bulk Email Verification Example - EmailListVerify SDK
 *
 * This example demonstrates how to upload a CSV file for bulk verification,
 * check processing progress, download results, and clean up.
 */

import { EmailListVerifyClient } from 'emaillistverify-sdk-js';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const client = new EmailListVerifyClient(process.env.EMAILLISTVERIFY_API_KEY);

async function runBulkVerificationExample() {
  let fileId;

  try {
    // 1. Prepare CSV file (or read existing one)
    console.log('\n1. Preparing CSV File');
    console.log('================================');
    const csvContent = `email
john.doe@example.com
jane.smith@company.com
test@tempmail.com
invalid-email-format
support@business.org`;

    const csvPath = resolve('./emails-to-verify.csv');
    writeFileSync(csvPath, csvContent);
    console.log('CSV file created:', csvPath);
    console.log('Total emails:', csvContent.split('\n').length - 1);

    // 2. Upload CSV file for bulk verification
    console.log('\n2. Uploading CSV File');
    console.log('================================');
    const fileBuffer = readFileSync(csvPath);
    const uploadResult = await client.uploadBulkFile(fileBuffer, 'emails-to-verify.csv');

    fileId = uploadResult.fileId;
    console.log('File ID:', uploadResult.fileId);
    console.log('Status:', uploadResult.status);
    console.log('File name:', uploadResult.fileName);

    // 3. Check processing progress
    console.log('\n3. Checking Processing Progress');
    console.log('================================');
    let progress = await client.getBulkProgress(fileId);
    console.log('Status:', progress.status);
    console.log('Progress:', progress.progress + '%');
    console.log('Total emails:', progress.total);
    console.log('Processed:', progress.processed);
    console.log('Unique emails:', progress.unique);

    // 4. Wait for processing to complete (polling)
    console.log('\n4. Waiting for Processing to Complete');
    console.log('================================');
    progress = await pollBulkUntilComplete(fileId, {
      maxWaitMs: 300000, // 5 minutes
      pollIntervalMs: 5000, // 5 seconds
    });

    console.log('✅ Processing completed!');
    console.log('Total processed:', progress.processed);
    console.log('Unique emails:', progress.unique);

    // 5. Download results
    console.log('\n5. Downloading Results');
    console.log('================================');
    const resultsBlob = await client.downloadBulkResults(fileId);
    console.log('Results downloaded, size:', resultsBlob.size, 'bytes');

    // Save results to file
    const resultsPath = resolve('./verification-results.csv');
    const resultsBuffer = Buffer.from(await resultsBlob.arrayBuffer());
    writeFileSync(resultsPath, resultsBuffer);
    console.log('Results saved to:', resultsPath);

    // 6. Download results with duplicates (optional)
    console.log('\n6. Downloading Results with Duplicates');
    console.log('================================');
    const resultsWithDuplicates = await client.downloadBulkResults(fileId, {
      addDuplicates: true,
    });
    const duplicatesPath = resolve('./verification-results-with-duplicates.csv');
    const duplicatesBuffer = Buffer.from(await resultsWithDuplicates.arrayBuffer());
    writeFileSync(duplicatesPath, duplicatesBuffer);
    console.log('Results with duplicates saved to:', duplicatesPath);

    // 7. Clean up - delete the bulk list
    console.log('\n7. Cleaning Up');
    console.log('================================');
    await client.deleteBulkList(fileId);
    console.log('✅ Bulk list deleted successfully');

    console.log('\n✅ Bulk verification example completed!');
  } catch (error) {
    console.error('\n❌ Error:', error.message);

    if (error.code === 'INVALID_FILE') {
      console.error('Invalid file format. Please ensure your CSV has an "email" column.');
    } else if (error.code === 'MAILLIST_NOT_FINISHED') {
      console.error('Cannot download results - processing not finished yet.');
    } else if (error.code === 'INSUFFICIENT_CREDITS') {
      console.error('Not enough credits to process this bulk verification.');
    }

    // Cleanup on error
    if (fileId) {
      try {
        await client.deleteBulkList(fileId);
        console.log('Cleaned up bulk list after error');
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }
  }
}

/**
 * Poll bulk processing until complete
 * @param {string} fileId - File ID to poll
 * @param {Object} options - Polling options
 * @returns {Promise<Object>} - Completed progress object
 */
async function pollBulkUntilComplete(fileId, options = {}) {
  const { maxWaitMs = 600000, pollIntervalMs = 5000 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const progress = await client.getBulkProgress(fileId);

    console.log(`📊 Progress: ${progress.progress}% (${progress.processed}/${progress.total}) - ${progress.status}`);

    if (progress.status === 'finished') {
      return progress;
    }

    if (progress.status === 'error' || progress.status === 'failed') {
      throw new Error(`Bulk processing failed with status: ${progress.status}`);
    }

    await sleep(pollIntervalMs);
  }

  throw new Error(`Bulk processing timeout after ${maxWaitMs}ms`);
}

/**
 * Sleep helper function
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the example
runBulkVerificationExample();
