import "./App.css";
import { useState, useRef } from "react";
import SessionCapture from "./components/SessionCapture";
import FaceTracking from "./components/FaceTracking";
import type { AttentionState } from "./utils/faceTracking/classify";

function App() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const lastLogTimeRef = useRef(0);
  const lastStateRef = useRef("");

  const handleAttentionChange = (state: AttentionState) => {
    const now = Date.now();
    const timeSinceLastLog = now - lastLogTimeRef.current;
    const stateChanged = state.state !== lastStateRef.current;
    
    // Only log if 1 second has passed OR if the state has changed
    if (timeSinceLastLog >= 1000 || stateChanged) {
      console.log(`👁️ Face tracking: ${state.state} (confidence: ${Math.round(state.confidence * 100)}%, yaw: ${state.yaw.toFixed(2)}, pitch: ${state.pitch.toFixed(2)})`);
      lastLogTimeRef.current = now;
      lastStateRef.current = state.state;
    }
  };

  return (
    <div className="App">
      <h1>DillyDally Tasks</h1>
      <SessionCapture 
        onSessionChange={setIsSessionActive}
      />
      
      {/* Face Tracking Component - only shows when session is active */}
      <FaceTracking 
        isTracking={isSessionActive}
        onAttentionChange={handleAttentionChange}
      />

      {/* <div className="tasks-container">
        {tasks === undefined ? (
          <p>Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p>No tasks yet!</p>
        ) : (
          <ul>
            {tasks.map(({ _id, text, isCompleted }: Task) => (
              <li key={_id}>
                <input type="checkbox" checked={isCompleted} readOnly />
                <span
                  style={{
                    textDecoration: isCompleted ? "line-through" : "none",
                  }}>
                  {text}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div> */}
    </div>
  );
}

export default App;
