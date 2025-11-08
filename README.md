# DillyDally Monorepo

A full-stack task management application with React frontend, Express.js backend, and Convex as the backend-as-a-service platform.

## Project Structure

```
DillyDally/
├── convex/                     # Shared Convex backend functions
│   ├── schema.ts              # Database schema definitions
│   ├── tasks.ts               # Task query/mutation functions
│   └── tsconfig.json          # TypeScript config for Convex
├── dillydally-frontend/       # React + Vite frontend
│   ├── src/
│   │   ├── App.tsx           # Main app component with Convex integration
│   │   └── main.tsx          # Entry point with ConvexProvider
│   └── vite.config.ts        # Vite config with convex alias
├── dillydally-express/        # Express.js backend
│   ├── src/
│   │   └── index.ts          # Express server with Convex client
│   ├── package.json
│   └── tsconfig.json
├── package.json               # Root workspace configuration
└── sampleData.jsonl          # Sample data for initial import
```

## Features

- **Shared Convex Backend**: Single source of truth accessible by both frontend and backend
- **React Frontend**: Modern React app with TypeScript and Vite
- **Express Backend**: REST API server with Convex integration
- **Monorepo Setup**: Workspaces-based monorepo with concurrent dev servers
- **Type Safety**: Full TypeScript support across all projects

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- A GitHub account (for Convex authentication)

## Setup Instructions

### 1. Install Dependencies

From the monorepo root, install all dependencies:

```bash
npm install
```

This will install dependencies for the root and all workspaces (frontend and backend).

### 2. Initialize Convex

Run the Convex development server to create your deployment:

```bash
npx convex dev
```

This will:
- Prompt you to log in with GitHub
- Create a new Convex project
- Generate the `.env.local` file with your `CONVEX_URL`
- Create the `convex/_generated/` folder with type definitions
- Watch for changes to your Convex functions

### 3. Import Sample Data

Once Convex is running, in a new terminal, import the sample tasks:

```bash
npx convex import --table tasks sampleData.jsonl
```

### 4. Configure Environment Variables

**For the Frontend:**

Create `dillydally-frontend/.env.local`:

```env
VITE_CONVEX_URL=<your-convex-url-from-root-.env.local>
```

Or simply copy the CONVEX_URL from the root `.env.local` and prefix it with `VITE_`.

**For the Backend:**

The Express backend will automatically read from the root `.env.local` file.

## Running the Application

### Start All Services (Recommended)

From the monorepo root, run:

```bash
npm run dev
```

This will start all three services concurrently with colored output:
- **[convex]** (blue): Convex development server on the cloud
- **[frontend]** (green): Vite dev server at `http://localhost:5173`
- **[backend]** (yellow): Express server at `http://localhost:3001`

### Start Services Individually

If you prefer to run services separately:

**Convex:**
```bash
npx convex dev
```

**Frontend:**
```bash
npm run dev --workspace=dillydally-frontend
```

**Backend:**
```bash
npm run dev --workspace=dillydally-express
```

## API Endpoints

### Express Backend

- **GET /** - Health check endpoint
  ```json
  {
    "status": "ok",
    "message": "DillyDally Express API is running",
    "convexConnected": true
  }
  ```

- **GET /api/tasks** - Get all tasks from Convex
  ```json
  {
    "success": true,
    "tasks": [
      {
        "_id": "...",
        "text": "Buy groceries",
        "isCompleted": true
      }
    ]
  }
  ```

## Convex Functions

### Queries

- **`api.tasks.get`** - Fetches all tasks from the database

### Schema

```typescript
tasks: {
  text: string,
  isCompleted: boolean
}
```

## Development Workflow

1. **Make changes to Convex functions**: Edit files in `convex/` folder
2. **Frontend development**: Work in `dillydally-frontend/src/`
3. **Backend development**: Work in `dillydally-express/src/`
4. **Hot reload**: All services support hot module replacement

The Convex dev server will automatically push your changes to the cloud and regenerate types.

## Building for Production

### Frontend

```bash
npm run build --workspace=dillydally-frontend
```

Output will be in `dillydally-frontend/dist/`

### Backend

```bash
npm run build --workspace=dillydally-express
npm run start --workspace=dillydally-express
```

### Convex

Deploy your Convex functions to production:

```bash
npx convex deploy
```

## Troubleshooting

### Convex URL not found

Make sure you've run `npx convex dev` and that the `.env.local` file was created in the root directory.

### Frontend can't find Convex types

Ensure the Convex dev server is running. It generates the types in `convex/_generated/`.

### Express server can't connect to Convex

Check that:
1. The root `.env.local` exists and has the `CONVEX_URL`
2. The Express server is loading the environment variables correctly

### Port already in use

If ports 5173 (frontend) or 3001 (backend) are in use, you can change them:
- Frontend: Add `--port <number>` to the dev script
- Backend: Set `PORT` environment variable

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Express.js, TypeScript, Node.js
- **Database & Backend**: Convex (BaaS)
- **Dev Tools**: TSX, Concurrently, ESLint

## Learn More

- [Convex Documentation](https://docs.convex.dev)
- [React Documentation](https://react.dev)
- [Express Documentation](https://expressjs.com)
- [Vite Documentation](https://vitejs.dev)

## License

MIT

