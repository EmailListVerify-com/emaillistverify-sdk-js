# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Nothing yet - see [v1.1.0](#110---2025-10-29) for latest release.

## [1.1.0] - 2025-10-29

### Added

**New Features:**
- ✅ Inbox Placement Test endpoints - Test where your emails land across different ESPs
  - `createPlacementTest()` - Create new inbox placement test (100 credits)
  - `getPlacementTest()` - Get placement test results with detailed breakdown
- ✅ Support for optional webhook notifications when placement tests complete
- ✅ Automatic credit refund (100 credits) if no emails are detected in placement test

**API Coverage:**
- Updated from 11 to **13 API endpoints** (complete coverage)
- Added 9 new TypeScript types for placement test functionality:
  - `PlacementTestStatus` - Test status ('running' | 'complete')
  - `PlacementLocation` - Email placement result (inbox, spam, category, waiting, missing)
  - `PlacementTestESP` - Email service provider (google, yahoo, outlook, zoho, other)
  - `PlacementTestAccountType` - Account type (personal, professional)
  - `CreatePlacementTestRequest` - Request parameters (optional name and webhookUrl)
  - `CreatePlacementTestResponse` - Test creation response with tracking code
  - `PlacementTestRecipient` - Individual recipient placement details
  - `PlacementTestSummary` - Summary percentages of placement results
  - `PlacementTestResponse` - Complete test results with recipients and summary

**Error Handling:**
- ✅ New `PlacementTestNotFoundError` class for 404 errors on placement tests
- ✅ Type guard `isPlacementTestNotFoundError()` for type-safe error handling
- Updated from 13 to **14 error classes**

**Testing:**
- ✅ Added 10 comprehensive unit tests for placement test endpoints
- Updated from 85 to **95 unit tests**
- All tests passing with 100% coverage of new functionality

**Documentation:**
- ✅ Complete README section for Inbox Placement Test with examples
- ✅ Detailed workflow explanation (create → send → poll → results)
- ✅ Credit cost and refund policy documentation
- ✅ Example code for both test creation and result polling
- ✅ Updated API reference table with new endpoints

### Changed

**Documentation Updates:**
- Updated feature count: 11 → 13 API endpoints
- Updated error count: 13 → 14 error classes
- Updated test count: 85 → 95 unit tests
- Added placement test to Table of Contents

## [1.0.1] - 2025-01-23

### Fixed

**Documentation:**
- Fixed incorrect type names in README method signatures (8 fixes):
  - `DetailedEmailVerificationResult` → `VerifyEmailDetailedResponse`
  - `EmailJob` → `CreateEmailJobResponse`
  - `EmailJobStatus` → `EmailJobResponse`
  - `FindContactResult` → `FindContactResponse`
  - `DisposableDomainResult` → `CheckDisposableResponse`
  - `BulkUploadResult` → `string`
  - `BulkProgress` → `MaillistProgressResponse`
  - `Blob` → `string | Buffer`
- Fixed incorrect examples showing non-existent fields (5 fixes):
  - `verifyEmail()` - corrected to show it returns string, not object
  - `findContact()` - fixed to show correct `ContactEmailResult` structure
  - `checkDisposable()` - corrected field names (`result` instead of `disposable`)
  - `uploadBulkFile()` - fixed to show it returns file ID string
  - `downloadBulkResults()` - corrected return type handling
- Updated support URLs:
  - API Documentation: `https://api.emaillistverify.com/api-doc`
  - Sign Up: `https://app.emaillistverify.com/signup`
  - Support email: `contact@emaillistverify.com`
- Updated package name references from `emaillistverify-sdk-js` to `@emaillistverify/sdk`
- Updated GitHub repository URLs from placeholder to `EmailListVerify-com`
- Fixed Features list formatting for npm (added blank lines between items)
- Updated TypeScript examples to use actual exported type names

**Note:** This is a documentation-only release. No code changes.

## [1.0.0] - 2025-10-23

### Added

**Core Features:**
- ✅ Complete EmailListVerify SDK with all 11 API endpoints
- ✅ Zero runtime dependencies (uses Node.js 20+ native fetch)
- ✅ Full TypeScript support with strict type safety
- ✅ Dual module format (ESM + CommonJS)
- ✅ Comprehensive error handling with 13 error classes
- ✅ 6 type guard functions for type-safe error handling

**API Endpoints:**
- `verifyEmail()` - Simple email verification
- `verifyEmailDetailed()` - Detailed verification with SMTP check
- `createEmailJob()` - Async email verification jobs
- `getEmailJob()` - Check async job status
- `findContact()` - Find contact emails by name/domain
- `checkDisposable()` - Check if domain is disposable
- `uploadBulkFile()` - Upload CSV for bulk verification
- `getBulkProgress()` - Check bulk processing progress
- `downloadBulkResults()` - Download verification results
- `deleteBulkList()` - Delete bulk lists
- `getCredits()` - Get account credit balance

**Testing:**
- ✅ 85 unit tests (mocked, fast)
- ✅ 76 integration tests (real API)
- ✅ 100% endpoint coverage
- ✅ Response structure validation

**Documentation:**
- ✅ Comprehensive README with examples
- ✅ 5 usage examples (basic, async, bulk, contact finder, error handling)
- ✅ Complete API reference
- ✅ TypeScript type definitions
- ✅ API spec issues documented
- ✅ Testing guide
- ✅ Contributing guide

**Developer Experience:**
- ✅ ESLint + Prettier configuration
- ✅ TypeScript strict mode
- ✅ Source maps for debugging
- ✅ Pre-publish checks (type-check + lint + build)

### Changed

- Complete rewrite from scratch based on Swagger/OpenAPI specification
- Updated to use correct API base URL: `https://api.emaillistverify.com`
- Modern build system using tsup (zero-config bundler)
- Migrated from Jest to Vitest for faster testing

### Fixed

- ✅ Corrected all API endpoint paths and parameters
- ✅ Fixed type definitions to match actual API responses
- ✅ Workarounds for 6 API specification issues
- ✅ Proper error handling for all HTTP status codes

### Removed

- Legacy JavaScript implementation
- Obsolete API endpoint references
- Auto-generation tooling (openapi-typescript)
- Unnecessary dependencies

## [0.1.2] - Previous Version

### Notes

- Legacy version with incomplete implementation
- Mixed TypeScript and JavaScript codebases
- Using obsolete API endpoints
- This version has been deprecated and fully rewritten

---

## Version History Legend

### Types of Changes

- `Added` for new features
- `Changed` for changes in existing functionality
- `Deprecated` for soon-to-be removed features
- `Removed` for now removed features
- `Fixed` for any bug fixes
- `Security` in case of vulnerabilities

[Unreleased]: https://github.com/EmailListVerify-com/emaillistverify-sdk-js/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/EmailListVerify-com/emaillistverify-sdk-js/releases/tag/v1.1.0
[1.0.1]: https://github.com/EmailListVerify-com/emaillistverify-sdk-js/releases/tag/v1.0.1
[1.0.0]: https://github.com/EmailListVerify-com/emaillistverify-sdk-js/releases/tag/v1.0.0
[0.1.2]: https://github.com/EmailListVerify-com/emaillistverify-sdk-js/releases/tag/v0.1.2
