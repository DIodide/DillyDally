import "./App.css";
import { useState, useRef, useCallback, useEffect } from "react";
import SessionCapture from "./components/SessionCapture";
import FaceTracking from "./components/FaceTracking";
import Timer from "./components/Timer";
import StatsCard from "./components/StatsCard";
import Insights from "./components/Insights";
import WebcamDisplay from "./components/WebcamDisplay";
import MessageBox from "./components/MessageBox";
import SessionPlayback from "./components/SessionPlayback";
import SessionsSidebar from "./components/SessionsSidebar";
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
  const [isPaused, setIsPaused] = useState(false);
  const [breaks] = useState(0);
  const [distractionAlerts, setDistractionAlerts] = useState(0);
  const [currentAttentionState, setCurrentAttentionState] = useState<AttentionState | null>(null);
  interface FacePrediction {
    keypoints: Array<{ x: number; y: number; z?: number }>;
    [key: string]: unknown;
  }
  const [currentFacePrediction, setCurrentFacePrediction] = useState<FacePrediction | null>(null);
  const [showPlayback, setShowPlayback] = useState(false);
  const [endedSessionId, setEndedSessionId] = useState<Id<"sessions"> | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<Id<"sessions"> | null>(null);

  const user = useQuery(api.functions.currentUser);
  const startSession = useMutation(api.functions.startSession);
  const createCameraSnapshot = useMutation(api.functions.createCameraSnapshot);

  const lastLogTimeRef = useRef(0);
  const lastStateRef = useRef("");
  const [sessionId, setSessionId] = useState<Id<"sessions"> | null>(null);

  // Use refs to always access current values in the callback
  const sessionIdRef = useRef<Id<"sessions"> | null>(null);
  const isSessionActiveRef = useRef(false);
  const isPausedRef = useRef(false);
  const userRef = useRef(user);

  // Keep refs in sync with state
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    isSessionActiveRef.current = isSessionActive;
  }, [isSessionActive]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const handleAttentionChange = useCallback(
    async (state: AttentionState) => {
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

        // Use refs to get current values
        const currentSessionId = sessionIdRef.current;
        const currentIsSessionActive = isSessionActiveRef.current;
        const currentIsPaused = isPausedRef.current;
        const currentUser = userRef.current;

        // Save camera snapshot to database if session is active, not paused, and user is authenticated
        if (currentIsSessionActive && !currentIsPaused && currentUser && currentSessionId) {
          try {
            await createCameraSnapshot({
              userId: currentUser._id,
              sessionId: currentSessionId,
              timestamp: now,
              attentionState: state.state as
                | "away_left"
                | "away_right"
                | "away_up"
                | "away_down"
                | "no_face"
                | "looking_at_screen",
            });
            console.log(`📸 Camera snapshot saved: ${state.state} at ${new Date(now).toISOString()}`);
          } catch (error) {
            console.error("Failed to save camera snapshot:", error);
          }
        } else {
          // Debug: log why snapshot wasn't saved
          if (!currentIsSessionActive) console.log("⚠️ Camera snapshot skipped: session not active");
          if (currentIsPaused) console.log("⚠️ Camera snapshot skipped: session paused");
          if (!currentUser) console.log("⚠️ Camera snapshot skipped: user not authenticated");
          if (!currentSessionId) console.log("⚠️ Camera snapshot skipped: no session ID");
        }
      }
    },
    [createCameraSnapshot]
  );

  const handleStart = async () => {
    console.log("⏱️ Timer: Start button clicked, activating session");
    setIsPaused(false);
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

  const handlePause = useCallback(() => {
    console.log("⏸️ Timer: Pause button clicked");
    setIsPaused(true);
  }, []);

  const handleResume = useCallback(() => {
    console.log("▶️ Timer: Resume button clicked");
    setIsPaused(false);
  }, []);

  const handleStop = useCallback(() => {
    console.log("⏱️ Timer: Stop button clicked, deactivating session");
    setIsPaused(false);
    setIsSessionActive(false);
    // Show playback if we have a session ID
    setSessionId((currentSessionId) => {
      if (currentSessionId) {
        setEndedSessionId(currentSessionId);
        setShowPlayback(true);
      }
      return null;
    });
  }, []);

  return (
    <div className="App">
      <AuthLoading>
        <p>Checking authentication…</p>
      </AuthLoading>
      <Authenticated>
        {/* Header */}
        <header className="app-header">
          <div className="logo-container">
            <button
              className="sidebar-toggle-btn"
              onClick={() => setShowSidebar(!showSidebar)}
              aria-label="Toggle sessions sidebar">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
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

        {/* Sessions Sidebar Backdrop (mobile) */}
        {showSidebar && <div className="sessions-sidebar-backdrop" onClick={() => setShowSidebar(false)} />}

        {/* Sessions Sidebar */}
        {showSidebar && (
          <SessionsSidebar
            selectedSessionId={selectedSessionId}
            onSelectSession={(sessionId) => {
              setSelectedSessionId(sessionId);
              setShowPlayback(false);
              setEndedSessionId(null);
              // Close sidebar on mobile after selection
              if (window.innerWidth <= 768) {
                setShowSidebar(false);
              }
            }}
            onClose={() => {
              setShowSidebar(false);
              setSelectedSessionId(null);
            }}
          />
        )}

        {/* Main Content Area */}
        <div className={showSidebar ? "app-content-with-sidebar" : "app-content"}>
          {/* Session Playback - shown when viewing a past session or when timer ends */}
          {selectedSessionId || (showPlayback && endedSessionId) ? (
            <SessionPlayback
              sessionId={(selectedSessionId || endedSessionId)!}
              onDismiss={() => {
                if (selectedSessionId) {
                  setSelectedSessionId(null);
                } else {
                  setShowPlayback(false);
                  setEndedSessionId(null);
                }
              }}
            />
          ) : (
            <>
              {/* Two Column Layout */}
              <div className="main-layout">
                {/* Left Column: Timer */}
                <div className="left-column">
                  <Timer
                    isActive={isSessionActive}
                    isPaused={isPaused}
                    onStart={handleStart}
                    onStop={handleStop}
                    onPause={handlePause}
                    onResume={handleResume}
                  />
                  {/* Compact Stats Row */}
                  <div className="compact-stats-row">
                    <StatsCard icon="☕" title="Breaks" value={breaks.toString()} iconBgColor="#d4f1f4" compact />
                    <StatsCard
                      icon="⚠️"
                      title="Distraction Alerts"
                      value={distractionAlerts.toString()}
                      iconBgColor="#ffe5e5"
                      compact
                    />
                  </div>
                </div>

                {/* Right Column: Webcam and Messages */}
                <div className="right-column">
                  <WebcamDisplay
                    attentionState={currentAttentionState}
                    facePrediction={currentFacePrediction}
                    isActive={isSessionActive}
                  />
                  <MessageBox sessionId={sessionId} />
                </div>
              </div>

              {/* Insights Section */}
              <Insights />
            </>
          )}
        </div>

        {/* Hidden Session Capture Component - controls screenshot capture */}
        <div style={{ display: "none" }}>
          <SessionCapture
            isActive={isSessionActive && !isPaused}
            sessionId={sessionId}
            onSessionChange={setIsSessionActive}
          />
        </div>

        {/* Face Tracking Component - preloaded on page visit, only tracks when session is active and not paused */}
        <FaceTracking
          isTracking={isSessionActive && !isPaused}
          onAttentionChange={handleAttentionChange}
          onFaceDetected={setCurrentFacePrediction}
        />
      </Authenticated>
      <Unauthenticated>
        <AuthForm />
      </Unauthenticated>
    </div>
  );
}

export default App;
