import React, { useRef, useEffect } from "react";
import Webcam from "react-webcam";
import type { AttentionState } from "../utils/faceTracking/classify";
import "../styles/WebcamDisplay.css";

const inputResolution = { width: 640, height: 480 };
const videoConstraints = {
  width: inputResolution.width,
  height: inputResolution.height,
  facingMode: "user",
};

interface WebcamDisplayProps {
  attentionState: AttentionState | null;
  isActive: boolean;
}

export const WebcamDisplay: React.FC<WebcamDisplayProps> = ({ attentionState, isActive }) => {
  const webcamRef = useRef<Webcam>(null);

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
      </div>
      <div className="webcam-status" style={{ color: getStatusColor() }}>
        {getStatusText()}
      </div>
    </div>
  );
};

export default WebcamDisplay;
