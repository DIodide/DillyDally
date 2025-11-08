# Deployment Guide

## Frontend Deployment to Vercel

### Important: Vercel Monorepo Configuration

For Vercel to access the `convex` folder, you have two options:

#### Option 1: Deploy from Monorepo Root (Recommended)

1. **In Vercel Dashboard**:
   - Set **Root Directory** to: `dillydally-frontend` (in Project Settings → General)
   - This allows Vercel to see the parent `convex` folder during build

2. **Environment Variables**:
   - Add `VITE_CONVEX_URL` with your Convex deployment URL
   - You can find this in your `.env.local` file or Convex dashboard

3. **Build Process**:
   - The `copy-convex` script will automatically find and copy `convex/_generated`
   - The build will then proceed normally

#### Option 2: Pre-build Step (Alternative)

If Option 1 doesn't work, you can add a build step that generates the Convex files:

1. Add a Vercel build command that runs Convex generation:
   ```json
   {
     "buildCommand": "npx convex codegen && npm run copy-convex && npm run build"
   }
   ```

### Prerequisites

1. **Deploy Convex first** (if not already deployed):
   ```bash
   npx convex deploy
   ```

2. **Get your Convex URL**:
   - Check `.env.local` file: `CONVEX_URL=...`
   - Or find it in the Convex dashboard

### Local Development

Run from the monorepo root:
```bash
npm run dev
```

Or individually:
```bash
# Terminal 1: Convex (generates _generated folder)
npx convex dev

# Terminal 2: Frontend
cd dillydally-frontend
npm run dev
```

## Express Deployment

The Express server uses the same approach:

1. **Build Process**:
   - `npm run build` automatically runs `copy-convex` first
   - This copies `convex/_generated` to `src/lib/convex-generated`

2. **Environment Variables**:
   - Set `CONVEX_URL` in your deployment platform
   - Ensure `.env.local` is not committed (it's in `.gitignore`)

3. **Deployment Platforms**:
   - **Railway**: Set root directory to `dillydally-express`
   - **Render**: Set root directory to `dillydally-express`
   - **Heroku**: Use a `Procfile` that runs `npm run build && npm start`

### Troubleshooting

**Issue**: `convex/_generated` not found during build
- **Solution**: Make sure `npx convex dev` or `npx convex deploy` has been run at least once
- The `_generated` folder is created when Convex generates TypeScript types

**Issue**: Import errors in TypeScript
- **Solution**: The copy script runs before TypeScript compilation, so this should resolve after the first successful build
- If errors persist, check that the copy script completed successfully

**Issue**: Vercel can't find convex folder
- **Solution**: Ensure Root Directory is set correctly in Vercel settings, or use Option 2 above with `npx convex codegen`

