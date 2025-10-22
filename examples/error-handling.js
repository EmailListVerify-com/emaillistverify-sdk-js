/**
 * Error Handling Example - EmailListVerify SDK
 *
 * This example demonstrates how to handle different types of errors
 * that can occur when using the SDK.
 */

import { EmailListVerifyClient } from 'emaillistverify-sdk-js';
import {
  isAuthenticationError,
  isInsufficientCreditsError,
  isRateLimitError,
  isNotFoundError,
  isNetworkError,
  isValidationError,
} from 'emaillistverify-sdk-js';

// Initialize client (may use invalid key for demonstration)
const client = new EmailListVerifyClient(process.env.EMAILLISTVERIFY_API_KEY || 'invalid-key');

async function runErrorHandlingExamples() {
  // 1. Handle Authentication Errors (401)
  console.log('\n1. Authentication Error Handling');
  console.log('================================');
  try {
    const invalidClient = new EmailListVerifyClient('invalid-api-key-12345');
    await invalidClient.verifyEmail('test@example.com');
  } catch (error) {
    if (isAuthenticationError(error)) {
      console.log('❌ Authentication failed!');
      console.log('   Error code:', error.code);
      console.log('   Status:', error.statusCode);
      console.log('   Message:', error.message);
      console.log('   👉 Action: Check your API key at https://apps.emaillistverify.com/api');
    }
  }

  // 2. Handle Validation Errors (client-side)
  console.log('\n2. Validation Error Handling');
  console.log('================================');
  try {
    await client.verifyEmail(''); // Empty email
  } catch (error) {
    if (isValidationError(error)) {
      console.log('❌ Validation failed!');
      console.log('   Error code:', error.code);
      console.log('   Message:', error.message);
      console.log('   👉 Action: Provide a valid email address');
    }
  }

  // 3. Handle Insufficient Credits (403)
  console.log('\n3. Insufficient Credits Handling');
  console.log('================================');
  try {
    // This will only trigger if account actually has no credits
    const result = await client.verifyEmail('test@example.com');
    console.log('✅ Email verified:', result.result);
  } catch (error) {
    if (isInsufficientCreditsError(error)) {
      console.log('❌ Insufficient credits!');
      console.log('   Error code:', error.code);
      console.log('   Status:', error.statusCode);
      console.log('   👉 Action: Purchase more credits at https://apps.emaillistverify.com');

      // Check remaining credits
      try {
        const credits = await client.getCredits();
        console.log('   Current balance:');
        console.log('     On-demand:', credits.onDemand.available);
        if (credits.subscription) {
          console.log('     Subscription:', credits.subscription.available);
        }
      } catch (creditsError) {
        console.log('   Could not fetch credit balance');
      }
    }
  }

  // 4. Handle Rate Limiting (429)
  console.log('\n4. Rate Limit Error Handling');
  console.log('================================');
  try {
    // Simulate rapid requests (may trigger rate limit)
    for (let i = 0; i < 3; i++) {
      await client.verifyEmail(`test${i}@example.com`);
    }
    console.log('✅ Requests completed successfully');
  } catch (error) {
    if (isRateLimitError(error)) {
      console.log('❌ Rate limit exceeded!');
      console.log('   Error code:', error.code);
      console.log('   Status:', error.statusCode);
      console.log('   👉 Action: Wait before retrying or implement exponential backoff');

      // Retry with exponential backoff
      await retryWithBackoff(async () => {
        return await client.verifyEmail('test@example.com');
      });
    }
  }

  // 5. Handle Not Found Errors (404)
  console.log('\n5. Not Found Error Handling');
  console.log('================================');
  try {
    await client.getEmailJob('nonexistent-job-id-12345');
  } catch (error) {
    if (isNotFoundError(error)) {
      console.log('❌ Resource not found!');
      console.log('   Error code:', error.code);
      console.log('   Status:', error.statusCode);
      console.log('   Message:', error.message);
      console.log('   👉 Action: Verify the job ID or file ID is correct');
    }
  }

  // 6. Handle Network Errors
  console.log('\n6. Network Error Handling');
  console.log('================================');
  try {
    // Create client with invalid baseUrl to trigger network error
    const offlineClient = new EmailListVerifyClient(process.env.EMAILLISTVERIFY_API_KEY, {
      baseUrl: 'https://invalid-domain-that-does-not-exist-12345.com',
      timeout: 5000,
    });
    await offlineClient.verifyEmail('test@example.com');
  } catch (error) {
    if (isNetworkError(error)) {
      console.log('❌ Network error!');
      console.log('   Error code:', error.code);
      console.log('   Message:', error.message);
      console.log('   👉 Action: Check your internet connection or API endpoint');

      if (error.cause) {
        console.log('   Underlying cause:', error.cause.message);
      }
    }
  }

  // 7. Generic Error Handling Pattern
  console.log('\n7. Generic Error Handling Pattern');
  console.log('================================');
  await handleVerification('test@example.com');

  console.log('\n✅ Error handling examples completed!');
}

/**
 * Generic error handling pattern for email verification
 * @param {string} email - Email to verify
 */
async function handleVerification(email) {
  try {
    const result = await client.verifyEmail(email);
    console.log(`✅ ${email}: ${result.result}`);
    return result;
  } catch (error) {
    console.log(`\n❌ Error verifying ${email}:`);

    // Handle specific error types
    if (isAuthenticationError(error)) {
      console.log('   → Invalid API key');
    } else if (isValidationError(error)) {
      console.log('   → Invalid input:', error.message);
    } else if (isInsufficientCreditsError(error)) {
      console.log('   → No credits remaining');
    } else if (isRateLimitError(error)) {
      console.log('   → Rate limit exceeded, please retry later');
    } else if (isNetworkError(error)) {
      console.log('   → Network connectivity issue');
    } else {
      console.log('   → Unexpected error:', error.message);
    }

    // Always log error code if available
    if (error.code) {
      console.log('   Error code:', error.code);
    }

    throw error; // Re-throw for upstream handling
  }
}

/**
 * Retry with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<any>} - Function result
 */
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`   Retry attempt ${attempt}/${maxRetries}...`);
      return await fn();
    } catch (error) {
      if (attempt === maxRetries || !isRateLimitError(error)) {
        throw error;
      }

      const delayMs = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      console.log(`   Waiting ${delayMs}ms before retry...`);
      await sleep(delayMs);
    }
  }
}

/**
 * Sleep helper
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the examples
runErrorHandlingExamples();
