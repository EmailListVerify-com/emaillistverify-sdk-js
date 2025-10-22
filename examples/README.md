# EmailListVerify SDK - Usage Examples

This directory contains practical examples demonstrating how to use the EmailListVerify SDK in real-world scenarios.

## Prerequisites

Before running these examples:

1. **Install the SDK:**
   ```bash
   npm install emaillistverify-sdk-js
   ```

2. **Set your API key:**
   ```bash
   export EMAILLISTVERIFY_API_KEY="your-api-key-here"
   ```

   Get your API key from: https://apps.emaillistverify.com/api

3. **Run examples:**
   ```bash
   node examples/basic-usage.js
   ```

---

## 📚 Available Examples

### 1. **basic-usage.js** - Getting Started
**What it covers:**
- Simple email verification
- Detailed email verification with SMTP check
- Checking if a domain is disposable
- Getting account credit balance

**When to use:**
- Learning the SDK basics
- Single email verification
- Quick disposable domain checks

**Run it:**
```bash
node examples/basic-usage.js
```

---

### 2. **async-jobs.js** - Asynchronous Verification
**What it covers:**
- Creating async verification jobs (standard & high quality)
- Checking job status
- Polling pattern for job completion
- Handling job states (pending, processing, finished, failed)

**When to use:**
- When you don't need immediate results
- Verifying emails in background tasks
- Queue-based verification systems

**Run it:**
```bash
node examples/async-jobs.js
```

---

### 3. **bulk-verification.js** - Batch Processing
**What it covers:**
- Uploading CSV files for bulk verification
- Monitoring processing progress
- Downloading results (with/without duplicates)
- Cleaning up bulk lists after processing

**When to use:**
- Verifying large email lists (100s to 1000s of emails)
- Batch email cleaning
- Database email validation

**Run it:**
```bash
node examples/bulk-verification.js
```

**Note:** This example creates temporary CSV files in the examples directory.

---

### 4. **contact-finder.js** - Email Discovery
**What it covers:**
- Finding contact emails by first name
- Finding contacts by first and last name
- Searching for specific roles (CEO, Sales, etc.)
- Handling multiple search results

**When to use:**
- Lead generation
- Finding decision-maker contacts
- Building contact lists for outreach

**Run it:**
```bash
node examples/contact-finder.js
```

---

### 5. **error-handling.js** - Robust Error Management
**What it covers:**
- Handling authentication errors (401)
- Validation error handling
- Insufficient credits (403)
- Rate limiting (429)
- Not found errors (404)
- Network errors
- Retry with exponential backoff

**When to use:**
- Building production applications
- Implementing robust error recovery
- Understanding error types and codes

**Run it:**
```bash
node examples/error-handling.js
```

---

## 🎯 Example Use Cases

### Use Case 1: Sign-up Form Validation
```javascript
import { EmailListVerifyClient } from 'emaillistverify-sdk-js';

const client = new EmailListVerifyClient(process.env.EMAILLISTVERIFY_API_KEY);

async function validateSignupEmail(email) {
  try {
    const result = await client.verifyEmail(email);

    if (result.result === 'invalid') {
      return { valid: false, message: 'Invalid email address' };
    }

    if (result.disposable) {
      return { valid: false, message: 'Disposable emails are not allowed' };
    }

    if (result.didYouMean) {
      return {
        valid: true,
        suggestion: result.didYouMean,
        message: `Did you mean ${result.didYouMean}?`
      };
    }

    return { valid: true, message: 'Email is valid' };
  } catch (error) {
    console.error('Verification error:', error);
    return { valid: false, message: 'Could not verify email' };
  }
}
```

### Use Case 2: Nightly Email List Cleaning
```javascript
import { EmailListVerifyClient } from 'emaillistverify-sdk-js';
import { readFileSync, writeFileSync } from 'fs';

const client = new EmailListVerifyClient(process.env.EMAILLISTVERIFY_API_KEY);

async function cleanEmailList(inputPath, outputPath) {
  // Upload file
  const fileBuffer = readFileSync(inputPath);
  const upload = await client.uploadBulkFile(fileBuffer, 'daily-clean.csv');

  // Poll until complete (implement with cron or queue)
  let progress;
  do {
    await sleep(60000); // Check every minute
    progress = await client.getBulkProgress(upload.fileId);
  } while (progress.status !== 'finished');

  // Download cleaned results
  const results = await client.downloadBulkResults(upload.fileId);
  const buffer = Buffer.from(await results.arrayBuffer());
  writeFileSync(outputPath, buffer);

  // Cleanup
  await client.deleteBulkList(upload.fileId);

  console.log(`Cleaned ${progress.processed} emails`);
}
```

