# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial project structure with TypeScript, ESLint, and Prettier
- Build configuration using tsup (ESM + CJS outputs)
- Testing framework with Vitest
- Minimal `EmailListVerifyClient` class placeholder
- Development documentation (CONTRIBUTING.md)

### Changed

- Complete rewrite from scratch based on OpenAPI specification
- Updated to use correct API base URL: `https://api.emaillistverify.com`

### Removed

- Legacy JavaScript implementation
- Obsolete API endpoint references
- Auto-generation tooling (openapi-typescript)

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

[Unreleased]: https://github.com/EmailListVerify-com/emaillistverify-sdk-js/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/EmailListVerify-com/emaillistverify-sdk-js/releases/tag/v0.1.2
