# Contributing to EmailListVerify SDK

Thank you for your interest in contributing to the EmailListVerify SDK for JavaScript/TypeScript!

## Development Setup

### Prerequisites

- Node.js >= 20.0.0
- npm >= 9

### Getting Started

```bash
# Clone the repository
git clone https://github.com/EmailListVerify-com/emaillistverify-sdk-js.git
cd emaillistverify-sdk-js

# Install dependencies
npm install

# Run tests
npm test
```

## Development Commands

### Building

```bash
# Build ESM + CJS bundles
npm run build

# Build in watch mode (auto-rebuild on changes)
npm run dev
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Code Quality

```bash
# Type checking
npm run type-check

# Lint code
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Format code
npm run format

# Check formatting without changes
npm run format:check
```

### Pre-publish Checks

```bash
# Run all checks (type-check + lint + build)
npm run prepublishOnly
```

## Project Structure

```
emaillistverify-sdk-js/
├── src/
│   ├── index.ts              # Main entry point
│   ├── types/                # TypeScript type definitions
│   │   └── index.ts          # Exported types
│   ├── endpoints/            # API endpoint implementations
│   ├── utils/                # Utility functions
│   │   ├── errors.ts         # Custom error classes
│   │   └── http.ts           # HTTP client wrapper
├── tests/                    # Test files
├── examples/                 # Usage examples
├── dist/                     # Built output (generated)
│   ├── index.js              # ESM build
│   ├── index.cjs             # CommonJS build
│   └── index.d.ts            # Type declarations
```

## Type Definitions

Types are manually defined based on the EmailListVerify OpenAPI specification located at `../api-doc-json.json`.

When the API changes, update types in `src/types/index.ts` to reflect the new schema.

## Coding Standards

- **TypeScript**: Use strict mode, leverage type safety
- **Formatting**: Prettier (single quotes, 2 spaces, 100 line width)
- **Linting**: ESLint with TypeScript rules
- **Naming**:
  - Classes: `PascalCase`
  - Functions/variables: `camelCase`
  - Constants: `UPPER_SNAKE_CASE`
  - Types/Interfaces: `PascalCase`

## Testing

- Write tests for all public APIs
- Use descriptive test names
- Aim for high test coverage
- Test both success and error cases

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```
feat(client): add support for async email jobs
fix(types): correct VerificationResult enum values
docs(readme): update installation instructions
```

## Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Run `npm run prepublishOnly` to verify build
4. Create git tag: `git tag v1.0.0`
5. Push: `git push && git push --tags`
6. Publish: `npm publish`

## Questions?

- Open an issue: https://github.com/EmailListVerify-com/emaillistverify-sdk-js/issues
- Email: support@emaillistverify.com