### Use Case 3: Lead Enrichment Pipeline
```javascript
import { EmailListVerifyClient } from 'emaillistverify-sdk-js';

const client = new EmailListVerifyClient(process.env.EMAILLISTVERIFY_API_KEY);

async function enrichLead(firstName, lastName, domain) {
  // Find contact email
  const contacts = await client.findContact({
    firstName,
    lastName,
    domain,
  });

  if (contacts.emails.length === 0) {
    return { found: false };
  }

  // Verify the found email
  const email = contacts.emails[0].email;
  const verification = await client.verifyEmailDetailed(email);

  return {
    found: true,
    email,
    firstName: contacts.emails[0].firstName,
    lastName: contacts.emails[0].lastName,
    position: contacts.emails[0].position,
    verified: verification.result === 'ok',
    role: verification.role,
    disposable: verification.disposable,
  };
}
```

---

## 💡 Best Practices

### 1. Always Handle Errors
```javascript
try {
  const result = await client.verifyEmail(email);
  // Use result
} catch (error) {
  if (isInsufficientCreditsError(error)) {
    // Handle no credits
  } else if (isRateLimitError(error)) {
    // Implement backoff
  } else {
    // Handle other errors
  }
}
```

### 2. Check Credits Before Bulk Operations
```javascript
const credits = await client.getCredits();
const availableCredits = credits.onDemand.available +
  (credits.subscription?.available || 0);

if (availableCredits < emailCount) {
  console.log('Not enough credits for this operation');
}
```

### 3. Use Appropriate Verification Method
- **Single emails** → `verifyEmail()` or `verifyEmailDetailed()`
- **Background verification** → `createEmailJob()` + `getEmailJob()`
- **Large lists (100+)** → `uploadBulkFile()` + polling

### 4. Implement Retry Logic for Rate Limits
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

### 5. Clean Up Bulk Lists After Processing
```javascript
try {
  // Process bulk verification
  const results = await client.downloadBulkResults(fileId);
  // Use results
} finally {
  // Always clean up
  await client.deleteBulkList(fileId);
}
```

---

## 🔧 Configuration Options

### Custom Configuration
```javascript
const client = new EmailListVerifyClient(apiKey, {
  baseUrl: 'https://api.emaillistverify.com',
  timeout: 30000, // 30 seconds
  headers: {
    'X-Custom-Header': 'value',
  },
});
```

### Environment-Based Configuration
```javascript
const client = new EmailListVerifyClient(
  process.env.EMAILLISTVERIFY_API_KEY,
  {
    timeout: process.env.NODE_ENV === 'production' ? 60000 : 30000,
  }
);
```

---

## 📊 Credit Usage

All API operations consume credits from your account balance. For current pricing and credit costs per operation, see the official pricing documentation:

**📋 Pricing Documentation:** https://emaillistverify.com/pricing

**Note:**
- Use `getCredits()` to check your current balance (free, no credits consumed)
- Different operations have different credit costs
- Bulk verification charges per email in the uploaded file

---

## 🐛 Troubleshooting

### "EMAILLISTVERIFY_API_KEY not found"
**Solution:** Set your API key as an environment variable:
```bash
export EMAILLISTVERIFY_API_KEY="your-key-here"
```

### "Module not found" errors
**Solution:** Install the SDK first:
```bash
npm install emaillistverify-sdk-js
```

### "Insufficient credits" error
**Solution:** Check your balance and purchase more credits:
```javascript
const credits = await client.getCredits();
console.log('Available:', credits.onDemand.available);
```

### Rate limit exceeded (429)
**Solution:** Implement exponential backoff or reduce request frequency.

---

## 📖 Additional Resources

- **API Documentation:** https://docs.emaillistverify.com
- **Get API Key:** https://apps.emaillistverify.com/api
- **SDK Repository:** https://github.com/yourusername/emaillistverify-sdk-js
- **Report Issues:** https://github.com/yourusername/emaillistverify-sdk-js/issues

---

## 🤝 Contributing Examples

Have a useful example? Contributions are welcome!

1. Create a new `.js` file in `examples/`
2. Follow the existing code style
3. Add comprehensive comments
4. Update this README
5. Submit a pull request

---

**Happy Email Verifying! 🚀**
