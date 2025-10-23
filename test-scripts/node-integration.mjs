#!/usr/bin/env node
/**
 * EmailListVerify SDK - Comprehensive Node.js Integration Tests
 *
 * Tests the built SDK against the real EmailListVerify API
 * Includes both functional testing AND response validation
 *
 * Usage:
 *   1. Copy .env.example to .env
 *   2. Add your API key to .env
 *   3. Run: node test-scripts/node-integration.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import the BUILT SDK (testing what users will get)
import {
  EmailListVerifyClient,
  VERSION,
  isAuthenticationError,
  isInsufficientCreditsError,
  isValidationError,
  isNotFoundError
} from '../dist/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================================
// Configuration
// ============================================================================

const RESULTS_DIR = join(__dirname, 'results');
const TEST_DATA_DIR = join(__dirname, 'test-data');

// Load environment variables
function loadEnv() {
  try {
    const envPath = join(__dirname, '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const [, key, value] = match;
        process.env[key.trim()] = value.trim();
      }
    });
  } catch (error) {
    // .env file doesn't exist, that's ok - will check API key later
  }
}

loadEnv();

const API_KEY = process.env.EMAILLISTVERIFY_API_KEY;

// Check API key early - exit if not found
if (!API_KEY) {
  console.error('\n❌ ERROR: EMAILLISTVERIFY_API_KEY not found!');
  console.error('   Please create .env file from .env.example and add your API key.');
  console.error('   Get your API key from: https://apps.emaillistverify.com/api\n');
  process.exit(1);
}

// ============================================================================
// Test Results Tracking
// ============================================================================

const results = {
  startTime: new Date(),
  sdkVersion: VERSION,
  nodeVersion: process.version,
  tests: [],
  responses: {}, // Store all API responses
  validationErrors: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    creditsUsed: 0,
    validationErrors: 0
  }
};

function logTest(name, status, details = {}) {
  const test = {
    name,
    status, // 'pass', 'fail', 'skip'
    timestamp: new Date().toISOString(),
    ...details
  };

  results.tests.push(test);
  results.summary.total++;
  results.summary[status === 'pass' ? 'passed' : status === 'fail' ? 'failed' : 'skipped']++;

  // Console output with colors
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️';
  const color = status === 'pass' ? '\x1b[32m' : status === 'fail' ? '\x1b[31m' : '\x1b[33m';
  const reset = '\x1b[0m';

  console.log(`${color}${icon} ${name}${reset}`);
  if (details.error) {
    console.log(`   Error: ${details.error}`);
  }
  if (details.note) {
    console.log(`   Note: ${details.note}`);
  }
}

function checkEndpointCoverage() {
  // All 11 API endpoints that should be tested
  const allEndpoints = {
    'verifyEmail': { tested: false, critical: true },
    'verifyEmailDetailed': { tested: false, critical: true },
    'createEmailJob': { tested: false, critical: true },
    'getEmailJob': { tested: false, critical: true },
    'findContact': { tested: false, critical: true },
    'checkDisposable': { tested: false, critical: true },
    'uploadBulkFile': { tested: false, critical: true },
    'getBulkProgress': { tested: false, critical: true },
    'downloadBulkResults': { tested: false, critical: false },
    'deleteBulkList': { tested: false, critical: false },
    'getCredits': { tested: false, critical: true }
  };

  // Check which endpoints were tested
  results.tests.forEach(test => {
    const testName = test.name;
    for (const endpoint in allEndpoints) {
      if (testName.includes(endpoint) && test.status === 'pass') {
        allEndpoints[endpoint].tested = true;
      }
    }
  });

  // Calculate coverage
  const totalEndpoints = Object.keys(allEndpoints).length;
  const testedEndpoints = Object.values(allEndpoints).filter(e => e.tested).length;
  const coveragePercent = Math.round((testedEndpoints / totalEndpoints) * 100);

  // Store in results
  results.endpointCoverage = {
    total: totalEndpoints,
    tested: testedEndpoints,
    coverage: coveragePercent,
    endpoints: allEndpoints
  };

  return { allEndpoints, testedEndpoints, totalEndpoints, coveragePercent };
}

function saveResults() {
  mkdirSync(RESULTS_DIR, { recursive: true});

  results.endTime = new Date();
  results.duration = results.endTime - results.startTime;

  // Check endpoint coverage
  const coverage = checkEndpointCoverage();

  const reportPath = join(RESULTS_DIR, `test-report-${Date.now()}.json`);
  writeFileSync(reportPath, JSON.stringify(results, null, 2));

  // Also save full responses separately
  const responsesPath = join(RESULTS_DIR, `full-responses-${Date.now()}.json`);
  writeFileSync(responsesPath, JSON.stringify(results.responses, null, 2));

  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`SDK Version:         ${results.sdkVersion}`);
  console.log(`Node Version:        ${results.nodeVersion}`);
  console.log(`Total Tests:         ${results.summary.total}`);
  console.log(`✅ Passed:            ${results.summary.passed}`);
  console.log(`❌ Failed:            ${results.summary.failed}`);
  console.log(`⏭️  Skipped:           ${results.summary.skipped}`);
  console.log(`🔍 Validation Errors: ${results.summary.validationErrors}`);
  console.log(`💰 Credits Used:      ~${results.summary.creditsUsed}`);
  console.log(`⏱️  Duration:          ${Math.round(results.duration / 1000)}s`);
  console.log('='.repeat(80));

  // Display endpoint coverage
  console.log('\n📋 API ENDPOINT COVERAGE');
  console.log('='.repeat(80));
  console.log(`Coverage: ${coverage.testedEndpoints}/${coverage.totalEndpoints} endpoints (${coverage.coveragePercent}%)\n`);

  Object.entries(coverage.allEndpoints).forEach(([endpoint, info]) => {
    const icon = info.tested ? '✅' : '❌';
    const label = info.critical ? endpoint : `${endpoint} (optional)`;
    console.log(`${icon} ${label}`);
  });

  console.log('='.repeat(80));
  console.log(`📁 Report saved:      ${reportPath}`);
  console.log(`📁 Responses saved:   ${responsesPath}`);
  console.log('='.repeat(80));
}

// ============================================================================
// Response Validators
// ============================================================================

function validateVerifyEmailDetailed(response) {
  const errors = [];

  // Required fields
  if (typeof response.email !== 'string') errors.push('email: expected string');
  if (typeof response.result !== 'string') errors.push('result: expected VerificationResult');
  if (typeof response.account !== 'string') errors.push('account: expected string');
  if (typeof response.isRole !== 'boolean') errors.push('isRole: expected boolean');
  if (typeof response.isFree !== 'boolean') errors.push('isFree: expected boolean');
  if (typeof response.isNoReply !== 'boolean') errors.push('isNoReply: expected boolean');

  // Nullable fields
  if (response.internalResult !== null && typeof response.internalResult !== 'string') {
    errors.push('internalResult: expected string | null');
  }
  if (response.mxServer !== null && typeof response.mxServer !== 'string') {
    errors.push('mxServer: expected string | null');
  }
  if (response.mxServerIp !== null && typeof response.mxServerIp !== 'string') {
    errors.push('mxServerIp: expected string | null');
  }
  if (response.esp !== null && typeof response.esp !== 'string') {
    errors.push('esp: expected EmailServiceProvider | null');
  }
  if (response.tag !== null && typeof response.tag !== 'string') {
    errors.push('tag: expected string | null');
  }
  if (response.firstName !== null && typeof response.firstName !== 'string') {
    errors.push('firstName: expected string | null');
  }
  if (response.lastName !== null && typeof response.lastName !== 'string') {
    errors.push('lastName: expected string | null');
  }
  if (response.gender !== null && !['male', 'female'].includes(response.gender)) {
    errors.push('gender: expected "male" | "female" | null');
  }

  return errors;
}

function validateEmailJobResponse(response) {
  const errors = [];

  if (typeof response.id !== 'string') errors.push('id: expected string');
  if (typeof response.email !== 'string') errors.push('email: expected string');
  if (!['standard', 'high'].includes(response.quality)) {
    errors.push('quality: expected "standard" | "high"');
  }
  if (!['processing', 'finished'].includes(response.status)) {
    errors.push('status: expected "processing" | "finished"');
  }
  if (typeof response.hasGreylist !== 'boolean') errors.push('hasGreylist: expected boolean');
  if (typeof response.createdAt !== 'string') errors.push('createdAt: expected string (ISO 8601)');

  // Nullable fields
  if (response.finishedAt !== null && typeof response.finishedAt !== 'string') {
    errors.push('finishedAt: expected string | null');
  }
  if (response.result !== null && typeof response.result !== 'object') {
    errors.push('result: expected VerifyEmailDetailedResponse | null');
  }

  return errors;
}

function validateCheckDisposableResponse(response) {
  const errors = [];

  if (typeof response.domain !== 'string') errors.push('domain: expected string');
  if (typeof response.result !== 'string') errors.push('result: expected DisposableResult');

  // Nullable fields
  if (response.internalResult !== null && typeof response.internalResult !== 'string') {
    errors.push('internalResult: expected string | null');
  }
  if (response.mxServer !== null && typeof response.mxServer !== 'string') {
    errors.push('mxServer: expected string | null');
  }
  if (response.mxServerIp !== null && typeof response.mxServerIp !== 'string') {
    errors.push('mxServerIp: expected string | null');
  }

  return errors;
}

function validateFindContactResponse(response) {
  const errors = [];

  if (!Array.isArray(response)) {
    errors.push('response: expected array');
    return errors;
  }

  response.forEach((contact, index) => {
    if (typeof contact.email !== 'string') {
      errors.push(`[${index}].email: expected string`);
    }
    if (!['unknown', 'low', 'medium', 'high'].includes(contact.confidence)) {
      errors.push(`[${index}].confidence: expected ConfidenceLevel`);
    }
  });

  return errors;
}

function validateCreditsResponse(response) {
  const errors = [];

  if (!response.onDemand || typeof response.onDemand.available !== 'number') {
    errors.push('onDemand.available: expected number');
  }

  if (response.subscription !== null && response.subscription !== undefined) {
    if (typeof response.subscription.available !== 'number') {
      errors.push('subscription.available: expected number');
    }
    if (typeof response.subscription.expiresAt !== 'string') {
      errors.push('subscription.expiresAt: expected string (ISO 8601)');
    }
  }

  return errors;
}

function validateMaillistProgressResponse(response) {
  const errors = [];

  if (!['uploaded', 'processing', 'finished', 'inQueue', 'starting', 'error'].includes(response.status)) {
    errors.push('status: expected MaillistStatus');
  }
  if (typeof response.progress !== 'number') errors.push('progress: expected number');
  if (typeof response.name !== 'string') errors.push('name: expected string');
  if (typeof response.createdAt !== 'string') errors.push('createdAt: expected string (ISO 8601)');
  if (typeof response.updatedAt !== 'string') errors.push('updatedAt: expected string (ISO 8601)');

  if (!response.credits || typeof response.credits !== 'object') {
    errors.push('credits: expected MaillistCredits object');
  } else {
    if (response.credits.charged !== null && typeof response.credits.charged !== 'number') {
      errors.push('credits.charged: expected number | null');
    }
    if (response.credits.returned !== null && typeof response.credits.returned !== 'number') {
      errors.push('credits.returned: expected number | null');
    }
  }

  return errors;
}

function logValidation(name, errors) {
  if (errors.length > 0) {
    console.log(`   🔍 Validation Issues:`);
    errors.forEach(e => console.log(`      - ${e}`));
    results.summary.validationErrors += errors.length;
    results.validationErrors.push({ endpoint: name, errors });
  } else {
    console.log(`   🔍 Response structure: ✅ Valid`);
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function withTimeout(promise, timeoutMs, name) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

/**
 * Poll bulk job until finished (TEST ONLY - not for SDK)
 * This is acceptable in a test script because:
 * - We control the input (5 emails = quick processing)
 * - We have a reasonable timeout (3 minutes)
 * - Tests need to be comprehensive
 */
