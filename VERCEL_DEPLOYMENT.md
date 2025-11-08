# Vercel Deployment Guide

This guide will help you deploy your DillyDally monorepo to Vercel.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. Your repository pushed to GitHub/GitLab/Bitbucket
3. Your Convex production deployment URL: `https://friendly-condor-809.convex.cloud`

## Deployment Steps

### Step 1: Push Your Code to Git

Make sure your code is committed and pushed to your repository:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### Step 2: Deploy Frontend to Vercel

#### Option A: Using Vercel Dashboard (Recommended)

1. Go to https://vercel.com/new
2. Import your Git repository
3. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `.` (monorepo root - **IMPORTANT**: This allows access to the `convex` directory)
   - **Build Command**: Leave empty (uses `vercel.json` which runs `npx convex codegen` first)
   - **Output Directory**: Leave empty (uses `vercel.json` which points to `dillydally-frontend/dist`)
   - **Install Command**: Leave empty (uses `vercel.json`)

   **Note**: The `vercel.json` file at the monorepo root already has these settings configured. Setting root to `.` ensures Vercel can access both the frontend code and the `convex/_generated/` directory.

4. Add Environment Variables:
   - `VITE_CONVEX_URL` = `https://friendly-condor-809.convex.cloud`

5. Click "Deploy"

#### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from the monorepo root (IMPORTANT!)
cd /path/to/DillyDally  # Go to monorepo root
vercel

# Follow the prompts:
# - Link to existing project or create new
# - Set root directory to: . (monorepo root)
# - Override settings? No (use vercel.json from root)
```

**Important**: Always deploy from the monorepo root, not from `dillydally-frontend/`. This ensures Vercel can access the `convex/_generated/` directory that the frontend imports from.

### Step 3: Set Environment Variables

In your Vercel project settings:

1. Go to **Settings** → **Environment Variables**
2. Add the following variables (select all environments: Production, Preview, Development):
   - **Name**: `VITE_CONVEX_URL`
     **Value**: `https://friendly-condor-809.convex.cloud`
   - **Name**: `CONVEX_DEPLOYMENT` (optional, but helps with codegen)
     **Value**: `friendly-condor-809` (your production deployment name)

   **Important**: For `npx convex codegen` to work in CI/CD, you may need to authenticate. Options:

   **Option A (Recommended)**: Commit the generated files
   - Remove `convex/_generated/` from `.gitignore` temporarily
   - Run `npx convex codegen` locally
   - Commit the generated files
   - This way, Vercel doesn't need to run codegen

   **Option B**: Use Convex Deploy Key
   - Get a deploy key from Convex dashboard
   - Add as `CONVEX_DEPLOY_KEY` environment variable in Vercel
   - Codegen will run during build with authentication

### Step 4: Deploy Express Backend (Separate Service)

The Express backend should be deployed separately since it's a long-running server. Recommended platforms:

#### Option A: Railway (Recommended)

1. Go to https://railway.app
2. Create new project → Deploy from GitHub
3. Select your repository
4. Configure:
   - **Root Directory**: `dillydally-express`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
5. Add Environment Variables:
   - `CONVEX_URL` = `https://friendly-condor-809.convex.cloud`
   - `PORT` = (Railway sets this automatically)
   - `NODE_ENV` = `production`

#### Option B: Render

1. Go to https://render.com
2. Create new Web Service
3. Connect your repository
4. Configure:
   - **Root Directory**: `dillydally-express`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Add Environment Variables (same as Railway)

#### Option C: Fly.io

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Create app: `cd dillydally-express && fly launch`
4. Set secrets:
   ```bash
   fly secrets set CONVEX_URL=https://friendly-condor-809.convex.cloud
   fly secrets set NODE_ENV=production
   ```

### Step 5: Update CORS Settings (If Needed)

If your Express backend is on a different domain, update CORS in `dillydally-express/src/index.ts`:

```typescript
app.use(
  cors({
    origin: [
      "https://your-frontend.vercel.app",
      "http://localhost:5173", // for local dev
    ],
  })
);
```

## Post-Deployment Checklist

- [ ] Frontend is accessible at your Vercel URL
- [ ] Frontend can connect to Convex (check browser console)
- [ ] Express backend is running and accessible
- [ ] Express API endpoints respond correctly
- [ ] CORS is configured if frontend and backend are on different domains

## Troubleshooting

### Build Fails: "Cannot find module"

- Ensure `installCommand` runs from root: `cd ../.. && npm install`
- Check that all dependencies are in root `package.json` or workspace `package.json`

### Environment Variables Not Working

- Make sure `VITE_` prefix is used for frontend env vars
- Redeploy after adding environment variables
- Check Vercel logs for errors

### Convex Connection Issues

- Verify `VITE_CONVEX_URL` is set correctly
- Check Convex dashboard to ensure production deployment is active
- Ensure CORS is configured in Convex if needed

## Continuous Deployment

Once connected to Git, Vercel will automatically:

- Deploy on every push to `main` branch
- Create preview deployments for pull requests
- Run builds using your configured settings

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Turborepo with Vercel](https://turbo.build/repo/docs/guides/deploying-to-vercel)
- [Convex Hosting Guide](https://docs.convex.dev/hosting)
