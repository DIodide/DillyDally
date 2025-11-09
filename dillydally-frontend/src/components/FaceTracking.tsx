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

interface FaceTrackingProps {
  onAttentionChange?: (state: AttentionState) => void;
  isTracking?: boolean;
}

export const FaceTracking: React.FC<FaceTrackingProps> = ({ 
  onAttentionChange, 
  isTracking = true 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<Webcam>(null);
  const [loaded, setLoaded] = useState(false);
  const initializingRef = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isTracking) {
      setLoaded(false);
      initializingRef.current = false;
      
      // Cleanup detector when tracking stops
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      
      // Stop webcam stream
      const video = videoRef.current?.video;
      if (video && video.srcObject) {
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      
      // Stop webcam stream on unmount
      const video = videoRef.current?.video;
      if (video && video.srcObject) {
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
      }
    };
  }, [isTracking]);

  const handleVideoLoad = async () => {
    if (!isTracking) return;
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

    console.log("✅ Starting face detector with video dimensions:", video.videoWidth, "x", video.videoHeight);
    console.log("Video ready state:", video.readyState, "Playing:", !video.paused);
    initializingRef.current = true;
    
    try {
      const cleanup = await runDetector(video, canvasRef.current, (result: AttentionState) => {
        if (result) {
          // Notify parent component of attention changes
          if (onAttentionChange) {
            onAttentionChange(result);
          }
        }
      });
      
      // Store cleanup function
      cleanupRef.current = cleanup;
      setLoaded(true);
    } catch (error) {
      console.error("Error starting face detector:", error);
      initializingRef.current = false;
    }
  };

  if (!isTracking) {
    return null;
  }

  return (
    <div style={{ 
      position: "fixed", 
      top: "-9999px", 
      left: "-9999px",
      pointerEvents: "none"
    }}>
      {/* Hidden webcam for face detection - positioned offscreen */}
      <Webcam
        ref={videoRef}
        width={inputResolution.width}
        height={inputResolution.height}
        videoConstraints={videoConstraints}
        onLoadedMetadata={handleVideoLoad}
        onCanPlay={handleVideoLoad}
        style={{ 
          position: "absolute",
          opacity: 0,
          pointerEvents: "none"
        }}
        mirrored
        autoPlay
        playsInline
      />

      {/* Hidden canvas for processing */}
      <canvas
        ref={canvasRef}
        width={inputResolution.width}
        height={inputResolution.height}
        style={{ 
          position: "absolute",
          opacity: 0,
          pointerEvents: "none"
        }}
      />
    </div>
  );
};

export default FaceTracking;

