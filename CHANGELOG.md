# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Nothing yet - see [v1.0.0](#100---2025-10-23) for latest release.

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

[Unreleased]: https://github.com/EmailListVerify-com/emaillistverify-sdk-js/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/EmailListVerify-com/emaillistverify-sdk-js/releases/tag/v1.0.0
[0.1.2]: https://github.com/EmailListVerify-com/emaillistverify-sdk-js/releases/tag/v0.1.2