async function waitForBulkCompletion(client, fileId, maxWaitMs = 180000) {
  const startTime = Date.now();
  const pollInterval = 5000; // Check every 5 seconds

  console.log(`   ⏳ Waiting for bulk processing to complete (max ${Math.round(maxWaitMs/1000)}s)...`);

  while (Date.now() - startTime < maxWaitMs) {
    const progress = await client.getBulkProgress(fileId);

    console.log(`   📊 Progress: ${progress.progress}% (${progress.status})`);

    if (progress.status === 'finished') {
      console.log(`   ✅ Processing complete!`);
      return progress;
    }

    if (progress.status === 'error') {
      throw new Error('Bulk processing failed with error status');
    }

    await sleep(pollInterval);
  }

  throw new Error(`Timeout: Bulk job did not complete within ${Math.round(maxWaitMs/1000)}s`);
}

// ============================================================================
// Test Cases
// ============================================================================

async function testClientInstantiation() {
  console.log('\n🧪 Testing Client Instantiation...');

  try {
    new EmailListVerifyClient('test-key');
    logTest('Create client with valid API key', 'pass');
  } catch (error) {
    logTest('Create client with valid API key', 'fail', { error: error.message });
  }

  try {
    new EmailListVerifyClient('');
    logTest('Create client with empty API key (should fail)', 'fail', {
      error: 'Should have thrown ValidationError'
    });
  } catch (error) {
    if (isValidationError(error)) {
      logTest('Create client with empty API key (should fail)', 'pass', {
        note: 'Correctly threw ValidationError'
      });
    } else {
      logTest('Create client with empty API key (should fail)', 'fail', {
        error: `Wrong error type: ${error.constructor.name}`
      });
    }
  }
}

