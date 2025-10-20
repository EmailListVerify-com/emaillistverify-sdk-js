# EmailListVerify SDK for JavaScript/TypeScript

Official JavaScript/TypeScript SDK for the EmailListVerify API - Email validation and verification service.

## Installation

```bash
npm install @emaillistverify/sdk
# or
yarn add @emaillistverify/sdk
# or
pnpm add @emaillistverify/sdk
```

## Quick Start

```javascript
import EmailListVerify from '@emaillistverify/sdk';
// or for CommonJS
// const EmailListVerify = require('@emaillistverify/sdk');

const client = new EmailListVerify('YOUR_API_KEY');

// Verify a single email
const result = await client.verifyEmail('test@example.com');
console.log(result);
// {
//   email: 'test@example.com',
//   result: 'ok',
//   isValid: true,
//   isDisposable: false,
//   isRole: false,
//   isCatchAll: false
// }

// Verify multiple emails
const bulkResult = await client.verifyBulk([
  'valid@gmail.com',
  'invalid@fake.com',
  'info@example.com'
]);
console.log(bulkResult);
// {
//   results: [...],
//   processed: 3,
//   valid: 1,
//   invalid: 2
// }
```

## TypeScript Support

This SDK includes full TypeScript support with type definitions:

```typescript
import EmailListVerify, {
  EmailVerificationResult,
  EmailVerificationResponse,
  BulkVerificationResponse,
  EmailListVerifyError
} from '@emaillistverify/sdk';

const client = new EmailListVerify('YOUR_API_KEY');

try {
  const result: EmailVerificationResponse = await client.verifyEmail('test@example.com');
  
  if (result.isValid) {
    console.log('Email is valid!');
  }
  
  if (result.isDisposable) {
    console.log('Email is disposable');
  }
} catch (error) {
  if (error instanceof EmailListVerifyError) {
    console.error(`Error: ${error.message}, Code: ${error.code}`);
  }
}
```

## API Reference

### Constructor

```typescript
new EmailListVerify(apiKey: string, options?: { baseUrl?: string })
```

- `apiKey` - Your EmailListVerify API key (required)
- `options.baseUrl` - Custom API base URL (optional)

### Methods

#### `verifyEmail(email: string): Promise<EmailVerificationResponse>`

Verifies a single email address.

**Returns:**
```typescript
{
  email: string;
  result: EmailVerificationResult;
  isValid: boolean;
  isDisposable: boolean;
  isRole: boolean;
  isCatchAll: boolean;
}
```

#### `verifyBulk(emails: string[]): Promise<BulkVerificationResponse>`

Verifies multiple email addresses in bulk.

**Returns:**
```typescript
{
  results: EmailVerificationResponse[];
  processed: number;
  valid: number;
  invalid: number;
}
```

#### `getCredits(): Promise<number | null>`

Gets remaining API credits.

### Result Types

The `result` field can be one of:
- `ok` - Email is valid
- `invalid` - Email format is invalid
- `invalid_mx` - Domain has invalid MX records
- `accept_all` / `ok_for_all` - Server accepts all emails (catch-all)
- `disposable` - Temporary/disposable email
- `role` - Role-based email (info@, admin@, etc.)
- `email_disabled` - Email is disabled
- `dead_server` - Mail server not responding
- `unknown` - Unable to verify

### Error Handling

The SDK throws `EmailListVerifyError` for API errors:

```javascript
try {
  const result = await client.verifyEmail('test@example.com');
} catch (error) {
  if (error instanceof EmailListVerifyError) {
    switch (error.code) {
      case 'AUTH_ERROR':
        console.error('Invalid API key');
        break;
      case 'RATE_LIMIT':
        console.error('Rate limit exceeded');
        break;
      case 'API_ERROR':
        console.error('API error:', error.message);
        break;
    }
  }
}
```

## Examples

### Check if email is safe to send

```javascript
const result = await client.verifyEmail('user@example.com');

if (result.isValid && !result.isDisposable && !result.isRole) {
  // Safe to send
  console.log('Email is safe to send to');
} else {
  // Not recommended
  console.log('Email may have deliverability issues');
}
```

### Bulk verification with filtering

```javascript
const emails = [
  'user1@gmail.com',
  'user2@tempmail.com',
  'admin@company.com'
];

const bulkResult = await client.verifyBulk(emails);

const validEmails = bulkResult.results
  .filter(r => r.isValid && !r.isDisposable)
  .map(r => r.email);

console.log('Valid emails:', validEmails);
```

## Support

- Documentation: https://emaillistverify.com/docs
- Issues: https://github.com/emaillistverify/emaillistverify-sdk-js/issues
- Email: support@emaillistverify.com

## License

MIT