# Comprehensive Integration Tests

This directory contains comprehensive integration tests that validate the SDK against the real EmailListVerify API, including both functional testing AND response structure validation.

## ⚠️ Important Notes

- **These tests use real API credits** (~50-100 credits per full run)
- **These tests are NOT run automatically** in CI/CD
- **These tests are excluded from npm package** (not distributed to users)
- **Use for manual validation** before releases

---

## 🚀 Quick Start

### 1. Set up API Key

```bash
# Copy the example env file
cp test-scripts/.env.example test-scripts/.env

# Edit .env and add your API key
# Get your key from: https://apps.emaillistverify.com/api
```

### 2. Build the SDK

```bash
npm run build
```

### 3. Run Tests

```bash
node test-scripts/node-integration.mjs
```

---

## 📋 What Gets Tested

### ✅ **Functional Testing** (Does it work?)
Tests all SDK methods work correctly with the real API

### ✅ **Response Validation** (Does it match our types?)
Validates **ALL fields** in API responses match our TypeScript interfaces

### Endpoints Tested:

**Client & Configuration:**
- Client instantiation
- API key validation
- Error handling

**Single Email Verification:**
- `verifyEmail()` - Simple verification
- `verifyEmailDetailed()` - Detailed verification + **14-field validation**

**Async Email Jobs:**
- `createEmailJob()` - Create async job
- `getEmailJob()` - Check job status + **8-field validation**

**Contact Finder:**
- `findContact()` - Find contact emails + **array structure validation**

**Disposable Check:**
- `checkDisposable()` - Check if domain is disposable + **5-field validation**

**Bulk Operations:**
- `uploadBulkFile()` - Upload CSV file (Node.js Buffer)
- `getBulkProgress()` - Check upload progress + **progress object validation**
- `downloadBulkResults()` - Download results (if finished)
- `deleteBulkList()` - Delete list (if finished)

**Credits:**
- `getCredits()` - Get account credit balance + **credits structure validation**

**Error Handling:**
- AuthenticationError (401)
- NotFoundError/500 handling (API bug documented)
- ValidationError (client-side)

---

## ⏱️ Polling Feature (Test-Only)

### Why Polling in Tests?

The bulk upload feature requires polling to achieve **100% endpoint coverage** (11/11 endpoints). Without polling, we cannot test `downloadBulkResults()` and `deleteBulkList()` because bulk processing takes time to complete.

### ⚠️ Important: Polling is TEST-ONLY

**The SDK itself does NOT include polling helpers.** Here's why:

- Production bulk jobs can take **4+ hours** to process (thousands of emails)
- Polling for 4 hours is impractical and wasteful
- Users should implement queue-based or cron-based checking instead

### How Test Polling Works

The test script includes a `waitForBulkCompletion()` helper that:

1. **Polls every 5 seconds** to check bulk processing status
2. **Times out after 3 minutes** (acceptable for 5-email test file)
3. **Enables testing of:**
   - `downloadBulkResults()` - Downloads completed results
   - `deleteBulkList()` - Cleans up test data

### Polling Code Example (Test-Only)

```javascript
async function waitForBulkCompletion(client, fileId, maxWaitMs = 180000) {
  const startTime = Date.now();
  const pollInterval = 5000; // 5 seconds

  while (Date.now() - startTime < maxWaitMs) {
    const progress = await client.getBulkProgress(fileId);
    console.log(`📊 Progress: ${progress.progress}% (${progress.status})`);

    if (progress.status === 'finished') return progress;
    if (progress.status === 'error') throw new Error('Bulk processing failed');

    await sleep(pollInterval);
  }

  throw new Error(`Timeout after ${maxWaitMs}ms`);
}
```

### Credit Impact

**Polling does NOT consume extra credits** - it only uses time. Credits are consumed by:
- Initial bulk file upload (based on number of emails)
- Checking progress is free
- Downloading results is free

---

## 📊 Test Results

Results are saved to `test-scripts/results/` with **TWO files per run:**

```
test-scripts/results/
├── test-report-1698765432123.json      # Test execution report
├── full-responses-1698765432123.json   # All API responses
└── ...
```

**test-report-*.json** includes:
- Test execution details
- Pass/fail status for each test
- Error messages and stack traces
- Validation errors (field mismatches)
- Credits used estimate
- Execution time

**full-responses-*.json** includes:
- Complete API responses for ALL endpoints
- Useful for debugging and inspection
- Can verify response structure manually

---

## 💰 Credit Usage Estimate

| Test | Credits | Notes |
|------|---------|-------|
| verifyEmail | 1-2 | Per email tested |
| verifyEmailDetailed | 1 | Per email |
| createEmailJob | 1-2 | Standard=1, High=2 |
| findContact | 5-10 | Depends on params |
| checkDisposable | 1-2 | Per domain |
| uploadBulkFile | 5 | For sample CSV (5 emails) |
| getCredits | 0 | Free |
| **Total per run** | **~50-100** | Approximate |

---

## 🔍 What to Look For

### ✅ Expected: All tests should pass
- Client creates successfully
- All endpoints return valid responses
- Error handling works correctly
- Types match API responses

### ⚠️ Watch Out For:
- **FormData compatibility** - Critical for file uploads
- **Buffer handling** - Node.js specific
- **Response parsing** - JSON vs text vs binary
- **Error classification** - Correct error types thrown

### 🐛 Common Issues:
1. **File upload fails** → Check FormData/Buffer handling
2. **401 errors** → Check API key in .env
3. **Timeouts** → Increase timeout or check network
4. **Type errors** → API response structure changed

---

## 🌐 Browser Testing (Future)

A separate browser test app will be created to test:
- File upload with Blob (not Buffer)
- FormData in browser environment
- CORS if applicable
- Browser-specific APIs

---

## 📝 Adding New Tests

To add a new test:

1. Create a test function:
```javascript
async function testMyFeature(client) {
  console.log('\n🧪 Testing My Feature...');

  try {
    const result = await client.myMethod();
    logTest('myMethod()', 'pass', { response: result });
  } catch (error) {
    logTest('myMethod()', 'fail', { error: error.message });
  }
}
```

2. Add to test runner:
```javascript
async function runTests() {
  // ... existing tests
  await testMyFeature(client);
}
```

---

## 🤝 Contributing

When adding new SDK features:
1. Add corresponding integration test
2. Update this README
3. Run tests locally before committing
4. Document credit usage

---

## 📚 Related Files

- `test-data/sample-emails.csv` - Test data for bulk upload
- `.env.example` - Example environment configuration
- `.gitignore` - Excludes .env and results/ from git
- `results/` - Test execution results (not committed)

---

## ❓ Troubleshooting

### "EMAILLISTVERIFY_API_KEY not found"
→ Create `.env` file from `.env.example` and add your API key

### "Cannot find module '../dist/index.js'"
→ Run `npm run build` first to build the SDK

### "Timeout after 30000ms"
→ Network issue or API slow - increase timeout in test script

### "File upload fails in Node.js"
→ Check FormData compatibility - this is a known potential issue

---

## 🎯 Next Steps

After Node.js tests pass:
1. ✅ Document any bugs found
2. ✅ Fix implementation issues
3. ✅ Update API_SPEC_ISSUES.md if API bugs found
4. 🌐 Create browser test app
5. ✅ Write unit tests based on learnings
6. 📚 Update main README with examples

---

**Happy Testing! 🚀**
