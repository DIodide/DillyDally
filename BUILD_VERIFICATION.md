# Build Verification Checklist

This document verifies that all build steps work correctly for Vercel deployment.

## ✅ Verified Components

### 1. Vercel Configuration (`vercel.json`)
- **Location**: Monorepo root (`.`)
- **Root Directory**: `.` (monorepo root) - ✅ Allows access to `convex/` directory
- **Build Command**: `npx convex codegen && npm run build --workspace=dillydally-frontend` - ✅ Tested locally
- **Output Directory**: `dillydally-frontend/dist` - ✅ Verified exists after build
- **Install Command**: `npm install` - ✅ Runs first, then build command

### 2. Path Resolution
- **Frontend imports**: `../../../convex/_generated/api` from `dillydally-frontend/src/lib/convexApi.ts`
- **Path calculation**: From monorepo root, this resolves correctly - ✅ Verified
- **Vite config**: Has alias `@convex` pointing to `../convex` - ✅ Configured correctly

### 3. Build Process Flow
1. **Install**: `npm install` (installs all workspace dependencies) - ✅ Works
2. **Codegen**: `npx convex codegen` (generates Convex types) - ✅ Works locally
3. **Build**: `npm run build --workspace=dillydally-frontend` - ✅ Produces `dist/` folder

### 4. Output Verification
- **Build output**: `dillydally-frontend/dist/` contains:
  - `index.html` - ✅ Present
  - `assets/` directory - ✅ Present
  - All static files - ✅ Generated correctly

## ⚠️ Potential Issues & Solutions

### Issue 1: Convex Codegen Authentication in CI/CD

**Problem**: `convex/_generated/` is in `.gitignore`, so files aren't in repo. `npx convex codegen` might need authentication in Vercel CI.

**Solutions**:

**Solution A (Recommended)**: Commit generated files
```bash
# Temporarily remove from .gitignore
# Edit .gitignore, comment out: convex/_generated/
git add convex/_generated/
git commit -m "Add Convex generated files for CI/CD"
```

**Solution B**: Use Convex Deploy Key
1. Get deploy key from Convex dashboard
2. Add `CONVEX_DEPLOY_KEY` to Vercel environment variables
3. Codegen will authenticate during build

**Solution C**: Update vercel.json to skip codegen if files exist
```json
{
  "buildCommand": "npx convex codegen || true && npm run build --workspace=dillydally-frontend"
}
```
(This is a workaround - not recommended)

### Issue 2: Workspace Dependencies

**Status**: ✅ Verified - All dependencies are correctly installed via `npm install` at root

### Issue 3: TypeScript Compilation

**Status**: ✅ Verified - `tsc -b` runs successfully before Vite build

## 🧪 Local Build Test

Run this to test the exact Vercel build process:

```bash
# From monorepo root
npm install
npx convex codegen
npm run build --workspace=dillydally-frontend

# Verify output
ls -la dillydally-frontend/dist/
```

Expected output:
- `index.html`
- `assets/` directory with CSS and JS files
- `vite.svg` (if in public folder)

## 📋 Pre-Deployment Checklist

- [ ] Code is pushed to Git repository
- [ ] `vercel.json` is at monorepo root
- [ ] Environment variables are set in Vercel:
  - [ ] `VITE_CONVEX_URL` = production Convex URL
  - [ ] `CONVEX_DEPLOYMENT` = deployment name (optional)
  - [ ] `CONVEX_DEPLOY_KEY` = deploy key (if using Solution B)
- [ ] Vercel project root directory is set to `.` (monorepo root)
- [ ] Convex generated files are either:
  - [ ] Committed to Git (Solution A), OR
  - [ ] Deploy key is configured (Solution B)

## 🔍 Build Command Breakdown

```bash
# Step 1: Install (runs automatically via installCommand)
npm install
# Installs all dependencies including workspace packages

# Step 2: Generate Convex types
npx convex codegen
# Generates convex/_generated/api.js and api.d.ts
# These are imported by the frontend

# Step 3: Build frontend
npm run build --workspace=dillydally-frontend
# Runs: tsc -b && vite build
# Outputs to: dillydally-frontend/dist/
```

## ✅ All Systems Verified

The build process has been tested locally and all components work correctly. The only consideration is ensuring Convex codegen can run in CI/CD (see Issue 1 solutions above).

