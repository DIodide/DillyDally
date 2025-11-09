# DillyDally  
### **See your focus. Improve your focus.**

DillyDally is a next-generation, AI-powered Pomodoro system that doesn’t just track **how long** you work — it helps you understand **how well** you were able to focus. Traditional productivity timers assume that time spent = progress. But in a world of constant interruptions, simply measuring time is no longer enough.

DillyDally passively monitors subtle indicators of attention (like tab switching or gaze drift) and uses an LLM to generate **personalized Focus Reports** at the end of every work session — helping you understand your distraction patterns and train deeper focus.

Focus isn’t a timer.  
**Focus is a trainable skill.**  
DillyDally helps you develop it.

---

## The Problem
Most Pomodoro timers only record **time spent**, not **focus quality**.

Which means you can complete 4 sessions and still feel like:
- Nothing meaningful got done
- You were fighting distractions the whole time
- You have no idea *why* your attention slipped

**Focus leaks are invisible. DillyDally makes them visible.**

---

## Our Solution
DillyDally adds **intelligent reflection** to the Pomodoro method:

1. Start a session.
2. The client periodically captures small, privacy-safe context signals.
3. The backend generates **micro-insights** using an LLM.
4. At session end, micro-insights are aggregated into a **Focus Report**, showing:
   - Moments of deep focus
   - Distraction triggers
   - Behavior patterns
   - Personalized recommendations

This creates a **feedback loop**, turning ordinary Pomodoros into skill-building sessions.

---

## How It Works

DillyDally transforms each focus session into a **feedback loop** that surfaces your attention behavior.

### High-Level Flow

```mermaid
flowchart LR
    subgraph Frontend (React + Vite)
        A[Start Session]
        B[Timer Running]
        C[Capture Focus Signals
(tab switches, optional gaze cues)]
        D[End Session]
    end

    subgraph Backend (Express.js)
        E[Receive Signals & Optional Images]
        F[LLM Generates Micro-Insights]
        G[Return Insight Chunks]
    end

    subgraph Convex (Database + Functions)
        H[Store Micro-Insights]
        I[Aggregate into Session Summary]
        J[Serve Focus Report to UI]
    end

    A --> B --> C --> E --> F --> G --> H --> I --> J --> D
```

### What Counts as a Focus Signal?
- Tab or window change
- Periods of inactivity
- Optional: periodic low-frequency screenshot (user-controlled, opt-in)
- Context: What app, task, or environment you were working in

### How the Report Is Generated
1. Signals are timestamped and sent to the backend.
2. Backend calls an LLM to interpret the moment as a **micro-insight**.
3. Micro-insights accumulate throughout the session.
4. At the end, they are merged into a structured **Session Focus Report**.

The system never shames or scores you — it reflects your **actual attention behavior** and suggests ways to improve.

---


---

## What Makes DillyDally Different

| Traditional Productivity Tools | **DillyDally** |
|---|---|
| Only track time | Measures *quality* of focus |
| No awareness of distraction patterns | Detects attention drift + context triggers |
| No personalized learning | Generates supportive AI reflections & guidance |
| Treat focus as fixed | Treats focus as a *skill that improves* |

DillyDally is not a timer —  
**it’s a coach for your attention.**

---

## Monorepo Architecture

```
DillyDally/
├── convex/                     # Shared Convex backend functions
│   ├── schema.ts              # Database schema
│   ├── tasks.ts               # Query/mutation logic
│   └── tsconfig.json
├── dillydally-frontend/       # React + Vite frontend
│   ├── src/
│   │   ├── App.tsx           
│   │   └── main.tsx          
│   └── vite.config.ts
├── dillydally-express/        # Express.js backend server
│   ├── src/index.ts          
│   ├── package.json
│   └── tsconfig.json
├── package.json               # Workspace configuration
└── sampleData.jsonl           # Example import data
```

### Tech Stack

| Layer | Technology |
|------|------------|
| Frontend UI | React 19 + TypeScript + Vite |
| Backend API | Express.js + Node |
| Database / Realtime Backend | **Convex** (Backend-as-a-Service) |
| AI Processing | OpenAI / Anthropic LLM |
| Dev Utilities | TSX, Concurrently, ESLint |

---

## Features

- AI-generated **Focus Reports**
- Live Pomodoro-style session timer
- Automatic attention-drift detection
- Micro-insight logging per session
- Real-time data and app reactivity via Convex
- Monorepo sharing backend logic between services
- Fully typed end-to-end system

---

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Initialize Convex
```bash
npx convex dev
```
This will:
- Prompt GitHub login
- Create `.env.local` with `CONVEX_URL`
- Generate `/convex/_generated` types

### 3. Configure Frontend Environment
Create `dillydally-frontend/.env.local`:
```
VITE_CONVEX_URL=<your-convex-url>
```

### 4. Run All Services Together
```bash
npm run dev
```

| Service | URL |
|--------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001 |
| Convex dev server | Cloud-hosted |

### Run Services Individually
```bash
npx convex dev
npm run dev --workspace=dillydally-frontend
npm run dev --workspace=dillydally-express
```

---

## API Endpoints (Express)

### GET `/`
```json
{
  "status": "ok",
  "message": "DillyDally Express API is running",
  "convexConnected": true
}
```

### GET `/api/tasks`
```json
{
  "success": true,
  "tasks": [
    { "_id": "...", "text": "Buy groceries", "isCompleted": true }
  ]
}
```

---

## Convex Functions

### Schema (`schema.ts`)
```ts
tasks: {
  text: string,
  isCompleted: boolean
}
```

### Query (`api.tasks.get`)
Returns all tasks.

---

## Development Workflow

| Task | Work In |
|------|--------|
| UI + Interactions | `dillydally-frontend/src/` |
| API logic | `dillydally-express/src/` |
| Database / backend logic | `convex/` |

Convex automatically syncs & regenerates types live.

---

## Troubleshooting

| Issue | Fix |
|------|-----|
| `CONVEX_URL` missing | Ensure `npx convex dev` was run once |
| Missing Convex types | Run Convex dev server |
| Express cannot connect | Ensure `.env.local` exists in repo root |
| Ports in use | Change via Vite config or `PORT` env var |

---

## Production Deployment

### Frontend
```bash
npm run build --workspace=dillydally-frontend
```

### Backend
```bash
npm run build --workspace=dillydally-express
npm run start --workspace=dillydally-express
```

### Convex Deploy
```bash
npx convex deploy
```

---

### **See your focus. Improve your focus.**

```
Built with intention, curiosity, and deep work energy ✨☕
HackPrinceton 2025
```
