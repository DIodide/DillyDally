import "./App.css";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "./lib/convexApi";
import SessionCapture from "./components/SessionCapture";
import FaceTracking from "./components/FaceTracking";
import type { AttentionState } from "./utils/faceTracking/classify";

interface Task {
  _id: string;
  text: string;
  isCompleted: boolean;
}

function App() {
  const tasks = useQuery(api.tasks.get);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [attentionHistory, setAttentionHistory] = useState<{
    timestamp: number;
    state: string;
    confidence: number;
  }[]>([]);

  const handleAttentionChange = (state: AttentionState) => {
    // Log attention state changes
    if (state.state !== "looking_at_screen") {
      console.log(`⚠️ Attention change: ${state.state} (${Math.round(state.confidence * 100)}% confidence)`);
    }
    
    // Track attention history
    setAttentionHistory(prev => {
      const newEntry = {
        timestamp: Date.now(),
        state: state.state,
        confidence: state.confidence
      };
      // Keep last 100 entries
      return [...prev.slice(-99), newEntry];
    });
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

      <div className="tasks-container">
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
      </div>
      
      {/* Display attention statistics when session is active */}
      {isSessionActive && attentionHistory.length > 0 && (
        <div style={{
          position: "fixed",
          bottom: "20px",
          left: "20px",
          padding: "12px",
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          fontSize: "12px",
          maxWidth: "200px"
        }}>
          <h4 style={{ margin: "0 0 8px 0" }}>Session Stats</h4>
          <div>Total checks: {attentionHistory.length}</div>
          <div>
            Away count: {attentionHistory.filter(h => h.state.includes("away")).length}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
