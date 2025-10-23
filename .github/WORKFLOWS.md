# GitHub Actions Workflows

This project uses GitHub Actions for CI/CD automation with a two-branch strategy.

## Branch Strategy

```
develop (work branch)
    ↓
  [PR] ← CI runs (tests, lint, build)
    ↓
master (production)
    ↓
  [Auto] → npm publish + GitHub release
```

---

## Workflows

### 1. CI Workflow (`ci.yml`)

**Triggers:**
- Push to `develop` branch
- Pull requests to `develop` or `master`

**Jobs:**

1. **Lint & Type Check** (Node 20)
   - ESLint
   - TypeScript type checking
   - Prettier format check

2. **Unit Tests** (Node 20, 21, 22 matrix)
   - 85 unit tests
   - Tests across multiple Node versions

3. **Build Package** (Node 20)
   - Builds ESM + CJS outputs
   - Verifies package contents
   - Uploads build artifacts (7 days retention)

**Duration:** ~2-3 minutes

---

### 2. Publish Workflow (`publish.yml`)

**Triggers:**
- Push to `master` branch (after PR merge)

**Jobs:**

1. **Version Check**
   - Verifies `package.json` version was bumped
   - Fails if version not changed
   - Outputs version for next jobs

2. **Publish Package** (if version changed)
   - Runs all CI checks (lint, test, build)
   - Publishes to npm registry
   - Creates Git tag (e.g., `v1.0.0`)
   - Creates GitHub release with notes

**Duration:** ~3-4 minutes

**⚠️ Version Check:**
If you merge to master without bumping the version, the workflow will fail with:
```
❌ Error: Version in package.json was not bumped!
Please run 'npm version patch|minor|major' before merging to master.
```

---

## Setup Instructions

### 1. Configure GitHub Secrets

Go to: **Repository Settings → Secrets and variables → Actions → New repository secret**

Add these secrets:

| Secret Name | Value | How to Get |
|-------------|-------|------------|
| `NPM_TOKEN` | Your npm publish token | [npm access tokens](https://www.npmjs.com/settings/YOUR_USERNAME/tokens) |

**Creating npm token:**
1. Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Click "Generate New Token" → "Classic Token"
3. Select "Automation" type
4. Copy token and add to GitHub secrets

**Note:** `GITHUB_TOKEN` is automatically provided by GitHub Actions.

---

### 2. Configure Branch Protection Rules

**For `master` branch:**

Go to: **Repository Settings → Branches → Add rule**

Configure:
- ✅ **Require pull request before merging**
  - ✅ Require approvals: 1 (optional, if team)
  - ✅ Dismiss stale reviews
- ✅ **Require status checks to pass**
  - ✅ Require branches to be up to date
  - Select checks: `Lint & Type Check`, `Unit Tests`, `Build Package`
- ✅ **Include administrators** (recommended)

**For `develop` branch (optional):**
- ✅ Require status checks (same as master)
- No PR requirement (can push directly)

---

## Developer Workflow

### Daily Development

```bash
# Work on develop branch
git checkout develop
git pull origin develop

# Make changes
# ... edit files ...

# Push to develop (CI runs automatically)
git add .
git commit -m "feat: add new feature"
git push origin develop
```

**CI runs:** Lint → Tests → Build (2-3 min)

---

### Releasing a New Version

**Step 1: Bump version on develop**

```bash
# Ensure you're on develop and up to date
git checkout develop
git pull origin develop

# Bump version (choose one)
npm version patch  # 1.0.0 → 1.0.1 (bug fixes)
npm version minor  # 1.0.0 → 1.1.0 (new features)
npm version major  # 1.0.0 → 2.0.0 (breaking changes)

# This creates a commit: "1.0.1" and updates package.json + package-lock.json
```

**Step 2: Update CHANGELOG.md**

```bash
# Edit CHANGELOG.md manually
# Move items from [Unreleased] to new version section

# Commit the changelog
git add CHANGELOG.md
git commit -m "docs: update CHANGELOG for v1.0.1"
```

**Step 3: Push to develop**

```bash
git push origin develop
```

**Step 4: Create PR to master**

```bash
# On GitHub: Create Pull Request
# From: develop
# To: master
# Title: "Release v1.0.1"
```

**Step 5: Merge PR (triggers publish)**

Once CI passes and PR is approved:
- ✅ Merge PR to master
- ✅ Publish workflow runs automatically
- ✅ Package published to npm
- ✅ Git tag created (v1.0.1)
- ✅ GitHub release created

**Done!** 🎉 Your package is live on npm!

---

## Workflow Status Badges

Add to README.md:

```markdown
[![CI](https://github.com/YOUR_ORG/emaillistverify-sdk-js/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_ORG/emaillistverify-sdk-js/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/emaillistverify-sdk-js.svg)](https://www.npmjs.com/package/emaillistverify-sdk-js)
```

---

## Troubleshooting

### ❌ "Version not bumped" error

**Problem:** You merged to master without bumping package.json version.

**Solution:**
1. Revert the merge or create hotfix branch
2. Run `npm version patch`
3. Commit and push
4. Create new PR to master

---

### ❌ "npm publish failed - version already exists"

**Problem:** Trying to publish a version that's already on npm.

**Solution:**
1. Check current npm version: `npm view emaillistverify-sdk-js version`
2. Bump to a higher version: `npm version patch`
3. Push and merge again

---

### ❌ "NPM_TOKEN invalid"

**Problem:** npm authentication token is invalid or expired.

**Solution:**
1. Generate new token at https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Update `NPM_TOKEN` secret in GitHub repository settings
3. Re-run workflow

---

### ❌ CI tests failing

**Problem:** Tests, linting, or build failing in CI.

**Solution:**
1. Run locally first:
   ```bash
   npm run lint
   npm run type-check
   npm test
   npm run build
   ```
2. Fix all issues locally
3. Push again

---

## Manual Alternatives

If you prefer manual control for some steps:

### Manual npm Publish

Instead of automatic publish, you can publish manually:

1. **Disable `publish.yml` workflow:**
   - Rename to `publish.yml.disabled`

2. **Publish manually after merge:**
   ```bash
   git checkout master
   git pull origin master
   npm run prepublishOnly  # Runs checks + build
   npm publish --access public
   git tag v1.0.1
   git push origin v1.0.1
   ```

### Manual GitHub Releases

If you disabled auto-release:

1. Go to: **Repository → Releases → Draft a new release**
2. Choose tag: Create new tag `v1.0.1`
3. Title: `Release v1.0.1`
4. Copy content from CHANGELOG.md
5. Publish release

---

## Best Practices

✅ **Always bump version before merging to master**
✅ **Update CHANGELOG.md for every release**
✅ **Run tests locally before pushing**
✅ **Never skip CI checks**
✅ **Review PR before merging to master**
✅ **Test package after publish:** `npm install emaillistverify-sdk-js@latest`

---

## Workflow Files

- `.github/workflows/ci.yml` - CI checks (develop + PRs)
- `.github/workflows/publish.yml` - Publish to npm (master only)
- `.github/WORKFLOWS.md` - This documentation

---

**Questions?** Open an issue or contact the SDK team.
