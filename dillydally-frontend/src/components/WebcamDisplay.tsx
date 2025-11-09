import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import type { AttentionState } from "../utils/faceTracking/classify";
import { TRIANGULATION } from "../utils/faceTracking/triangulation";
import "../styles/WebcamDisplay.css";

const inputResolution = { width: 640, height: 480 };
const videoConstraints = {
  width: inputResolution.width,
  height: inputResolution.height,
  facingMode: "user",
};

interface FaceKeypoint {
  x: number;
  y: number;
  z?: number;
}

interface FacePrediction {
  keypoints: FaceKeypoint[];
  [key: string]: unknown;
}

interface WebcamDisplayProps {
  attentionState: AttentionState | null;
  facePrediction: FacePrediction | null;
  isActive: boolean;
}

export const WebcamDisplay: React.FC<WebcamDisplayProps> = ({ attentionState, facePrediction, isActive }) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showMesh, setShowMesh] = useState(true);

  useEffect(() => {
    if (!isActive) {
      // Stop webcam stream when not active
      const video = webcamRef.current?.video;
      if (video && video.srcObject) {
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        video.srcObject = null;
      }
    }
  }, [isActive]);

  // Draw mesh overlay when face prediction changes
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = webcamRef.current?.video;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Match canvas size to video display size
    const rect = video.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw mesh if face prediction exists and mesh is enabled
    if (showMesh && facePrediction && facePrediction.keypoints) {
      // Scale keypoints from video resolution to display size
      const scaleX = canvas.width / video.videoWidth;
      const scaleY = canvas.height / video.videoHeight;

      // Create scaled keypoints
      const scaledKeypoints = facePrediction.keypoints.map((kp: FaceKeypoint) => ({
        x: kp.x * scaleX,
        y: kp.y * scaleY,
      }));

      // Draw mesh lines
      drawMeshPaths(scaledKeypoints, ctx);
    }
  }, [facePrediction, showMesh]);

  // Helper function to draw mesh paths
  const drawMeshPaths = (keyPoints: Array<{ x: number; y: number }>, ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = "rgba(0, 200, 255, 0.5)"; // Cyan color with transparency
    ctx.lineWidth = 1;

    for (let i = 0; i < TRIANGULATION.length / 3; i++) {
      const points = [TRIANGULATION[i * 3], TRIANGULATION[i * 3 + 1], TRIANGULATION[i * 3 + 2]].map(
        (index) => keyPoints[index]
      );

      if (points[0] && points[1] && points[2]) {
        const region = new Path2D();
        region.moveTo(points[0].x, points[0].y);
        region.lineTo(points[1].x, points[1].y);
        region.lineTo(points[2].x, points[2].y);
        region.closePath();
        ctx.stroke(region);
      }
    }
  };

  const getStatusText = () => {
    if (!attentionState) return "Can't see you 👀";

    switch (attentionState.state) {
      case "looking_at_screen":
        return "You're focused! ✨";
      case "away_left":
        return "Looking away... 👀";
      case "away_right":
        return "Looking away... 👀";
      case "away_up":
        return "Daydreaming? ☁️";
      case "away_down":
        return "Are you looking at your phone? 📱";
      case "no_face":
        return "Where'd you go? 👻";
      default:
        return "Hmm... 🤔";
    }
  };

  const getStatusColor = () => {
    if (!attentionState || attentionState.state === "no_face") return "#666";
    // Green for focused, orange/yellow for away states (less harsh than red)
    return attentionState.state === "looking_at_screen" ? "#28a745" : "#ffc107";
  };

  if (!isActive) {
    return (
      <div className="webcam-display-container">
        <div className="webcam-placeholder">
          <p>Webcam inactive</p>
          <p className="webcam-hint">Start the timer to activate</p>
        </div>
      </div>
    );
  }

  return (
    <div className="webcam-display-container">
      <div className="webcam-video-wrapper">
        {React.createElement(Webcam as unknown as React.ElementType, {
          ref: webcamRef,
          width: inputResolution.width,
          height: inputResolution.height,
          videoConstraints: videoConstraints,
          mirrored: true,
          autoPlay: true,
          playsInline: true,
          className: "webcam-video",
        })}
        {/* Canvas overlay for mesh drawing */}
        <canvas
          ref={canvasRef}
          className="webcam-mesh-overlay"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        />
      </div>
      <div className="webcam-status" style={{ color: getStatusColor() }}>
        {getStatusText()}
      </div>
      <label className="webcam-mesh-toggle">
        <input
          type="checkbox"
          checked={showMesh}
          onChange={(e) => setShowMesh(e.target.checked)}
          aria-label="Show face mesh overlay"
        />
        <span>Show face mesh</span>
      </label>
    </div>
  );
};

export default WebcamDisplay;
