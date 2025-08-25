# EmailListVerify TypeScript SDK

A comprehensive TypeScript/JavaScript SDK for the EmailListVerify API, providing email verification services with full type safety.

## Features

- ✅ **Full TypeScript support** with comprehensive type definitions
- 🚀 **Simple and intuitive API** - easy to integrate
- 📧 **Single email verification** - verify individual email addresses
- 📊 **Bulk verification** - process large lists of emails efficiently
- 📁 **CSV file processing** - upload and process CSV files
- 🔄 **Progress tracking** - monitor bulk verification progress
- ⚡ **Rate limiting** - built-in protection against API limits
- 🛡️ **Error handling** - comprehensive error management
- 📝 **Detailed responses** - get comprehensive verification data

## Installation

```bash
npm install emaillistverify-sdk
```

## Quick Start

```typescript
import { EmailListVerifyClient } from 'emaillistverify-sdk';

const client = new EmailListVerifyClient('YOUR_API_KEY');

// Verify single email
const result = await client.verifyEmail('test@example.com');
console.log(result.status); // 'ok', 'failed', 'unknown', or 'error'

// Verify multiple emails
const emails = ['email1@example.com', 'email2@example.com'];
const results = await client.verifyBatch(emails);
```

## API Reference

### EmailListVerifyClient

#### Constructor

```typescript
new EmailListVerifyClient(apiKey: string, options?: EmailListVerifyOptions)
```

- `apiKey`: Your EmailListVerify API key
- `options.timeout`: Request timeout in milliseconds (default: 30000)

#### Methods

##### `verifyEmail(email: string): Promise<VerificationResult>`

Verify a single email address.

```typescript
const result = await client.verifyEmail('test@example.com');
console.log(result);
// {
//   email: 'test@example.com',
//   status: 'ok',
//   timestamp: '2023-07-01T12:00:00.000Z'
// }
```

##### `verifyEmailDetailed(email: string): Promise<DetailedVerificationResult>`

Get detailed verification information.

```typescript
const result = await client.verifyEmailDetailed('test@example.com');
console.log(result);
// {
//   email: 'test@example.com',
//   status: 'ok',
//   timestamp: '2023-07-01T12:00:00.000Z',
//   disposable: false,
//   role: false,
//   free: true,
//   syntax: true,
//   dns: true,
//   mx: true,
//   smtp: true
// }
```

##### `verifyBatch(emails: string[], maxBatchSize?: number): Promise<VerificationResult[]>`

Verify multiple emails in batches.

```typescript
const emails = ['email1@example.com', 'email2@example.com'];
const results = await client.verifyBatch(emails);
results.forEach(result => {
  console.log(`${result.email}: ${result.status}`);
});
```

##### `bulkUpload(filePath: string, filename?: string): Promise<string>`

Upload a CSV file for bulk verification.

```typescript
const fileId = await client.bulkUpload('emails.csv');
console.log('File uploaded:', fileId);
```

##### `getBulkStatus(fileId: string): Promise<BulkStatus>`

Check the status of a bulk verification job.

```typescript
const status = await client.getBulkStatus(fileId);
console.log(`Progress: ${status.progress}%`);
```

##### `downloadBulkResult(fileId: string, resultType?: 'all' | 'clean'): Promise<string>`

Download bulk verification results.

```typescript
const results = await client.downloadBulkResult(fileId, 'all');
// Save results to file
await fs.writeFile('results.csv', results);
```

##### `waitForBulkCompletion(fileId: string, options?: WaitOptions): Promise<BulkStatus>`

Wait for bulk verification to complete with progress tracking.

```typescript
const finalStatus = await client.waitForBulkCompletion(fileId, {
  checkInterval: 10,
  maxWait: 3600,
  onProgress: (status) => {
    console.log(`Progress: ${status.progress}%`);
  }
});
```

##### `getCredits(): Promise<CreditsInfo>`

Get account credits information.

```typescript
const credits = await client.getCredits();
console.log(`Available credits: ${credits.credits}`);
```

### EmailValidator

Static utility methods for email validation.

```typescript
import { EmailValidator } from 'emaillistverify-sdk';

// Check syntax
EmailValidator.isValidSyntax('test@example.com'); // true

// Extract domain
EmailValidator.extractDomain('test@example.com'); // 'example.com'

// Extract username
EmailValidator.extractUsername('test@example.com'); // 'test'

// Check if disposable
EmailValidator.isDisposableDomain('tempmail.com'); // true

// Check if role email
EmailValidator.isRoleEmail('admin@company.com'); // true

// Normalize email
EmailValidator.normalize('  Test@EXAMPLE.COM  '); // 'test@example.com'
```

### BulkVerificationManager

High-level manager for bulk operations.

```typescript
import { BulkVerificationManager } from 'emaillistverify-sdk';

const manager = new BulkVerificationManager(client);

// Process CSV file with progress tracking
const jobInfo = await manager.processCsvFile(
  'input.csv',
  'output.csv',
  true, // wait for completion
  (status) => console.log(`Progress: ${status.progress}%`)
);
```

## Type Definitions

### VerificationStatus

```typescript
type VerificationStatus = 'ok' | 'failed' | 'unknown' | 'error';
```

### VerificationResult

```typescript
interface VerificationResult {
  email: string;
  status: VerificationStatus;
  timestamp: string;
  error?: string;
}
```

### DetailedVerificationResult

```typescript
interface DetailedVerificationResult extends VerificationResult {
  reason?: string;
  disposable?: boolean;
  role?: boolean;
  free?: boolean;
  syntax?: boolean;
  dns?: boolean;
  mx?: boolean;
  smtp?: boolean;
  catch_all?: boolean;
  score?: number;
  user?: string;
  domain?: string;
}
```

### BulkStatus

```typescript
interface BulkStatus {
  file_id: string;
  status: 'processing' | 'completed' | 'failed' | 'queued';
  progress?: number;
  total?: number;
  processed?: number;
  valid?: number;
  invalid?: number;
  unknown?: number;
  error?: string;
  created_at?: string;
  completed_at?: string;
}
```

## Error Handling

The SDK provides proper error handling with typed exceptions:

```typescript
import { EmailListVerifyException } from 'emaillistverify-sdk';

try {
  const result = await client.verifyEmail('test@example.com');
} catch (error) {
  if (error instanceof EmailListVerifyException) {
    console.error('API Error:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npm run typecheck
```

## Examples

Check the `examples/` directory for comprehensive usage examples:

- Single email verification
- Batch processing
- Bulk file processing
- Progress tracking
- Error handling
- Stream processing
- Multiple job management

## License

MIT

## Support

For support, please contact support@emaillistverify.com or visit our [documentation](https://emaillistverify.com/docs/).