async function testVerifyEmail(client) {
  console.log('\n🧪 Testing verifyEmail (Simple)...');

  const testEmails = [
    { email: 'test@gmail.com', expectedPattern: /^(ok|unknown|dead_server|invalid_mx|email_disabled|antispam_system|ok_for_all|smtp_protocol|invalid_syntax|disposable|spamtrap|error_credit)$/ },
    { email: 'invalid-email', expectedPattern: null, shouldFail: true }
  ];

  for (const { email, expectedPattern, shouldFail } of testEmails) {
    try {
      const result = await withTimeout(
        client.verifyEmail(email),
        30000,
        'verifyEmail'
      );

      results.responses[`verifyEmail_${email}`] = result;

      if (shouldFail) {
        logTest(`verifyEmail('${email}') - should have failed`, 'fail');
      } else if (expectedPattern && expectedPattern.test(result)) {
        logTest(`verifyEmail('${email}')`, 'pass', { note: `Result: ${result}` });
        results.summary.creditsUsed += 1;
      } else {
        logTest(`verifyEmail('${email}')`, 'fail', {
          error: `Unexpected result: ${result}`
        });
      }
    } catch (error) {
      if (shouldFail) {
        logTest(`verifyEmail('${email}') - validation error`, 'pass', {
          note: `Correctly threw ${error.constructor.name}`
        });
      } else {
        logTest(`verifyEmail('${email}')`, 'fail', {
          error: `${error.constructor.name}: ${error.message}`
        });
      }
    }
  }
}

