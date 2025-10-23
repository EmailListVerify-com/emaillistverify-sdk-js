# Release Checklist

Quick reference for releasing a new version of the SDK.

## Pre-Release Checklist

- [ ] All features/fixes merged to `develop`
- [ ] All tests passing locally (`npm test`)
- [ ] No linting errors (`npm run lint`)
- [ ] No type errors (`npm run type-check`)
- [ ] Build succeeds (`npm run build`)
- [ ] Integration tests run manually (optional, uses API credits)

---

## Release Steps

### 1. Version Bump

```bash
# On develop branch
git checkout develop
git pull origin develop

# Choose semantic version bump
npm version patch  # Bug fixes: 1.0.0 → 1.0.1
npm version minor  # New features: 1.0.0 → 1.1.0
npm version major  # Breaking changes: 1.0.0 → 2.0.0
```

This updates:
- `package.json` version
- `package-lock.json` version
- Creates git commit with version number

---

### 2. Update CHANGELOG

```bash
# Edit CHANGELOG.md
nano CHANGELOG.md  # or use your editor

# Move items from [Unreleased] to new version section
# Example:
## [Unreleased]
Nothing yet

## [1.0.1] - 2025-10-23
### Fixed
- Bug fix description

# Commit
git add CHANGELOG.md
git commit -m "docs: update CHANGELOG for v1.0.1"
```

---

### 3. Push & Verify CI

```bash
# Push to develop
git push origin develop

# Verify CI passes
# Go to: https://github.com/YOUR_ORG/emaillistverify-sdk-js/actions
```

Wait for CI to complete (~2-3 minutes):
- ✅ Lint & Type Check
- ✅ Unit Tests (Node 20, 21, 22)
- ✅ Build Package

---

### 4. Create Release PR

**On GitHub:**

1. Go to **Pull Requests** → **New Pull Request**
2. Base: `master` ← Compare: `develop`
3. Title: `Release v1.0.1`
4. Description:
   ```markdown
   ## Release v1.0.1

   ### Changes
   - Feature/fix 1
   - Feature/fix 2

   ### Checklist
   - [x] Version bumped in package.json
   - [x] CHANGELOG.md updated
   - [x] All tests passing
   - [x] CI checks passing

   See [CHANGELOG.md](./CHANGELOG.md) for full release notes.
   ```

---

### 5. Review & Merge

- [ ] Wait for CI checks to pass
- [ ] Review changes one final time
- [ ] Get approval (if required)
- [ ] **Merge Pull Request** (use "Merge commit" or "Squash and merge")

---

### 6. Verify Auto-Publish

After merge, the publish workflow runs automatically:

**Monitor:** https://github.com/YOUR_ORG/emaillistverify-sdk-js/actions

**Workflow steps:**
1. ✅ Version check (ensures version was bumped)
2. ✅ Run all CI checks
3. ✅ Publish to npm
4. ✅ Create Git tag (v1.0.1)
5. ✅ Create GitHub release

**Duration:** ~3-4 minutes

---

### 7. Verify Publication

**Check npm:**
```bash
npm view emaillistverify-sdk-js version
# Should show: 1.0.1

npm info emaillistverify-sdk-js
# Verify package info
```

**Check GitHub:**
- Go to **Releases** → Should see new release `v1.0.1`
- Go to **Tags** → Should see tag `v1.0.1`

**Test installation:**
```bash
# In a test directory
npm install emaillistverify-sdk-js@latest

# Verify version
node -e "console.log(require('emaillistverify-sdk-js/package.json').version)"
```

---

## Post-Release Tasks

- [ ] Update develop branch:
  ```bash
  git checkout develop
  git merge master
  git push origin develop
  ```
- [ ] Announce release (if applicable):
  - Twitter/social media
  - Documentation site
  - Email newsletter
- [ ] Monitor for issues:
  - GitHub issues
  - npm download stats
  - User feedback

---

## Hotfix Release (Emergency)

If you need to release a critical fix quickly:

### Option 1: Hotfix Branch

