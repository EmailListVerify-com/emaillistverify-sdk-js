# EmailListVerify SDK for JavaScript/TypeScript

Official JavaScript/TypeScript SDK for the [EmailListVerify API](https://www.emaillistverify.com/) - Professional email validation and verification service.

[![npm version](https://img.shields.io/npm/v/emaillistverify-sdk-js.svg)](https://www.npmjs.com/package/emaillistverify-sdk-js)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

✅ **Zero dependencies** - Uses Node.js 20+ native `fetch` API
✅ **Full TypeScript support** - Strict type safety with complete type definitions
✅ **ESM & CommonJS** - Dual module format for maximum compatibility
✅ **All 11 API endpoints** - Complete API coverage
✅ **13 error classes** - Comprehensive error handling with type guards
✅ **Production ready** - Thoroughly tested with 161 tests (85 unit + 76 integration)

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Methods](#api-methods)
  - [Single Email Verification](#single-email-verification)
  - [Async Email Jobs](#async-email-jobs)
  - [Contact Finder](#contact-finder)
  - [Disposable Domain Check](#disposable-domain-check)
  - [Bulk Verification](#bulk-verification)
  - [Credits Management](#credits-management)
- [Error Handling](#error-handling)
- [TypeScript](#typescript)
- [Examples](#examples)
- [Configuration](#configuration)
- [Testing](#testing)
- [API Reference](#api-reference)
- [Support](#support)

---

## Installation

```bash
npm install emaillistverify-sdk-js
```

**Requirements:**

- Node.js 20+ (uses native `fetch` API)
- TypeScript 5.x (optional, for TypeScript projects)

---

## Quick Start

```javascript
import { EmailListVerifyClient } from 'emaillistverify-sdk-js';

// Initialize with your API key
const client = new EmailListVerifyClient('your-api-key-here');

// Verify a single email
const result = await client.verifyEmail('test@example.com');
console.log(result);
// {
//   email: 'test@example.com',
//   result: 'ok',
//   role: false,
//   disposable: false,
//   free: true,
//   didYouMean: null
// }
```

**Get your API key:** https://apps.emaillistverify.com/api

---

## API Methods

### Single Email Verification

#### `verifyEmail(email: string): Promise<EmailVerificationResult>`

Simple email verification - checks email validity, disposable status, and more.

```javascript
const result = await client.verifyEmail('john.doe@example.com');

console.log(result.result); // 'ok' | 'invalid' | 'unknown' | etc.
console.log(result.disposable); // true/false - is disposable email?
console.log(result.free); // true/false - free email provider?
console.log(result.role); // true/false - role-based email?
console.log(result.didYouMean); // Suggested correction or null
```

**💳 Credits:** See [pricing documentation](https://emaillistverify.com/pricing)

---

#### `verifyEmailDetailed(email: string): Promise<DetailedEmailVerificationResult>`

Detailed verification with SMTP check and additional metadata.

```javascript
const result = await client.verifyEmailDetailed('ceo@company.com');

console.log(result.result); // Verification result
console.log(result.smtp_check); // SMTP server response
console.log(result.mx_found); // MX records found?
console.log(result.accept_all); // Server accepts all emails?
console.log(result.catch_all); // Catch-all domain?
console.log(result.firstName); // First name (if detected)
console.log(result.lastName); // Last name (if detected)
console.log(result.gender); // Gender (if detected)
console.log(result.country); // Country (if detected)
```

**💳 Credits:** See [pricing documentation](https://emaillistverify.com/pricing)

---

### Async Email Jobs

Use async jobs when you don't need immediate results.

#### `createEmailJob(params: CreateEmailJobRequest): Promise<EmailJob>`

Create an async email verification job.

```javascript
const job = await client.createEmailJob({
  email: 'test@example.com',
  quality: 'standard', // 'standard' or 'high'
});

console.log(job.id); // Job ID for status checking
console.log(job.status); // 'pending' | 'processing' | 'finished' | 'failed'
console.log(job.createdAt); // ISO timestamp
```

---

#### `getEmailJob(jobId: string): Promise<EmailJobStatus>`

Check the status of an async job.

```javascript
const status = await client.getEmailJob('job-12345');

console.log(status.status); // Job status
console.log(status.finishedAt); // Completion time (if finished)

if (status.status === 'finished') {
  console.log(status.result); // EmailVerificationResult
}
```

**Polling Example:** See [examples/async-jobs.js](./examples/async-jobs.js)

---

### Contact Finder

Find contact email addresses by name and domain.

#### `findContact(params: FindContactRequest): Promise<FindContactResult>`

```javascript
const result = await client.findContact({
  firstName: 'John',
  lastName: 'Doe', // optional
  domain: 'example.com',
});

console.log(result.emails.length); // Number of contacts found

result.emails.forEach((contact) => {
  console.log(contact.email); // Email address
  console.log(contact.firstName); // First name
  console.log(contact.lastName); // Last name
  console.log(contact.position); // Job title/position
});
```

**💳 Credits:** See [pricing documentation](https://emaillistverify.com/pricing)

**Use cases:** Lead generation, finding decision-makers, building contact lists

---

### Disposable Domain Check

Check if a domain is a disposable/temporary email provider.

#### `checkDisposable(domain: string): Promise<DisposableDomainResult>`

```javascript
const result = await client.checkDisposable('tempmail.com');

console.log(result.domain); // 'tempmail.com'
console.log(result.disposable); // true
console.log(result.reason); // 'Known disposable email provider'
```

**💳 Credits:** See [pricing documentation](https://emaillistverify.com/pricing)

---

### Bulk Verification

Upload CSV files for batch email verification.

#### `uploadBulkFile(file: Buffer | Blob, filename: string): Promise<BulkUploadResult>`

```javascript
import { readFileSync } from 'fs';

const fileBuffer = readFileSync('./emails.csv');
const upload = await client.uploadBulkFile(fileBuffer, 'emails.csv');

console.log(upload.fileId); // File ID for tracking
console.log(upload.status); // 'processing'
console.log(upload.fileName); // Original filename
```

**CSV Format:**

```csv
email
john@example.com
jane@company.com
test@tempmail.com
```

---

#### `getBulkProgress(fileId: string): Promise<BulkProgress>`

Check bulk processing progress.

```javascript
const progress = await client.getBulkProgress('file-12345');

console.log(progress.status); // 'processing' | 'finished' | 'error'
console.log(progress.progress); // Percentage (0-100)
console.log(progress.total); // Total emails in file
console.log(progress.processed); // Emails processed so far
console.log(progress.unique); // Unique emails found
```

---

#### `downloadBulkResults(fileId: string, options?: DownloadMaillistOptions): Promise<Blob>`

Download processed results as CSV.

```javascript
const resultsBlob = await client.downloadBulkResults('file-12345');

// Save to file (Node.js)
import { writeFileSync } from 'fs';
const buffer = Buffer.from(await resultsBlob.arrayBuffer());
writeFileSync('./results.csv', buffer);

// Download with duplicates included
const withDuplicates = await client.downloadBulkResults('file-12345', {
  addDuplicates: true,
});
```

---

#### `deleteBulkList(fileId: string): Promise<void>`

Delete a bulk list after processing.

```javascript
await client.deleteBulkList('file-12345');
console.log('Bulk list deleted');
```

**Best Practice:** Always clean up bulk lists after downloading results.

**Complete Example:** See [examples/bulk-verification.js](./examples/bulk-verification.js)

---

### Credits Management

#### `getCredits(): Promise<CreditsResponse>`

Get your account credit balance.

```javascript
const credits = await client.getCredits();

console.log('On-demand credits:', credits.onDemand.available);

if (credits.subscription) {
  console.log('Subscription credits:', credits.subscription.available);
  console.log('Expires at:', credits.subscription.expiresAt);
}
```

**💳 Credits:** Free - does not consume credits

---

## Error Handling

The SDK provides 13 specialized error classes for comprehensive error handling.

### Error Types

```typescript
import {
  EmailListVerifyError, // Base error class
  AuthenticationError, // 401 - Invalid API key
  ForbiddenError, // 403 - Access denied
  InsufficientCreditsError, // 403 - Not enough credits
  TooManyJobsError, // 403 - Job limit reached
  NotFoundError, // 404 - Resource not found
  EmailJobNotFoundError, // 404 - Job not found
  MaillistNotFoundError, // 404 - Bulk list not found
  BadRequestError, // 400 - Bad request
  InvalidFileError, // 400 - Invalid file format
  MaillistNotFinishedError, // 400 - Bulk list still processing
  RateLimitError, // 429 - Rate limit exceeded
  NetworkError, // Network/connection error
  TimeoutError, // Request timeout
  ValidationError, // Client-side validation error
  ParseError, // JSON parse error
} from 'emaillistverify-sdk-js';
```

### Type Guards

Use type guards for type-safe error handling:

```javascript
import {
  isAuthenticationError,
  isInsufficientCreditsError,
  isRateLimitError,
  isNotFoundError,
  isNetworkError,
  isValidationError,
} from 'emaillistverify-sdk-js';

try {
  const result = await client.verifyEmail('test@example.com');
} catch (error) {
  if (isAuthenticationError(error)) {
    console.error('Invalid API key');
  } else if (isInsufficientCreditsError(error)) {
    console.error('Not enough credits');
    const credits = await client.getCredits();
    console.log('Available:', credits.onDemand.available);
  } else if (isRateLimitError(error)) {
    console.error('Rate limit exceeded - retry later');
  } else if (isNetworkError(error)) {
    console.error('Network error:', error.message);
  } else {
    console.error('Error:', error.message);
  }
}
```

### Generic Error Handling

```javascript
try {
  const result = await client.verifyEmail(email);
  // Use result
} catch (error) {
  console.error('Error code:', error.code);
  console.error('Status:', error.statusCode);
  console.error('Message:', error.message);

  if (error.response) {
    console.error('API response:', error.response);
  }
}
```

**Complete Example:** See [examples/error-handling.js](./examples/error-handling.js)

---

## TypeScript

The SDK is written in TypeScript with full type safety.

### Type Definitions

```typescript
import {
  EmailListVerifyClient,
  EmailVerificationResult,
  DetailedEmailVerificationResult,
  EmailJob,
  EmailJobStatus,
  FindContactRequest,
  FindContactResult,
  DisposableDomainResult,
  BulkUploadResult,
  BulkProgress,
  CreditsResponse,
  ClientConfig,
} from 'emaillistverify-sdk-js';

const client = new EmailListVerifyClient('api-key');

// Type-safe API calls
const result: EmailVerificationResult = await client.verifyEmail('test@example.com');
const detailed: DetailedEmailVerificationResult =
  await client.verifyEmailDetailed('test@example.com');
const job: EmailJob = await client.createEmailJob({
  email: 'test@example.com',
  quality: 'standard',
});
const credits: CreditsResponse = await client.getCredits();
```

### Custom Configuration Type

```typescript
const config: ClientConfig = {
  baseUrl: 'https://api.emaillistverify.com',
  timeout: 30000,
  headers: {
    'X-Custom-Header': 'value',
  },
};

const client = new EmailListVerifyClient('api-key', config);
```

---

## Examples

The SDK includes 5 comprehensive usage examples:

1. **[basic-usage.js](./examples/basic-usage.js)** - Getting started with simple verification
2. **[async-jobs.js](./examples/async-jobs.js)** - Async job creation and polling
3. **[bulk-verification.js](./examples/bulk-verification.js)** - CSV upload and batch processing
4. **[contact-finder.js](./examples/contact-finder.js)** - Finding contact email addresses
5. **[error-handling.js](./examples/error-handling.js)** - Comprehensive error management

**Run examples:**

```bash
export EMAILLISTVERIFY_API_KEY="your-api-key"
node examples/basic-usage.js
```

See [examples/README.md](./examples/README.md) for detailed usage examples and use cases.

---

## Configuration

### Constructor Options

```javascript
const client = new EmailListVerifyClient(apiKey, {
  baseUrl: 'https://api.emaillistverify.com', // API endpoint
  timeout: 30000, // Request timeout (ms)
  headers: {
    // Custom headers
    'X-Custom-Header': 'value',
  },
});
```

### Environment Variables

```bash
export EMAILLISTVERIFY_API_KEY="your-api-key-here"
```

```javascript
const client = new EmailListVerifyClient(process.env.EMAILLISTVERIFY_API_KEY);
```

---

## Testing

The SDK includes comprehensive test coverage:

- **85 unit tests** - Fast, mocked tests (~400ms)
- **76 integration tests** - Real API tests (~1 min)
- **Total: 161 tests** - 100% endpoint coverage

### Run Unit Tests

```bash
npm test
```

### Run Integration Tests

**⚠️ Uses real API credits (~50-100 per run)**

```bash
# 1. Set up API key
cp test-scripts/.env.example test-scripts/.env
# Edit .env and add your API key

# 2. Build the SDK
npm run build

# 3. Run integration tests
npm run test:integration
```

See [test-scripts/README.md](./test-scripts/README.md) for detailed testing documentation.

---

## API Reference

### All Methods

| Method                  | Description                      | Docs                             |
| ----------------------- | -------------------------------- | -------------------------------- |
| `verifyEmail()`         | Simple email verification        | [📖](#single-email-verification) |
| `verifyEmailDetailed()` | Detailed verification with SMTP  | [📖](#single-email-verification) |
| `createEmailJob()`      | Create async verification job    | [📖](#async-email-jobs)          |
| `getEmailJob()`         | Check async job status           | [📖](#async-email-jobs)          |
| `findContact()`         | Find contact by name/domain      | [📖](#contact-finder)            |
| `checkDisposable()`     | Check if domain is disposable    | [📖](#disposable-domain-check)   |
| `uploadBulkFile()`      | Upload CSV for bulk verification | [📖](#bulk-verification)         |
| `getBulkProgress()`     | Check bulk processing progress   | [📖](#bulk-verification)         |
| `downloadBulkResults()` | Download verification results    | [📖](#bulk-verification)         |
| `deleteBulkList()`      | Delete bulk list                 | [📖](#bulk-verification)         |
| `getCredits()`          | Get account credit balance       | [📖](#credits-management)        |

**💳 Credit Costs:** See [pricing documentation](https://emaillistverify.com/pricing) for current credit costs per operation.

### Verification Results

The `result` field can be:

- ✅ `ok` - Email is valid and deliverable
- ❌ `invalid` - Email format is invalid
- ⚠️ `unknown` - Unable to verify
- 🔄 `accept_all` - Server accepts all emails (catch-all)
- 🗑️ `disposable` - Temporary/disposable email
- 👔 `role` - Role-based email (info@, admin@)
- 📭 `email_disabled` - Email is disabled
- 💀 `dead_server` - Mail server not responding
- 🚫 `invalid_mx` - Domain has invalid MX records

---

## Best Practices

### 1. Always Handle Errors

```javascript
try {
  const result = await client.verifyEmail(email);
} catch (error) {
  if (isInsufficientCreditsError(error)) {
    // Handle no credits
  } else if (isRateLimitError(error)) {
    // Implement backoff
  }
}
```

### 2. Check Credits Before Bulk Operations

```javascript
const credits = await client.getCredits();
const available = credits.onDemand.available + (credits.subscription?.available || 0);

if (available < emailCount) {
  console.log('Not enough credits');
}
```

### 3. Use Appropriate Method

- **Single emails** → `verifyEmail()` or `verifyEmailDetailed()`
- **Background tasks** → `createEmailJob()` + `getEmailJob()`
- **Large lists (100+)** → `uploadBulkFile()` + polling

### 4. Clean Up Bulk Lists

```javascript
try {
  const results = await client.downloadBulkResults(fileId);
  // Use results
} finally {
  await client.deleteBulkList(fileId);
}
```

### 5. Implement Retry Logic

```javascript
async function verifyWithRetry(email, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await client.verifyEmail(email);
    } catch (error) {
      if (isRateLimitError(error) && i < maxRetries - 1) {
        await sleep(Math.pow(2, i) * 1000); // Exponential backoff
        continue;
      }
      throw error;
    }
  }
}
```

---

## FAQ

### What Node.js version is required?

**Node.js 20+** is required because the SDK uses the native `fetch` API.

### Does it work in browsers?

**No.** The API doesn't support CORS, so it's server-side only (Node.js).

### What's the difference between `verifyEmail()` and `verifyEmailDetailed()`?

- `verifyEmail()` - Basic verification
- `verifyEmailDetailed()` - Includes SMTP check + metadata like name, gender, country

See [pricing documentation](https://emaillistverify.com/pricing) for credit costs.

### How do I handle bulk verification for large files?

Upload with `uploadBulkFile()`, then implement polling with `getBulkProgress()`. See [examples/bulk-verification.js](./examples/bulk-verification.js).

### Does polling cost extra credits?

**No.** Checking progress with `getBulkProgress()` is free. Credits are only consumed on upload.

### What happens if my bulk file is still processing?

You'll get a `MaillistNotFinishedError` if you try to download results before processing completes.

---

---

## Support

- **Documentation:** https://www.emaillistverify.com/docs
- **Get API Key:** https://apps.emaillistverify.com/api
- **Purchase Credits:** https://apps.emaillistverify.com
- **Report Issues:** [GitHub Issues](https://github.com/yourusername/emaillistverify-sdk-js/issues)
- **Email Support:** support@emaillistverify.com

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/emaillistverify-sdk-js.git
cd emaillistverify-sdk-js

# Install dependencies
npm install

# Run tests
npm test

# Run linter
npm run lint

# Build the SDK
npm run build
```

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history and release notes.

---

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

## Acknowledgments

Built with:

- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [tsup](https://tsup.egoist.dev/) - Zero-config bundler
- [Vitest](https://vitest.dev/) - Fast unit testing
- [ESLint](https://eslint.org/) - Code linting
- [Prettier](https://prettier.io/) - Code formatting

---

**Made with ❤️ for developers by developers**

If this SDK helps you, please consider ⭐️ starring the repository!
