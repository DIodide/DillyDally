import express from "express";
import cors from "cors";
import multer from "multer";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api.js";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { promises as fs } from "fs";
import OpenAI from "openai";

// Load environment variables from both the root .env.local file and the project directory's .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../../.env.local") });
dotenv.config({ path: join(__dirname, "../.env.local") });

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Convex client
const convexUrl = process.env.CONVEX_URL;
if (!convexUrl) {
  console.error("Error: CONVEX_URL is not set in .env.local");
  console.error("Please run `npx convex dev` from the monorepo root to configure.");
  process.exit(1);
}

const convexClient = new ConvexHttpClient(convexUrl);

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for memory storage with 2MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
});

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

// Screenshot upload endpoint
app.post("/api/screenshots", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image file provided" });
  }

  try {
    // Convert buffer to base64 (for future OpenAI Vision API)
    const base64 = req.file.buffer.toString("base64");
    const timestamp = req.body.ts || Date.now();

    // // Save screenshot to disk for testing
    // const uploadsDir = join(__dirname, "../../uploads");
    // try {
    //   await fs.access(uploadsDir);
    // } catch {
    //   // Directory doesn't exist, create it
    //   await fs.mkdir(uploadsDir, { recursive: true });
    // }

    // const filename = `screenshot_${timestamp}.jpg`;
    // const filepath = join(uploadsDir, filename);
    // await fs.writeFile(filepath, req.file.buffer);

    // Log summary (placeholder for future OpenAI Vision API call)
    // console.log(`[Screenshot ${timestamp}] Saved to: ${filepath}`);
    console.log(`[Screenshot ${timestamp}] base64 length: ${base64.length}, prefix: ${base64.slice(0, 100)}`);
    // mismatch between typedef and actual implementation
    const response = await (client.responses.create as any)({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: "what's in this image?" },
            {
              type: "input_image",
              image_url: `data:image/jpeg;base64,${base64}`,
            },
          ],
        },
      ],
    });
    console.log(response.output_text);

    // Return 204 No Content for successful upload
    res.status(204).end();
  } catch (error) {
    console.error("Error processing screenshot:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process screenshot",
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
      console.error(`   Please stop the process using port ${PORT} or set a different PORT.`);
      console.error(`   To find and kill the process: lsof -ti:${PORT} | xargs kill -9`);
      process.exit(1);
    } else {
      console.error("❌ Server error:", err);
      process.exit(1);
    }
  });
