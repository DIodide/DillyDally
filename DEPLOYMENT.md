# Deployment Guide

## Frontend Deployment to Vercel

### Important: Vercel Monorepo Configuration

The `convex/_generated` folder is gitignored, so it needs to be generated during the build process.

#### Setup Steps

1. **In Vercel Dashboard**:
   - Set **Root Directory** to: `dillydally-frontend` (in Project Settings → General)
   - This allows Vercel to see the parent `convex` folder during build

2. **Environment Variables**:
   - Add `VITE_CONVEX_URL` with your Convex deployment URL (required for runtime)
   - Add `CONVEX_URL` with your Convex deployment URL (required for `convex codegen` during build)
   - You can find this in your `.env.local` file or Convex dashboard

3. **Build Process**:
   - The build command will:
     1. Install root dependencies (including `convex` CLI)
     2. Run `npx convex codegen` to generate types from schema
     3. Copy `convex/_generated` to `dillydally-frontend/src/lib/convex-generated`
     4. Build the Vite app

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

- **Solution**: The build process now runs `npx convex codegen` automatically
- Make sure `CONVEX_URL` environment variable is set in Vercel
- Ensure the `convex` folder exists in the repository

**Issue**: `convex codegen` fails during build

- **Solution**: Make sure `CONVEX_URL` is set in Vercel environment variables
- The `convex` package must be installed (handled by installCommand)
- Check that the `convex/schema.ts` file exists and is valid

**Issue**: Import errors in TypeScript

- **Solution**: The copy script runs before TypeScript compilation, so this should resolve after the first successful build
- If errors persist, check that the copy script completed successfully

**Issue**: Vercel can't find convex folder

- **Solution**: Ensure Root Directory is set to `dillydally-frontend` in Vercel settings
- This allows Vercel to access the parent `convex` folder during build