async function testVerifyEmailDetailed(client) {
  console.log('\n🧪 Testing verifyEmailDetailed + Response Validation...');

  try {
    const result = await withTimeout(
      client.verifyEmailDetailed('test@gmail.com'),
      30000,
      'verifyEmailDetailed'
    );

    results.responses.verifyEmailDetailed = result;

    // Validate response structure
    const validationErrors = validateVerifyEmailDetailed(result);

    // Check required fields
    const hasRequiredFields =
      result.email &&
      result.result &&
      typeof result.isRole === 'boolean' &&
      typeof result.isFree === 'boolean';

    if (hasRequiredFields) {
      logTest('verifyEmailDetailed()', 'pass', {
        note: `Email: ${result.email}, Result: ${result.result}, ESP: ${result.esp || 'N/A'}`
      });
      logValidation('verifyEmailDetailed', validationErrors);
      results.summary.creditsUsed += 1;
    } else {
      logTest('verifyEmailDetailed()', 'fail', {
        error: 'Response missing required fields'
      });
    }
  } catch (error) {
    logTest('verifyEmailDetailed()', 'fail', {
      error: `${error.constructor.name}: ${error.message}`
    });
  }
}

async function testEmailJobFlow(client) {
  console.log('\n🧪 Testing Email Job Flow + Response Validation...');

  try {
    // Create job
    const job = await withTimeout(
      client.createEmailJob({
        email: 'test@gmail.com',
        quality: 'standard'
      }),
      30000,
      'createEmailJob'
    );

    results.responses.createEmailJob = job;

    if (!job.id) {
      logTest('createEmailJob()', 'fail', { error: 'No job ID returned' });
      return;
    }

    logTest('createEmailJob()', 'pass', {
      note: `Job ID: ${job.id}`
    });
    results.summary.creditsUsed += 1;

    // Wait for processing
    await sleep(2000);

    // Get job status
    const jobStatus = await withTimeout(
      client.getEmailJob(job.id),
      30000,
      'getEmailJob'
    );

    results.responses.getEmailJob = jobStatus;

    const validationErrors = validateEmailJobResponse(jobStatus);

    if (jobStatus.status === 'processing' || jobStatus.status === 'finished') {
      logTest('getEmailJob()', 'pass', {
        note: `Status: ${jobStatus.status}, Greylist: ${jobStatus.hasGreylist}`
      });
      logValidation('getEmailJob', validationErrors);
    } else {
      logTest('getEmailJob()', 'fail', {
        error: `Unexpected status: ${jobStatus.status}`
      });
    }
  } catch (error) {
    logTest('Email Job Flow', 'fail', {
      error: `${error.constructor.name}: ${error.message}`
    });
  }
}

