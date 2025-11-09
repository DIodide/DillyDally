// Runs MediaPipe FaceMesh via TFJS and loops the detection.
// Calls your callback every draw with classification + orientation.

import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import { drawMesh } from "./drawMesh";
import { getAttentionState } from "./classify";
import type { AttentionState } from "./classify";

const DRAW_DELAY_VISIBLE = 100; // ms when tab is visible (faster updates)
const DRAW_DELAY_HIDDEN = 500; // ms when tab is hidden (slower but still works)

// Helper to check if tab is visible
const isTabVisible = (): boolean => {
  if (typeof document === "undefined") return true;
  return !document.hidden && document.visibilityState === "visible";
};

export const runDetector = async (
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  cb?: (state: AttentionState) => void,
  isActive?: () => boolean // Optional function to check if detection should be active
) => {
  try {
    console.log("🔧 Initializing TensorFlow backend...");
    // Ensure TensorFlow backend is ready
    await tf.setBackend("webgl");
    await tf.ready();
    console.log("✅ TensorFlow backend ready");
  } catch (error) {
    console.error("❌ Failed to initialize TensorFlow backend:", error);
    throw new Error("TensorFlow backend initialization failed");
  }

  const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
  const detectorConfig = {
    runtime: "tfjs" as const,
    refineLandmarks: false,
  };

  let detector;
  try {
    console.log("📦 Loading face detection model...");
    detector = await faceLandmarksDetection.createDetector(model, detectorConfig);
    console.log("✅ Face detection model loaded");
  } catch (error) {
    console.error("❌ Failed to load face detection model:", error);
    throw new Error("Face detection model loading failed");
  }

  let isRunning = true;
  let frameCount = 0;
  let lastLogTime = Date.now();
  let timeoutId: number | null = null;
  let lastScheduleTime = performance.now();

  const detect = async () => {
    if (!isRunning) return;

    // Check if detection should be active (if provided)
    if (isActive && !isActive()) {
      // Skip processing but continue scheduling
      scheduleNext();
      return;
    }

    // Validate video dimensions before processing
    if (!video || video.videoWidth === 0 || video.videoHeight === 0 || video.readyState < 2) {
      // Video not ready or has been stopped, skip this frame silently
      scheduleNext();
      return;
    }

    try {
      const estimationConfig = { flipHorizontal: true };
      const faces = await detector.estimateFaces(video, estimationConfig);
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        scheduleNext();
        return;
      }

      frameCount++;

      // Log status every 5 seconds
      if (Date.now() - lastLogTime > 5000) {
        console.log(`📊 Face detection running: ${frameCount} frames processed, ${faces?.length || 0} faces detected`);
        lastLogTime = Date.now();
        frameCount = 0;
      }

      // Choose the most prominent face if multiple
      const face = faces && faces.length ? faces[0] : null;

      // Classification first
      const state = getAttentionState(face);

      // Then draw overlays (mesh + optional direction triangles)
      drawMesh(face, ctx);

      if (cb) cb(state);
    } catch (error) {
      // Suppress texture size errors (happens when video is being cleaned up)
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes("texture size") && !errorMessage.includes("0x0")) {
        console.error("Detection error:", error);
      }
    }

    scheduleNext();
  };

  const scheduleNext = () => {
    if (!isRunning) return;

    // Use dynamic delay based on visibility
    const baseDelay = isTabVisible() ? DRAW_DELAY_VISIBLE : DRAW_DELAY_HIDDEN;

    // Calculate drift compensation
    const now = performance.now();
    const actualDelay = now - lastScheduleTime;
    const drift = actualDelay - baseDelay;

    // Compensate for drift by adjusting next delay
    // This helps maintain accurate timing even when throttled
    const adjustedDelay = Math.max(10, baseDelay - drift);

    lastScheduleTime = now;

    // Use setTimeout with drift compensation
    // This is more reliable than setInterval when tab is hidden
    timeoutId = window.setTimeout(() => {
      detect();
    }, adjustedDelay);
  };

  // Start the detection loop
  scheduleNext();

  // Listen for visibility changes to adjust timing
  const handleVisibilityChange = () => {
    // When visibility changes, reschedule with appropriate delay
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (isRunning) {
      scheduleNext();
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);

  // Return cleanup function
  return () => {
    isRunning = false;
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
};
