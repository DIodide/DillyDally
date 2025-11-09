import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../lib/convexApi";

interface SessionCaptureProps {
  intervalMs?: number;
  quality?: number;
  maxWidth?: number;
  isActive?: boolean;
  onSessionChange?: (isActive: boolean) => void;
}

export default function SessionCapture({
  intervalMs = 3000,
  quality = 0.6,
  maxWidth = 1280,
  isActive = false,
  onSessionChange,
}: SessionCaptureProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captureCount, setCaptureCount] = useState(0);

  const user = useQuery(api.functions.currentUser);
  const startSession = useMutation(api.functions.startSession);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameCallbackIdRef = useRef<number | null>(null);
  const lastCaptureTimeRef = useRef<number>(0);
  const uploadInProgressRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fallbackIntervalRef = useRef<number | null>(null);
  const isRecordingRef = useRef<boolean>(false);
  const sessionIdRef = useRef<string | null>(null);

  const apiBase = import.meta.env.VITE_EXPRESS_URL;

  const captureAndUpload = async () => {
    if (
      !videoRef.current ||
      !canvasRef.current ||
      uploadInProgressRef.current
    ) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }

    // Calculate scaled dimensions
    const aspectRatio = video.videoWidth / video.videoHeight;
    let width = video.videoWidth;
    let height = video.videoHeight;

    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }

    canvas.width = width;
    canvas.height = height;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, width, height);

    // Convert to blob with compression
    uploadInProgressRef.current = true;
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          uploadInProgressRef.current = false;
          return;
        }

        try {
          const formData = new FormData();
          formData.append("image", blob, `screencap_${Date.now()}.jpg`);
          formData.append("ts", String(Date.now()));

          const controller = new AbortController();
          abortControllerRef.current = controller;
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          if (user) {
            formData.append("userId", user._id);
          }
          if (sessionIdRef.current) {
            console.log(
              "📸 SessionCapture: Sending sessionId:",
              sessionIdRef.current
            );
            formData.append("sessionId", sessionIdRef.current);
          } else {
            console.warn(
              "📸 SessionCapture: No sessionId available, skipping upload"
            );
            uploadInProgressRef.current = false;
            return;
          }

          const response = await fetch(`${apiBase}/api/screenshots`, {
            method: "POST",
            body: formData,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
          }

          setCaptureCount((prev) => {
            const newCount = prev + 1;
            console.log(
              `📸 SessionCapture: Screenshot ${newCount} uploaded successfully`
            );
            return newCount;
          });
        } catch (err: any) {
          if (err.name !== "AbortError") {
            console.error("Upload error:", err);
            setError(`Upload failed: ${err.message}`);
          }
        } finally {
          uploadInProgressRef.current = false;
          abortControllerRef.current = null;
        }
      },
      "image/jpeg",
      quality
    );
  };

  const startCapture = async () => {
    try {
      console.log("📸 SessionCapture: startCapture() called");
      setError(null);
      setCaptureCount(0);

      // Start a new session in the database
      const newSessionId = await startSession();
      if (!newSessionId) {
        throw new Error("Failed to create session - no session ID returned");
      }
      console.log("📸 SessionCapture: Created session with ID:", newSessionId);
      sessionIdRef.current = newSessionId;

      // Request screen capture
      console.log("📸 SessionCapture: Requesting screen share permission...");
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      console.log("📸 SessionCapture: Screen share permission granted");

      streamRef.current = stream;

      // Attach stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Set up frame callback
      isRecordingRef.current = true;
      setIsRecording(true);
      console.log("📸 SessionCapture: Recording started successfully");

      // Notify parent that session has started
      if (onSessionChange) {
        onSessionChange(true);
      }

      if (
        videoRef.current &&
        "requestVideoFrameCallback" in HTMLVideoElement.prototype
      ) {
        const callback = (now: number) => {
          if (!isRecordingRef.current) return;

          const elapsed = now - lastCaptureTimeRef.current;
          if (elapsed >= intervalMs && !uploadInProgressRef.current) {
            lastCaptureTimeRef.current = now;
            captureAndUpload();
          }

          if (videoRef.current && isRecordingRef.current) {
            frameCallbackIdRef.current =
              videoRef.current.requestVideoFrameCallback(callback);
          }
        };

        frameCallbackIdRef.current =
          videoRef.current.requestVideoFrameCallback(callback);
      } else {
        // Fallback to setInterval if requestVideoFrameCallback is not supported
        fallbackIntervalRef.current = window.setInterval(
          () => {
            if (!isRecordingRef.current) return;
            const now = performance.now();
            const elapsed = now - lastCaptureTimeRef.current;
            if (elapsed >= intervalMs && !uploadInProgressRef.current) {
              lastCaptureTimeRef.current = now;
              captureAndUpload();
            }
          },
          Math.min(intervalMs, 100)
        ); // Check at least every 100ms
      }
    } catch (err: any) {
      console.error("📸 SessionCapture: Failed to start capture:", err);
      setError(`Failed to start capture: ${err.message}`);
      isRecordingRef.current = false;
      setIsRecording(false);

      // Notify parent that session failed to start
      if (onSessionChange) {
        onSessionChange(false);
      }
    }
  };

  const stopCapture = () => {
    isRecordingRef.current = false;
    setIsRecording(false);

    // Notify parent that session has stopped
    if (onSessionChange) {
      onSessionChange(false);
    }

    // Cancel frame callback
    if (
      videoRef.current &&
      frameCallbackIdRef.current !== null &&
      "cancelVideoFrameCallback" in HTMLVideoElement.prototype
    ) {
      videoRef.current.cancelVideoFrameCallback(frameCallbackIdRef.current);
      frameCallbackIdRef.current = null;
    }

    // Clear fallback interval
    if (fallbackIntervalRef.current !== null) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
    }

    // Abort any in-flight upload
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Stop media stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Clear video source
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Clear session ID
    sessionIdRef.current = null;

    uploadInProgressRef.current = false;
  };

  // Control recording state based on isActive prop
  useEffect(() => {
    console.log(
      "📸 SessionCapture: isActive changed to",
      isActive,
      "isRecording:",
      isRecording
    );
    if (isActive && !isRecording) {
      console.log("📸 SessionCapture: Starting capture...");
      startCapture();
    } else if (!isActive && isRecording) {
      console.log("📸 SessionCapture: Stopping capture...");
      stopCapture();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, isRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isRecordingRef.current) {
        stopCapture();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        marginBottom: "2rem",
        padding: "1rem",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <h2>Screen Session Capture</h2>
      <div style={{ marginBottom: "1rem" }}>
        <button
          onClick={isRecording ? stopCapture : startCapture}
          disabled={isRecording && uploadInProgressRef.current}
          style={{
            padding: "0.5rem 1rem",
            fontSize: "1rem",
            cursor: isRecording ? "pointer" : "pointer",
            backgroundColor: isRecording ? "#dc3545" : "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            marginRight: "0.5rem",
          }}
        >
          {isRecording ? "Stop Session" : "Start Session"}
        </button>
        {isRecording && (
          <span style={{ color: "#28a745", fontWeight: "bold" }}>
            Recording... ({captureCount} captures)
          </span>
        )}
      </div>
      {error && (
        <div style={{ color: "#dc3545", marginBottom: "1rem" }}>
          Error: {error}
        </div>
      )}
      <div style={{ fontSize: "0.9rem", color: "#666" }}>
        <div>
          Interval: {intervalMs}ms | Quality: {quality} | Max Width: {maxWidth}
          px
        </div>
      </div>
      {/* Hidden video and canvas elements */}
      <video
        ref={videoRef}
        style={{ display: "none" }}
        playsInline
        muted
        autoPlay
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}