async function testFindContact(client) {
  console.log('\n🧪 Testing findContact + Response Validation...');

  try {
    const contacts = await withTimeout(
      client.findContact({
        firstName: 'John',
        lastName: 'Doe',
        domain: 'gmail.com'
      }),
      30000,
      'findContact'
    );

    results.responses.findContact = contacts.slice(0, 5); // Save first 5

    const validationErrors = validateFindContactResponse(contacts);

    if (Array.isArray(contacts)) {
      logTest('findContact()', 'pass', {
        note: `Found ${contacts.length} contacts`
      });
      logValidation('findContact', validationErrors);
      results.summary.creditsUsed += 5; // 5-10 credits
    } else {
      logTest('findContact()', 'fail', {
        error: 'Response is not an array'
      });
    }
  } catch (error) {
    logTest('findContact()', 'fail', {
      error: `${error.constructor.name}: ${error.message}`
    });
  }
}

async function testCheckDisposable(client) {
  console.log('\n🧪 Testing checkDisposable + Response Validation...');

  const testDomains = [
    { domain: 'gmail.com', expectedResult: 'ok' },
    { domain: 'tempmail.com', expectedResult: 'disposable' }
  ];

  for (const { domain, expectedResult } of testDomains) {
    try {
      const result = await withTimeout(
        client.checkDisposable(domain),
        30000,
        'checkDisposable'
      );

      results.responses[`checkDisposable_${domain}`] = result;

      const validationErrors = validateCheckDisposableResponse(result);

      if (result.domain === domain && result.result) {
        logTest(`checkDisposable('${domain}')`, 'pass', {
          note: `Result: ${result.result}`
        });
        logValidation(`checkDisposable_${domain}`, validationErrors);
        results.summary.creditsUsed += 1;
      } else {
        logTest(`checkDisposable('${domain}')`, 'fail', {
          error: 'Invalid response structure'
        });
      }
    } catch (error) {
      logTest(`checkDisposable('${domain}')`, 'fail', {
        error: `${error.constructor.name}: ${error.message}`
      });
    }
  }
}

