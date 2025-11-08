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
  const [status, setStatus] = useState("—");
  const [confidence, setConfidence] = useState(0);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    if (!isTracking) {
      setLoaded(false);
    }
  }, [isTracking]);

  const handleVideoLoad = async () => {
    if (!isTracking) return;
    
    const video = videoRef.current?.video;
    if (!video || !canvasRef.current) return;
    if (video.readyState !== 4 || loaded) return;

    await runDetector(video, canvasRef.current, (result: AttentionState) => {
      if (result) {
        setStatus(result.state);
        setConfidence(result.confidence ?? 0);
        
        // Notify parent component of attention changes
        if (onAttentionChange) {
          onAttentionChange(result);
        }
      }
    });
    setLoaded(true);
  };

  const handleRecalibrate = () => {
    window.dispatchEvent(new Event("recalibrate-attention"));
  };

  if (!isTracking) {
    return null;
  }

  return (
    <div style={{
      position: "fixed",
      bottom: "20px",
      right: "20px",
      zIndex: 1000,
      backgroundColor: "white",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "12px",
        borderBottom: "1px solid #e0e0e0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>
            Face Tracking
          </h3>
          <p style={{ 
            margin: "4px 0 0 0", 
            fontSize: "12px",
            color: status.includes("away") || status === "no_face" ? "#f44336" : "#4caf50"
          }}>
            {status.replace(/_/g, " ")}
          </p>
        </div>
        <button
          onClick={() => setShowDebug(!showDebug)}
          style={{
            background: "none",
            border: "1px solid #ddd",
            borderRadius: "4px",
            padding: "4px 8px",
            fontSize: "12px",
            cursor: "pointer",
          }}
        >
          {showDebug ? "Hide" : "Show"}
        </button>
      </div>

      {/* Video/Canvas Container */}
      {showDebug && (
        <div style={{ position: "relative", padding: "12px" }}>
          {!loaded && (
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontSize: "12px",
              color: "#666",
            }}>
              Loading model…
            </div>
          )}

          <Webcam
            ref={videoRef}
            width={inputResolution.width}
            height={inputResolution.height}
            videoConstraints={videoConstraints}
            onLoadedData={handleVideoLoad}
            style={{ 
              visibility: "hidden", 
              position: "absolute",
              width: "100%",
              height: "100%",
            }}
            mirrored
          />

          <canvas
            ref={canvasRef}
            width={inputResolution.width}
            height={inputResolution.height}
            style={{ 
              width: "320px",
              height: "240px",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          />

          <div style={{ marginTop: "8px", fontSize: "12px" }}>
            <div>
              <strong>Confidence:</strong> {Math.round(confidence * 100)}%
            </div>
            <button
              onClick={handleRecalibrate}
              style={{
                marginTop: "8px",
                width: "100%",
                padding: "8px",
                backgroundColor: "#2196f3",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Recalibrate
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaceTracking;

