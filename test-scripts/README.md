# EmailListVerify SDK Tests

This directory contains comprehensive test suites for the EmailListVerify SDK:

- **Unit Tests** - Fast, mocked tests (85 tests, ~400ms)
- **Integration Tests** - Real API tests (76 tests, ~1 min)

---

## 🚀 Quick Start

### Unit Tests (Recommended for Development)

```bash
# Run all unit tests (fast, no API calls)
npm test

# Run in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

### Integration Tests (Manual Validation)

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

---

## 📁 Test Structure

```
test-scripts/
├── unit/                           # Unit tests (mocked fetch)
│   ├── client.test.ts             # Client tests (39 tests)
│   ├── errors.test.ts             # Error tests (30 tests)
│   └── http.test.ts               # HTTP tests (21 tests)
├── node-integration.mjs           # Integration tests (76 tests)
├── test-data/
│   └── sample-emails.csv          # Test data for bulk upload
├── .env.example                   # Example environment config
└── README.md                      # This file
```

---

## 🧪 Unit Tests (85 Tests)

### Overview

Unit tests use **Vitest** with **mocked fetch** responses. These verify SDK logic without making real API calls.

### What Gets Tested

#### ✅ Client Tests (`client.test.ts` - 39 tests)

**Constructor:**
- Client instantiation with API key
- Custom configuration (baseUrl, timeout, headers)
- API key validation

**All 11 Endpoints:**
- `verifyEmail()` - Simple verification
- `verifyEmailDetailed()` - Detailed verification
- `createEmailJob()` - Async job creation
- `getEmailJob()` - Job status checking
- `findContact()` - Contact email finding
- `checkDisposable()` - Disposable domain check
- `uploadBulkFile()` - CSV file upload (Buffer & Blob)
- `getBulkProgress()` - Bulk processing progress
- `downloadBulkResults()` - Download results
- `deleteBulkList()` - Delete bulk list
- `getCredits()` - Account credit balance

**Error Handling:**
- 401 AuthenticationError
- Network errors
- Timeout errors
- Validation errors

#### ✅ HTTP Client Tests (`http.test.ts` - 21 tests)

**Request Methods:**
- GET requests with query parameters
- POST requests with JSON body
- POST requests with FormData
- DELETE requests

**Response Handling:**
- JSON responses
- Error responses (401, 404, 429, 500)
- Network failures
- Timeout handling
- Parse errors

**Headers & Parameters:**
- User-Agent header generation
- Custom headers
- API key injection
- Parameter merging
- URL encoding

#### ✅ Error Classes (`errors.test.ts` - 30 tests)

**All Error Types:**
- EmailListVerifyError (base class)
- AuthenticationError (401)
- ForbiddenError, InsufficientCreditsError, TooManyJobsError (403)
- NotFoundError, EmailJobNotFoundError, MaillistNotFoundError (404)
- BadRequestError, InvalidFileError, MaillistNotFinishedError (400)
- RateLimitError (429)
- NetworkError, TimeoutError, ValidationError, ParseError (client-side)

**Type Guards:**
- `isAuthenticationError()`
- `isInsufficientCreditsError()`
- `isRateLimitError()`
- `isNotFoundError()`
- `isNetworkError()`
- `isValidationError()`

### Mock Strategy

```typescript
beforeEach(() => {
  global.fetch = vi.fn();
});

// Mock successful response
(global.fetch as any).mockResolvedValueOnce({
  ok: true,
  status: 200,
  headers: new Headers({ 'content-type': 'application/json' }),
  json: async () => ({ success: true }),
});

// Mock error response
(global.fetch as any).mockResolvedValueOnce({
  ok: false,
  status: 401,
  headers: new Headers({ 'content-type': 'application/json' }),
  json: async () => ({ statusCode: 401, message: 'Unauthorized' }),
});

// Mock network error
(global.fetch as any).mockRejectedValueOnce(new TypeError('Network failed'));
```

### Debugging Unit Tests

```bash
# Run specific test file
npm test client.test.ts

# Run tests matching a pattern
npm test -- -t "verifyEmail"

# Run with verbose output
npm test -- --reporter=verbose
```

---

## 🌐 Integration Tests (76 Tests)

### Overview

Integration tests validate the SDK against the **real EmailListVerify API**, including both functional testing AND response structure validation.

### ⚠️ Important Notes

- **Uses real API credits** (~50-100 credits per full run)
- **NOT run automatically** in CI/CD
- **Excluded from npm package** (not distributed to users)
- **Use for manual validation** before releases

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

## 💰 Credit Usage

**⚠️ Integration tests use real API credits.**

The exact number of credits consumed depends on the operations tested and current pricing. For accurate credit costs per operation, see:

**📋 Pricing Documentation:** https://emaillistverify.com/pricing

**Approximate total:** The full integration test suite typically consumes 50-100 credits per run, depending on:
- Number of emails verified
- Use of standard vs high quality verification
- Contact finder searches performed
- Bulk file size (sample file has 5 emails)

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

## 🆚 Unit vs Integration Tests Comparison

| Aspect | Unit Tests | Integration Tests |
|--------|-----------|-------------------|
| **Speed** | ⚡ **Fast** (~400ms) | 🐌 Slow (~1 min+) |
| **API Calls** | ❌ **Mocked** | ✅ Real |
| **Credits Used** | **0** | ~50-100 |
| **Setup Required** | None (just `npm test`) | API key + build |
| **Coverage** | Logic & error paths | End-to-end & API contract |
| **Response Validation** | Mock structure | Real API responses |
| **When to Run** | **Every commit** | Before releases |
| **CI/CD** | ✅ **Yes** (automated) | ❌ No (manual) |
| **Debugging** | ✅ **Easy** (fast feedback) | Slower (network delays) |

### When to Use Each

**Use Unit Tests for:**
- ✅ Development (fast feedback loop)
- ✅ Continuous Integration
- ✅ Testing error handling logic
- ✅ Testing validation logic
- ✅ Refactoring confidence

**Use Integration Tests for:**
- ✅ Pre-release validation
- ✅ Verifying API contract hasn't changed
- ✅ Testing real network/timing issues
- ✅ Validating response structure matches types
- ✅ End-to-end workflow testing

### Best Practice Workflow

```bash
# During development (fast iteration)
npm test                    # Run unit tests

# Before committing
npm test                    # Verify unit tests pass
npm run type-check          # Verify types
npm run lint                # Verify code quality

# Before releasing
npm run build               # Build the SDK
npm run test:integration    # Run integration tests (uses credits!)
```

---

## 🎯 Test Summary

**Total Test Coverage: 161 Tests**

- ✅ **85 Unit Tests** (fast, mocked)
  - 39 client tests
  - 30 error tests
  - 21 HTTP tests
  - 5 skipped (blob mocking complexity)

- ✅ **76 Integration Tests** (real API)
  - All 11 endpoints tested
  - Response validation for all types
  - Polling functionality verified
  - 100% endpoint coverage

**Quality Metrics:**
- ✅ Zero TypeScript errors
- ✅ Zero linting issues
- ✅ Zero runtime dependencies
- ✅ 100% endpoint coverage
- ✅ 6 API spec issues documented

---

**Happy Testing! 🚀**
