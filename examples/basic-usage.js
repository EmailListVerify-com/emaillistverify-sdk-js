/**
 * Basic Usage Example - EmailListVerify SDK
 *
 * This example demonstrates the most common use cases for the EmailListVerify SDK.
 */

import { EmailListVerifyClient } from 'emaillistverify-sdk-js';

// Initialize the client with your API key
const client = new EmailListVerifyClient(process.env.EMAILLISTVERIFY_API_KEY);

async function runBasicExamples() {
  try {
    // 1. Simple Email Verification
    console.log('\n1. Simple Email Verification');
    console.log('================================');
    const simpleResult = await client.verifyEmail('test@example.com');
    console.log('Result:', simpleResult.result); // 'ok', 'invalid', 'unknown'
    console.log('Disposable:', simpleResult.disposable);
    console.log('Free provider:', simpleResult.free);
    console.log('Did you mean:', simpleResult.didYouMean || 'N/A');

    // 2. Detailed Email Verification (includes SMTP check)
    console.log('\n2. Detailed Email Verification');
    console.log('================================');
    const detailedResult = await client.verifyEmailDetailed('john.doe@company.com');
    console.log('Result:', detailedResult.result);
    console.log('Role account:', detailedResult.role);
    console.log('Accept all:', detailedResult.accept_all);
    console.log('Catch all:', detailedResult.catch_all);
    console.log('SMTP check:', detailedResult.smtp_check);
    console.log('MX found:', detailedResult.mx_found);
    console.log('First name:', detailedResult.firstName || 'N/A');
    console.log('Last name:', detailedResult.lastName || 'N/A');

    // 3. Check if Domain is Disposable
    console.log('\n3. Check Disposable Domain');
    console.log('================================');
    const disposableCheck = await client.checkDisposable('tempmail.com');
    console.log('Domain:', disposableCheck.domain);
    console.log('Is disposable:', disposableCheck.disposable);
    console.log('Reason:', disposableCheck.reason);

    // 4. Get Account Credits
    console.log('\n4. Check Account Credits');
    console.log('================================');
    const credits = await client.getCredits();
    console.log('On-demand credits:', credits.onDemand.available);
    if (credits.subscription) {
      console.log('Subscription credits:', credits.subscription.available);
      console.log('Expires at:', credits.subscription.expiresAt);
    }

    console.log('\n✅ All basic examples completed successfully!');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.statusCode) {
      console.error('Status code:', error.statusCode);
    }
  }
}

// Run the examples
runBasicExamples();
