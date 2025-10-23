/**
 * Async Email Jobs Example - EmailListVerify SDK
 *
 * This example demonstrates how to create and check async email verification jobs.
 * Async jobs are useful when you want to verify emails without waiting for immediate results.
 */

import { EmailListVerifyClient } from 'emaillistverify-sdk-js';

const client = new EmailListVerifyClient(process.env.EMAILLISTVERIFY_API_KEY);

async function runAsyncJobExamples() {
  try {
    // 1. Create a standard quality async job
    console.log('\n1. Creating Standard Quality Job');
    console.log('================================');
    const standardJob = await client.createEmailJob({
      email: 'test@example.com',
      quality: 'standard',
    });
    console.log('Job ID:', standardJob.id);
    console.log('Status:', standardJob.status);
    console.log('Created at:', standardJob.createdAt);

    // 2. Create a high quality async job (more thorough)
    console.log('\n2. Creating High Quality Job');
    console.log('================================');
    const highJob = await client.createEmailJob({
      email: 'premium@company.com',
      quality: 'high',
    });
    console.log('Job ID:', highJob.id);
    console.log('Status:', highJob.status);
    console.log('Created at:', highJob.createdAt);

    // 3. Check job status (polling example)
    console.log('\n3. Checking Job Status');
    console.log('================================');

    // Wait a moment for processing
    await sleep(2000);

    const jobStatus = await client.getEmailJob(standardJob.id);
    console.log('Job ID:', jobStatus.id);
    console.log('Status:', jobStatus.status); // 'pending', 'processing', 'finished', 'failed'
    console.log('Created at:', jobStatus.createdAt);

    if (jobStatus.status === 'finished') {
      console.log('Finished at:', jobStatus.finishedAt);
      console.log('Result:', jobStatus.result);
    } else {
      console.log('Job still processing...');
    }

    // 4. Polling pattern for job completion
    console.log('\n4. Polling for Job Completion');
    console.log('================================');
    const completedJob = await pollJobUntilComplete(standardJob.id, {
      maxAttempts: 10,
      intervalMs: 2000,
    });

    if (completedJob.status === 'finished') {
      console.log('✅ Job completed!');
      console.log('Email verified:', completedJob.result.email);
      console.log('Result:', completedJob.result.result);
      console.log('Disposable:', completedJob.result.disposable);
      console.log('Role:', completedJob.result.role);
    } else {
      console.log('⚠️  Job not completed:', completedJob.status);
    }

    console.log('\n✅ Async job examples completed!');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 'NOT_FOUND') {
      console.error('Job not found - it may have expired or been deleted');
    }
  }
}

/**
 * Helper function to poll a job until it completes
 * @param {string} jobId - Job ID to poll
 * @param {Object} options - Polling options
 * @returns {Promise<Object>} - Completed job result
 */
async function pollJobUntilComplete(jobId, options = {}) {
  const { maxAttempts = 20, intervalMs = 3000 } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`Polling attempt ${attempt}/${maxAttempts}...`);

    const job = await client.getEmailJob(jobId);

    if (job.status === 'finished' || job.status === 'failed') {
      return job;
    }

    if (attempt < maxAttempts) {
      await sleep(intervalMs);
    }
  }

  throw new Error(`Job ${jobId} did not complete after ${maxAttempts} attempts`);
}

/**
 * Sleep helper function
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the examples
runAsyncJobExamples();
