// Runs MediaPipe FaceMesh via TFJS and loops the detection.
// Calls your callback every draw with classification + orientation.

import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import { drawMesh } from "./drawMesh";
import { getAttentionState } from "./classify";
import type { AttentionState } from "./classify";

const DRAW_DELAY = 100; // ms (faster updates)

export const runDetector = async (
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  cb?: (state: AttentionState) => void
) => {
  // Ensure TensorFlow backend is ready
  await tf.setBackend("webgl");
  await tf.ready();
  
  const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
  const detectorConfig = { 
    runtime: "tfjs" as const,
    refineLandmarks: false 
  };

  const detector = await faceLandmarksDetection.createDetector(model, detectorConfig);

  let isRunning = true;
  let frameCount = 0;
  let lastLogTime = Date.now();
  
  const detect = async () => {
    if (!isRunning) return;
    
    // Validate video dimensions before processing
    if (!video || video.videoWidth === 0 || video.videoHeight === 0 || video.readyState < 2) {
      // Video not ready or has been stopped, skip this frame silently
      return;
    }
    
    try {
      const estimationConfig = { flipHorizontal: true };
      const faces = await detector.estimateFaces(video, estimationConfig);
      const ctx = canvas.getContext("2d");
      
      if (!ctx) return;

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
  };

  // Use setInterval instead of requestAnimationFrame to keep running even when tab is not in focus
  const intervalId = setInterval(detect, DRAW_DELAY);
  
  // Return cleanup function
  return () => {
    isRunning = false;
    clearInterval(intervalId);
  };
};