```bash
# Create hotfix branch from master
git checkout master
git pull origin master
git checkout -b hotfix/critical-bug-fix

# Make fix
# ... edit files ...

# Bump patch version
npm version patch

# Update CHANGELOG
# Commit changes
git add .
git commit -m "fix: critical bug"

# Push
git push origin hotfix/critical-bug-fix

# Create PR to master
# Merge → Auto-publish
```

### Option 2: Direct to Master (Emergency Only)

```bash
# On master branch
git checkout master
git pull origin master

# Make fix
# Bump version
npm version patch

# Update CHANGELOG
git add CHANGELOG.md
git commit -m "docs: update CHANGELOG"

# Push (triggers publish)
git push origin master
```

⚠️ **Then merge master back to develop:**
```bash
git checkout develop
git merge master
git push origin develop
```

---

## Rollback (if publish fails)

### If npm publish fails:

1. Fix the issue locally
2. Bump version again: `npm version patch`
3. Repeat release process

### If need to unpublish (within 72 hours):

```bash
# ⚠️ DANGEROUS - Only use if absolutely necessary
npm unpublish emaillistverify-sdk-js@1.0.1

# Then fix and re-publish with bumped version
npm version patch
# ... repeat release
```

### If need to deprecate version:

```bash
npm deprecate emaillistverify-sdk-js@1.0.1 "This version has a critical bug. Please upgrade to 1.0.2"
```

---

## Version Numbering Guide

### Semantic Versioning (MAJOR.MINOR.PATCH)

**PATCH (1.0.0 → 1.0.1)** - Bug fixes only
```bash
npm version patch
```
- ✅ Bug fixes
- ✅ Documentation updates
- ✅ Internal refactoring
- ❌ No API changes
- ❌ No new features

**MINOR (1.0.0 → 1.1.0)** - New features (backward compatible)
```bash
npm version minor
```
- ✅ New features
- ✅ New API methods
- ✅ New optional parameters
- ✅ Deprecations (with warnings)
- ❌ No breaking changes

**MAJOR (1.0.0 → 2.0.0)** - Breaking changes
```bash
npm version major
```
- ✅ Breaking API changes
- ✅ Removed deprecated features
- ✅ Changed method signatures
- ✅ Changed error behavior
- ⚠️ Requires migration guide

---

## Quick Commands Reference

```bash
# Check current version
npm version

# View published versions
npm view emaillistverify-sdk-js versions

# Check latest published version
npm view emaillistverify-sdk-js version

# Test package locally
npm pack
# Creates: emaillistverify-sdk-1.0.0.tgz
# Test in another project:
# npm install /path/to/emaillistverify-sdk-1.0.0.tgz

# View package contents
npm pack --dry-run

# Check what will be published
npm publish --dry-run
```

---

## Troubleshooting

### "Version not bumped" error

You forgot to run `npm version patch/minor/major`.

**Fix:**
```bash
git checkout develop
npm version patch
git push origin develop
# Create new PR
```

---

### "Version already exists on npm"

You tried to publish a version that already exists.

**Fix:**
```bash
npm version patch  # Bump to next version
# Update CHANGELOG
# Push and merge again
```

---

### CI tests failing

**Fix:**
```bash
npm run lint       # Fix linting errors
npm run type-check # Fix type errors
npm test          # Fix failing tests
npm run build     # Fix build errors

# Commit fixes and push
```

---

### Forgot to update CHANGELOG

**Fix:**
```bash
git checkout develop
# Edit CHANGELOG.md
git add CHANGELOG.md
git commit -m "docs: update CHANGELOG"
git push origin develop
# Create new PR or amend existing one
```

---

## Tips

💡 **Test before release:** Always run full test suite locally before releasing

💡 **Batch changes:** Group multiple small fixes into one release rather than releasing too frequently

💡 **Clear CHANGELOG:** Write release notes thinking about users, not developers

💡 **Monitor after release:** Watch for issues in the first 24 hours after release

💡 **Version tags:** Git tags are automatically created - don't create them manually

---

**Need help?** See [WORKFLOWS.md](.github/WORKFLOWS.md) for detailed documentation.
