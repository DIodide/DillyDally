// Runs MediaPipe FaceMesh via TFJS and loops the detection.
// Calls your callback every draw with classification + orientation.

import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import { drawMesh } from "./drawMesh";
import { getAttentionState } from "./classify";

const DRAW_DELAY = 100; // ms (faster updates)

export const runDetector = async (video, canvas, cb) => {
  const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
  const detectorConfig = { runtime: "tfjs" };

  const detector = await faceLandmarksDetection.createDetector(model, detectorConfig);

  const detect = async () => {
    const estimationConfig = { flipHorizontal: true };
    const faces = await detector.estimateFaces(video, estimationConfig);
    const ctx = canvas.getContext("2d");

    // Choose the most prominent face if multiple
    const face = faces && faces.length ? faces[0] : null;

    // Classification first
    const state = getAttentionState(face, canvas);

    // Then draw overlays (mesh + optional direction triangles)
    drawMesh(face, ctx);

    if (cb) cb(state);

    setTimeout(() => {
      requestAnimationFrame(detect);
    }, DRAW_DELAY);
  };

  detect();
  return null;
};