async function testBulkUploadFlow(client) {
  console.log('\n🧪 Testing Complete Bulk Upload Flow (with polling)...');

  try {
    // Read test CSV file
    const csvPath = join(TEST_DATA_DIR, 'sample-emails.csv');
    const csvBuffer = readFileSync(csvPath);

    console.log(`   📄 Uploading file (${csvBuffer.length} bytes)...`);

    // Upload file with unique name to avoid duplicates
    const uniqueFilename = `sample-emails-${Date.now()}.csv`;
    const fileId = await withTimeout(
      client.uploadBulkFile(csvBuffer, uniqueFilename),
      60000,
      'uploadBulkFile'
    );

    results.responses.uploadBulkFile = { fileId };

    if (!fileId || typeof fileId !== 'string') {
      logTest('uploadBulkFile()', 'fail', { error: 'No file ID returned' });
      return;
    }

    logTest('uploadBulkFile()', 'pass', { note: `File ID: ${fileId}` });
    results.summary.creditsUsed += 5; // Approximate

    // Wait a bit for initial processing
    await sleep(3000);

    // Check initial progress
    const initialProgress = await withTimeout(
      client.getBulkProgress(fileId),
      30000,
      'getBulkProgress'
    );

    results.responses.getBulkProgress = initialProgress;

    const validationErrors = validateMaillistProgressResponse(initialProgress);

    logTest('getBulkProgress()', 'pass', {
      note: `Initial status: ${initialProgress.status} (${initialProgress.progress}%)`
    });
    logValidation('getBulkProgress', validationErrors);

    // Poll until finished (with 3 minute timeout)
    try {
      const finalProgress = await waitForBulkCompletion(client, fileId, 180000);

      // Test download
      console.log(`   📥 Downloading results...`);
      const downloadResults = await withTimeout(
        client.downloadBulkResults(fileId, {
          format: 'csv',
          addFirstName: true,
          addLastName: true,
          addResult: true
        }),
        30000,
        'downloadBulkResults'
      );

      results.responses.downloadBulkResults = {
        size: downloadResults.length,
        type: typeof downloadResults,
        preview: downloadResults.toString().substring(0, 200)
      };

      logTest('downloadBulkResults()', 'pass', {
        note: `Downloaded ${downloadResults.length} bytes`
      });

      // Test delete
      console.log(`   🗑️  Deleting list...`);
      await withTimeout(
        client.deleteBulkList(fileId),
        30000,
        'deleteBulkList'
      );

      logTest('deleteBulkList()', 'pass', {
        note: 'List deleted successfully'
      });

    } catch (error) {
      // If polling times out, that's a skip not a fail
      if (error.message.includes('Timeout')) {
        logTest('downloadBulkResults()', 'skip', {
          note: 'List processing timed out (3 minutes)'
        });
        logTest('deleteBulkList()', 'skip', {
          note: 'Could not test - list not finished'
        });
        console.log(`   ℹ️  File ID: ${fileId} - still processing, check manually later`);
      } else {
        logTest('Download/Delete flow', 'fail', {
          error: `${error.constructor.name}: ${error.message}`
        });
      }
    }

  } catch (error) {
    logTest('Bulk Upload Flow', 'fail', {
      error: `${error.constructor.name}: ${error.message}`
    });
  }
}

