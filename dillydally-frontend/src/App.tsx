import "./App.css";
import { useState, useRef } from "react";
import SessionCapture from "./components/SessionCapture";
import FaceTracking from "./components/FaceTracking";
import Timer from "./components/Timer";
import StatsCard from "./components/StatsCard";
import Insights from "./components/Insights";
import WebcamDisplay from "./components/WebcamDisplay";
import MessageBox from "./components/MessageBox";
import SessionSnapshots from "./components/SessionSnapshots";
import type { AttentionState } from "./utils/faceTracking/classify";
import logoImage from "./assets/logo.png";
import { api } from "./lib/convexApi";
import AuthForm from "./components/AuthForm";
import { useAuthActions } from "@convex-dev/auth/react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { useQuery, useMutation } from "convex/react";
import type { Id } from "@convex/_generated/dataModel";

function SignOut() {
  const { signOut } = useAuthActions();
  return <button onClick={() => void signOut()}>Sign out</button>;
}

function App() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [timesFocused] = useState(0);
  const [breaks] = useState(0);
  const [distractionAlerts, setDistractionAlerts] = useState(0);
  const [currentAttentionState, setCurrentAttentionState] = useState<AttentionState | null>(null);

  const user = useQuery(api.functions.currentUser);
  const startSession = useMutation(api.functions.startSession);
  const createCameraSnapshot = useMutation(api.functions.createCameraSnapshot);

  const lastLogTimeRef = useRef(0);
  const lastStateRef = useRef("");
  const [sessionId, setSessionId] = useState<Id<"sessions"> | null>(null);

  const handleAttentionChange = async (state: AttentionState) => {
    // Update current attention state for webcam display
    setCurrentAttentionState(state);

    const now = Date.now();
    const timeSinceLastLog = now - lastLogTimeRef.current;
    const stateChanged = state.state !== lastStateRef.current;

    // Count distraction alerts when user looks away
    if (stateChanged && state.state !== "looking_at_screen" && state.state !== "no_face") {
      setDistractionAlerts((prev) => prev + 1);
    }

    // Only log if 1 second has passed OR if the state has changed
    if (timeSinceLastLog >= 1000 || stateChanged) {
      console.log(
        `👁️ Face tracking: ${state.state} (confidence: ${Math.round(state.confidence * 100)}%, yaw: ${state.yaw.toFixed(2)}, pitch: ${state.pitch.toFixed(2)})`
      );
      lastLogTimeRef.current = now;
      lastStateRef.current = state.state;

      // Save camera snapshot to database if session is active and user is authenticated
      if (isSessionActive && user && sessionId) {
        try {
          await createCameraSnapshot({
            userId: user._id,
            sessionId: sessionId,
            timestamp: now,
            attentionState: state.state as
              | "away_left"
              | "away_right"
              | "away_up"
              | "away_down"
              | "no_face"
              | "looking_at_screen",
          });
        } catch (error) {
          console.error("Failed to save camera snapshot:", error);
        }
      }
    }
  };

  const handleStart = async () => {
    console.log("⏱️ Timer: Start button clicked, activating session");
    if (user) {
      try {
        const newSessionId = await startSession();
        setSessionId(newSessionId);
        setIsSessionActive(true);
      } catch (error) {
        console.error("Failed to start session:", error);
      }
    } else {
      setIsSessionActive(true);
    }
  };

  const handleStop = () => {
    console.log("⏱️ Timer: Stop button clicked, deactivating session");
    setIsSessionActive(false);
    setSessionId(null);
  };

  const handleReset = () => {
    // Reset timer logic handled in Timer component
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} h ${mins} m` : `${hours} h`;
  };

  return (
    <div className="App">
      <AuthLoading>
        <p>Checking authentication…</p>
      </AuthLoading>
      <Authenticated>
        {/* Header */}
        <header className="app-header">
          <div className="logo-container">
            <img src={logoImage} alt="DillyDally" className="app-logo" />
          </div>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <SignOut />
            <button className="settings-btn" aria-label="Settings">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3" />
                <path d="M19.07 4.93l-4.24 4.24m-5.66 5.66L4.93 19.07m14.14 0l-4.24-4.24m-5.66-5.66L4.93 4.93" />
              </svg>
            </button>
          </div>
        </header>

        {/* Two Column Layout */}
        <div className="main-layout">
          {/* Left Column: Timer */}
          <div className="left-column">
            <Timer isActive={isSessionActive} onStart={handleStart} onStop={handleStop} onReset={handleReset} />
          </div>

          {/* Right Column: Webcam and Messages */}
          <div className="right-column">
            <WebcamDisplay attentionState={currentAttentionState} isActive={isSessionActive} />
            <MessageBox sessionId={sessionId} />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <StatsCard icon="🕐" title="Time Focused Today" value={formatTime(timesFocused)} iconBgColor="#d4f1f4" />
          <StatsCard icon="☕" title="Breaks" value={breaks.toString()} iconBgColor="#d4f1f4" />
          <StatsCard icon="⚠️" title="Distraction Alerts" value={distractionAlerts.toString()} iconBgColor="#ffe5e5" />
        </div>

        {/* Insights Section */}
        <Insights />

        {/* Session Snapshots Section */}
        <SessionSnapshots sessionId={sessionId} />

        {/* Hidden Session Capture Component - controls screenshot capture */}
        <div style={{ display: "none" }}>
          <SessionCapture isActive={isSessionActive} sessionId={sessionId} onSessionChange={setIsSessionActive} />
        </div>

        {/* Face Tracking Component - hidden but active when session is running */}
        <FaceTracking isTracking={isSessionActive} onAttentionChange={handleAttentionChange} />
      </Authenticated>
      <Unauthenticated>
        <AuthForm />
      </Unauthenticated>
    </div>
  );
}

export default App;
