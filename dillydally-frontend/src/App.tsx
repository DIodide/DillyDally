import "./App.css";
import { useState, useRef } from "react";
import SessionCapture from "./components/SessionCapture";
import FaceTracking from "./components/FaceTracking";
import Timer from "./components/Timer";
import StatsCard from "./components/StatsCard";
import Insights from "./components/Insights";
import type { AttentionState } from "./utils/faceTracking/classify";
import logoImage from "./assets/logo.svg";

function App() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [timesFocused] = useState(0);
  const [breaks] = useState(0);
  const [distractionAlerts, setDistractionAlerts] = useState(0);
  
  const lastLogTimeRef = useRef(0);
  const lastStateRef = useRef("");

  const handleAttentionChange = (state: AttentionState) => {
    const now = Date.now();
    const timeSinceLastLog = now - lastLogTimeRef.current;
    const stateChanged = state.state !== lastStateRef.current;
    
    // Count distraction alerts when user looks away
    if (stateChanged && state.state !== "looking_at_screen" && state.state !== "no_face") {
      setDistractionAlerts(prev => prev + 1);
    }
    
    // Only log if 1 second has passed OR if the state has changed
    if (timeSinceLastLog >= 1000 || stateChanged) {
      console.log(`👁️ Face tracking: ${state.state} (confidence: ${Math.round(state.confidence * 100)}%, yaw: ${state.yaw.toFixed(2)}, pitch: ${state.pitch.toFixed(2)})`);
      lastLogTimeRef.current = now;
      lastStateRef.current = state.state;
    }
  };

  const handleStart = () => {
    setIsSessionActive(true);
  };

  const handleStop = () => {
    setIsSessionActive(false);
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
      {/* Header */}
      <header className="app-header">
        <div className="logo-container">
          <img src={logoImage} alt="DillyDally" className="app-logo" />
        </div>
        <button className="settings-btn" aria-label="Settings">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3" />
            <path d="M19.07 4.93l-4.24 4.24m-5.66 5.66L4.93 19.07m14.14 0l-4.24-4.24m-5.66-5.66L4.93 4.93" />
          </svg>
        </button>
      </header>

      {/* Timer Section */}
      <Timer
        isActive={isSessionActive}
        onStart={handleStart}
        onStop={handleStop}
        onReset={handleReset}
      />

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatsCard
          icon="🕐"
          title="Time Focused Today"
          value={formatTime(timesFocused)}
          iconBgColor="#d4f1f4"
        />
        <StatsCard
          icon="☕"
          title="Breaks"
          value={breaks.toString()}
          iconBgColor="#d4f1f4"
        />
        <StatsCard
          icon="⚠️"
          title="Distraction Alerts"
          value={distractionAlerts.toString()}
          iconBgColor="#ffe5e5"
        />
      </div>

      {/* Insights Section */}
      <Insights />

      {/* Hidden Session Capture Component - controls screenshot capture */}
      <div style={{ display: "none" }}>
        <SessionCapture onSessionChange={setIsSessionActive} />
      </div>
      
      {/* Face Tracking Component - hidden but active when session is running */}
      <FaceTracking 
        isTracking={isSessionActive}
        onAttentionChange={handleAttentionChange}
      />
    </div>
  );
}

export default App;