async function testGetCredits(client) {
  console.log('\n🧪 Testing getCredits + Response Validation...');

  try {
    const credits = await withTimeout(
      client.getCredits(),
      30000,
      'getCredits'
    );

    results.responses.getCredits = credits;

    const validationErrors = validateCreditsResponse(credits);

    if (credits.onDemand && typeof credits.onDemand.available === 'number') {
      logTest('getCredits()', 'pass', {
        note: `Available: ${credits.onDemand.available}`
      });
      logValidation('getCredits', validationErrors);

      console.log(`   💰 On-demand credits: ${credits.onDemand.available}`);
      if (credits.subscription) {
        console.log(`   💰 Subscription credits: ${credits.subscription.available}`);
        console.log(`   📅 Expires: ${credits.subscription.expiresAt}`);
      }
    } else {
      logTest('getCredits()', 'fail', {
        error: 'Invalid response structure'
      });
    }
  } catch (error) {
    logTest('getCredits()', 'fail', {
      error: `${error.constructor.name}: ${error.message}`
    });
  }
}

async function testErrorHandling(client) {
  console.log('\n🧪 Testing Error Handling...');

  // Test authentication error
  try {
    const badClient = new EmailListVerifyClient('invalid-api-key-12345');
    await badClient.verifyEmail('test@gmail.com');
    logTest('AuthenticationError handling', 'fail', {
      error: 'Should have thrown AuthenticationError'
    });
  } catch (error) {
    if (isAuthenticationError(error)) {
      logTest('AuthenticationError handling', 'pass', {
        note: `Correctly caught: ${error.message}`
      });
    } else {
      logTest('AuthenticationError handling', 'fail', {
        error: `Wrong error type: ${error.constructor.name}`
      });
    }
  }

  // Test not found error (API returns 500 instead of 404 - see API_SPEC_ISSUES.md #5)
  try {
    await client.getEmailJob('nonexistent-job-id-12345');
    logTest('getEmailJob with invalid ID (should throw error)', 'fail', {
      error: 'Should have thrown an error'
    });
  } catch (error) {
    if (error.statusCode === 500 && error.message === 'Internal Server Error') {
      logTest('getEmailJob with invalid ID (API returns 500)', 'pass', {
        note: 'API bug: returns 500 instead of 404. See API_SPEC_ISSUES.md #5'
      });
    } else if (isNotFoundError(error)) {
      logTest('getEmailJob with invalid ID (API fixed!)', 'pass', {
        note: 'API now correctly returns 404!'
      });
    } else {
      logTest('getEmailJob with invalid ID', 'fail', {
        error: `Unexpected error: ${error.constructor.name} (${error.statusCode}): ${error.message}`
      });
    }
  }
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function runTests() {
  console.log('='.repeat(80));
  console.log('🚀 EmailListVerify SDK - Comprehensive Integration Tests');
  console.log('='.repeat(80));
  console.log(`SDK Version: ${VERSION}`);
  console.log(`Node Version: ${process.version}`);
  console.log(`Start Time: ${results.startTime.toISOString()}`);
  console.log('='.repeat(80));
  console.log(`✅ API Key loaded: ${API_KEY.substring(0, 8)}...`);

  // Create client
  const client = new EmailListVerifyClient(API_KEY);

  // Run all tests
  try {
    await testClientInstantiation();
    await testGetCredits(client); // Check credits first
    await testVerifyEmail(client);
    await testVerifyEmailDetailed(client);
    await testEmailJobFlow(client);
    await testFindContact(client);
    await testCheckDisposable(client);
    await testBulkUploadFlow(client);
    await testErrorHandling(client);

  } catch (error) {
    console.error('\n💥 Unexpected error during tests:', error);
    results.tests.push({
      name: 'Test Suite',
      status: 'fail',
      error: error.message,
      stack: error.stack
    });
  }

  // Save and display results
  saveResults();

  // Exit with appropriate code
  const hasFailures = results.summary.failed > 0 || results.summary.validationErrors > 0;
  process.exit(hasFailures ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
