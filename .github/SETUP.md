# GitHub Actions Setup Guide

## 🎯 What Was Created

Your repository now has automated CI/CD with two GitHub Actions workflows:

### 1. **CI Workflow** (`.github/workflows/ci.yml`)
- **Triggers:** Every push to `develop`, every PR to `develop` or `master`
- **Purpose:** Automated quality checks
- **Jobs:**
  - **Lint & Type Check** - ESLint, TypeScript, Prettier
  - **Unit Tests** - 85 tests across Node 20, 21, 22
  - **Build** - Verifies package builds correctly

### 2. **Publish Workflow** (`.github/workflows/publish.yml`)
- **Triggers:** Push to `master` (after PR merge)
- **Purpose:** Automated npm publishing
- **Jobs:**
  - **Version Check** - Ensures version was bumped
  - **Publish** - Runs all checks → publishes to npm → creates release

---

## ⚙️ Setup Instructions (5 minutes)

### Step 1: Create npm Token

1. Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Click **"Generate New Token"** → **"Classic Token"**
3. Select **"Automation"** type
4. Give it a name: `GitHub Actions - emaillistverify-sdk-js`
5. **Copy the token** (you won't see it again!)

### Step 2: Add Token to GitHub

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Name: `NPM_TOKEN`
5. Value: Paste the npm token from Step 1
6. Click **"Add secret"**

### Step 3: Configure Branch Protection (Recommended)

1. Go to **Settings** → **Branches** → **Add branch protection rule**

2. **For `master` branch:**
   - Branch name pattern: `master`
   - ✅ **Require a pull request before merging**
     - Required approvals: 1 (optional if solo developer)
   - ✅ **Require status checks to pass before merging**
     - ✅ Require branches to be up to date before merging
     - Search and select:
       - `Lint & Type Check`
       - `Unit Tests (20)`
       - `Build Package`
   - ✅ **Include administrators** (recommended)
   - Click **"Create"**

3. **For `develop` branch (optional):**
   - Branch name pattern: `develop`
   - ✅ **Require status checks to pass** (same as above)
   - ⬜ No PR requirement needed (you can push directly)

### Step 4: Test the Workflows

```bash
# Create develop branch (if not exists)
git checkout -b develop
git push -u origin develop

# Make a test change
echo "# Test" >> .github/TEST.md
git add .github/TEST.md
git commit -m "test: verify CI workflow"
git push origin develop
```

**Check:** Go to **Actions** tab → You should see CI workflow running

---

## 📋 Daily Workflow

### Normal Development

```bash
# Work on develop
git checkout develop
git pull origin develop

# Make changes
# ... edit files ...

# Push (CI runs automatically)
git commit -am "feat: add new feature"
git push origin develop
```

✅ CI runs: Lint → Tests → Build (~2 min)

### Releasing New Version

```bash
# 1. Bump version
npm version patch  # or minor/major

# 2. Update CHANGELOG
nano CHANGELOG.md  # Edit release notes

# 3. Commit and push
git add CHANGELOG.md
git commit -m "docs: update CHANGELOG"
git push origin develop

# 4. Create PR on GitHub
# From: develop → To: master

# 5. Merge PR
# ✅ Auto-publishes to npm!
```

📖 **Detailed guide:** See [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md)

---

## 🔄 Workflow Diagram

```
Developer pushes to develop
         ↓
    [CI Workflow]
    - Lint & Type Check
    - Unit Tests (Node 20, 21, 22)
    - Build Package
         ↓
    ✅ All checks pass
         ↓
Developer creates PR: develop → master
         ↓
    [CI runs again on PR]
         ↓
    ✅ PR approved & merged
         ↓
    [Publish Workflow]
    1. Check version bumped ⚠️
    2. Run all CI checks
    3. Publish to npm
    4. Create Git tag
    5. Create GitHub release
         ↓
    ✅ Package live on npm!
```

---

## ⚠️ Important Notes

### Version Bumping is Required

Before merging to `master`, you **must** bump the version:

```bash
npm version patch  # 1.0.0 → 1.0.1
npm version minor  # 1.0.0 → 1.1.0
npm version major  # 1.0.0 → 2.0.0
```

If you forget, the publish workflow will **fail** with:
```
❌ Error: Version in package.json was not bumped!
Please run 'npm version patch|minor|major' before merging to master.
```

### Semantic Versioning Guide

- **PATCH** (`npm version patch`) - Bug fixes only
- **MINOR** (`npm version minor`) - New features (backward compatible)
- **MAJOR** (`npm version major`) - Breaking changes

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| [WORKFLOWS.md](./WORKFLOWS.md) | Complete workflow documentation |
| [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md) | Step-by-step release guide |
| [SETUP.md](./SETUP.md) | This file - initial setup |

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] npm token added to GitHub secrets
- [ ] Branch protection rules configured (optional but recommended)
- [ ] CI workflow runs on push to develop
- [ ] Test release:
  - [ ] Bump version on develop
  - [ ] Create PR to master
  - [ ] CI passes on PR
  - [ ] Merge PR
  - [ ] Publish workflow runs
  - [ ] Package published to npm
  - [ ] GitHub release created
  - [ ] Git tag created

---

## 🆘 Troubleshooting

### CI Workflow Not Running

**Check:**
1. Workflow files are in `.github/workflows/` directory
2. Files are named `ci.yml` and `publish.yml` (exact names)
3. You pushed to `develop` or created a PR

### Publish Workflow Fails - "NPM_TOKEN invalid"

**Fix:**
1. Check token in **Settings → Secrets**
2. Verify token type is **"Automation"** on npm
3. Generate new token if needed
4. Update GitHub secret

### "Version not bumped" Error

**Fix:**
```bash
git checkout develop
npm version patch
git push origin develop
# Create new PR to master
```

### Tests Failing in CI

**Fix:**
```bash
# Run locally first
npm run lint
npm run type-check
npm test
npm run build

# Fix all errors
# Push again
```

---

## 🎓 Learn More

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)

---

## 🚀 You're Ready!

Your CI/CD pipeline is now set up and ready to use!

**Next steps:**
1. Complete the setup checklist above
2. Read [WORKFLOWS.md](./WORKFLOWS.md) for detailed info
3. Use [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md) when releasing
4. Start developing! 🎉

**Questions?** Open an issue or contact the team.
