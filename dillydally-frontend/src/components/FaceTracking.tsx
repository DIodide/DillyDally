import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import { runDetector } from "../utils/faceTracking/detector";
import type { AttentionState } from "../utils/faceTracking/classify";

const inputResolution = { width: 640, height: 480 };
const videoConstraints = {
  width: inputResolution.width,
  height: inputResolution.height,
  facingMode: "user",
};

interface FacePrediction {
  keypoints: Array<{ x: number; y: number; z?: number }>;
  [key: string]: unknown;
}

interface FaceTrackingProps {
  onAttentionChange?: (state: AttentionState) => void;
  onFaceDetected?: (face: FacePrediction | null) => void;
  isTracking?: boolean;
}

export const FaceTracking: React.FC<FaceTrackingProps> = ({ onAttentionChange, onFaceDetected, isTracking = true }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<Webcam>(null);
  const [loaded, setLoaded] = useState(false);
  const initializingRef = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);
  const detectorReadyRef = useRef(false); // Track if detector is initialized and ready
  const isTrackingRef = useRef(isTracking); // Track current isTracking value

  // Keep isTrackingRef in sync with prop
  useEffect(() => {
    isTrackingRef.current = isTracking;
  }, [isTracking]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, []);

  const handleVideoLoad = async () => {
    if (loaded || initializingRef.current) return;

    const video = videoRef.current?.video;
    if (!video || !canvasRef.current) return;

    // Check if video is playing
    if (video.paused) {
      console.log("Video is paused, attempting to play...");
      try {
        await video.play();
      } catch (e) {
        console.error("Failed to play video:", e);
      }
    }

    // Wait for video to have valid dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.log("Video dimensions not ready yet, waiting...");
      return;
    }

    console.log("✅ Preloading face detector with video dimensions:", video.videoWidth, "x", video.videoHeight);
    initializingRef.current = true;

    try {
      // Initialize detector - it will check isTrackingRef before processing
      const cleanup = await runDetector(
        video,
        canvasRef.current,
        (result: AttentionState) => {
          // Only process results when actively tracking
          if (isTrackingRef.current && result) {
            // Notify parent component of attention changes
            if (onAttentionChange) {
              onAttentionChange(result);
            }
          }
        },
        () => isTrackingRef.current, // Pass isTracking getter to detector
        (face: FacePrediction | null) => {
          // Always pass face detection for mesh overlay, even when not tracking
          if (onFaceDetected) {
            onFaceDetected(face);
          }
        }
      );

      // Store cleanup function
      cleanupRef.current = cleanup;
      setLoaded(true);
      detectorReadyRef.current = true;
    } catch (error) {
      console.error("Error initializing face detector:", error);
      initializingRef.current = false;
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "-9999px",
        left: "-9999px",
        pointerEvents: "none",
      }}>
      {/* Hidden webcam for face detection - positioned offscreen */}
      {React.createElement(Webcam as unknown as React.ElementType, {
        ref: videoRef,
        width: inputResolution.width,
        height: inputResolution.height,
        videoConstraints: videoConstraints,
        onLoadedMetadata: handleVideoLoad,
        onCanPlay: handleVideoLoad,
        style: {
          position: "absolute",
          opacity: 0,
          pointerEvents: "none",
        },
        mirrored: true,
        autoPlay: true,
        playsInline: true,
      })}

      {/* Hidden canvas for processing */}
      <canvas
        ref={canvasRef}
        width={inputResolution.width}
        height={inputResolution.height}
        style={{
          position: "absolute",
          opacity: 0,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

export default FaceTracking;
