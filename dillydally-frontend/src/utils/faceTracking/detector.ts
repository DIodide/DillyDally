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
  const detectorConfig = { runtime: "tfjs" as const };

  const detector = await faceLandmarksDetection.createDetector(model, detectorConfig);

  let isRunning = true;
  
  const detect = async () => {
    if (!isRunning) return;
    
    try {
      const estimationConfig = { flipHorizontal: true };
      const faces = await detector.estimateFaces(video, estimationConfig);
      const ctx = canvas.getContext("2d");
      
      if (!ctx) return;

      // Choose the most prominent face if multiple
      const face = faces && faces.length ? faces[0] : null;

      // Classification first
      const state = getAttentionState(face, canvas);

      // Then draw overlays (mesh + optional direction triangles)
      drawMesh(face, ctx);

      if (cb) cb(state);
    } catch (error) {
      console.error("Detection error:", error);
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

