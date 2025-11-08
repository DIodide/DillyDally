import express from "express";
import cors from "cors";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api.js";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load environment variables from the root .env.local file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../../.env.local") });

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Convex client
const convexUrl = process.env.CONVEX_URL;
if (!convexUrl) {
  console.error("Error: CONVEX_URL is not set in .env.local");
  console.error(
    "Please run `npx convex dev` from the monorepo root to configure."
  );
  process.exit(1);
}

const convexClient = new ConvexHttpClient(convexUrl);

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "DillyDally Express API is running",
    convexConnected: !!convexUrl,
  });
});

// Example endpoint that queries Convex
app.get("/api/tasks", async (req, res) => {
  try {
    const tasks = await convexClient.query(api.tasks.get, {});
    res.json({ success: true, tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch tasks from Convex",
    });
  }
});

app
  .listen(PORT, () => {
    console.log(`🚀 Express server running on http://localhost:${PORT}`);
    console.log(`📊 Convex URL: ${convexUrl}`);
  })
  .on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(`❌ Port ${PORT} is already in use.`);
      console.error(
        `   Please stop the process using port ${PORT} or set a different PORT.`
      );
      console.error(
        `   To find and kill the process: lsof -ti:${PORT} | xargs kill -9`
      );
      process.exit(1);
    } else {
      console.error("❌ Server error:", err);
      process.exit(1);
    }
  });
