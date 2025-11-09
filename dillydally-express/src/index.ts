import express from "express";
import cors from "cors";
import multer from "multer";
import { ConvexHttpClient } from "convex/browser";
// Try to import from local copy first, fallback to relative path for development
import { api } from "./lib/api.js";
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
  console.error(
    "Please run `npx convex dev` from the monorepo root to configure."
  );
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

// Screenshot upload endpoint
app.post("/api/screenshots", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image file provided" });
  }

  const userId = req.body.userId;
  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  const sessionId = req.body.sessionId;
  if (!sessionId) {
    return res.status(400).json({ error: "Session ID is required" });
  }

  // Validate sessionId format - Convex IDs for 'sessions' table should start with 'k' and be 32 chars
  // IDs from other tables have different prefixes, so we can catch wrong table IDs early
  if (typeof sessionId !== "string" || sessionId.length < 32) {
    console.error(`[Screenshot] Invalid sessionId format: ${sessionId}`);
    return res.status(400).json({ error: "Invalid session ID format" });
  }

  console.log(`[Screenshot] User ID: ${userId}, Session ID: ${sessionId}`);

  try {
    // Convert buffer to base64 (for future OpenAI Vision API)
    const base64 = req.file.buffer.toString("base64");
    const timestamp = req.body.ts || Date.now();

    console.log(
      `[Screenshot ${timestamp}] base64 length: ${base64.length}, prefix: ${base64.slice(0, 100)}`
    );

    // Get existing activities for this session
    let existingActivities: string[] = [];
    try {
      existingActivities = await convexClient.query(
        api.functions.getSessionActivities,
        {
          sessionId: sessionId as any,
        }
      );
      console.log(
        `[Session ${sessionId}] Found ${existingActivities.length} existing activities:`,
        existingActivities
      );
    } catch (queryError: any) {
      // Check if it's the specific ID validation error
      if (
        queryError?.message?.includes("authVerifiers") ||
        queryError?.message?.includes("does not match the table name")
      ) {
        console.error(
          `[Screenshot] Invalid sessionId - ID is from wrong table: ${sessionId}`
        );
        console.error(`[Screenshot] Error details:`, queryError.message);
        // Continue without existing activities - this is a data issue, not a fatal error
      } else {
        console.error("Error fetching session activities:", queryError);
      }
      // Continue without existing activities if query fails
    }

    // Build prompt with existing activities context
    let promptText = `Evaluate what the user is doing in the image to provide a binary classification of whether the user is doing something productive or not. Use your observations to populate the following json schema:
              {
                isProductive: bool,
                summary: string,
                current_tab: string | null // if not inside of a browser,
                activity: string // 1-2 word phrase max ex: YouTube, Instagram, Essay Writing
              }`;

    if (existingActivities.length > 0) {
      promptText += `\n\nExisting activities for this session: ${existingActivities.join(", ")}. Please try to classify the image into one of these existing activity categories if it reasonably fits. If the image doesn't match any existing category, it's okay to create a new activity category.`;
    }

    // mismatch between typedef and actual implementation
    const response = await (client.responses.create as any)({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: promptText,
            },
            {
              type: "input_image",
              image_url: `data:image/jpeg;base64,${base64}`,
            },
          ],
        },
      ],
    });
    console.log(response.output_text);

    // Parse the OpenAI response JSON
    let snapshotData;
    try {
      snapshotData = JSON.parse(response.output_text);
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      return res.status(500).json({
        success: false,
        error: "Failed to parse OpenAI response",
      });
    }

    // Create snapshot in Convex
    try {
      await convexClient.mutation(api.functions.createSnapshot, {
        userId: userId as any,
        sessionId: sessionId as any,
        timestamp: Number(timestamp),
        isProductive: snapshotData.isProductive,
        summary: snapshotData.summary,
        activity: snapshotData.activity,
        currentTab: snapshotData.current_tab || "",
        imageBase64: base64, // Store base64 encoded image
      });
      console.log(`[Snapshot] Created snapshot for session ${sessionId}`);
    } catch (snapshotError) {
      console.error("Error creating snapshot:", snapshotError);
      return res.status(500).json({
        success: false,
        error: "Failed to create snapshot in Convex",
      });
    }

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
