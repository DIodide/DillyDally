import { useState, useEffect } from "react";
import "../styles/Timer.css";

interface TimerProps {
  isActive: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}

type TimerMode = "focus" | "shortBreak" | "longBreak";

const TIMER_DURATIONS = {
  focus: 25 * 60, // 25 minutes in seconds
  shortBreak: 5 * 60, // 5 minutes
  longBreak: 15 * 60, // 15 minutes
};

export default function Timer({ isActive, onStart, onStop, onReset }: TimerProps) {
  const [mode, setMode] = useState<TimerMode>("focus");
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATIONS.focus);

  useEffect(() => {
    let interval: number | null = null;

    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Timer finished
      onStop();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, onStop]);

  const handleModeChange = (newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(TIMER_DURATIONS[newMode]);
    if (isActive) {
      onStop();
    }
  };

  const handleReset = () => {
    setTimeLeft(TIMER_DURATIONS[mode]);
    onReset();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = ((TIMER_DURATIONS[mode] - timeLeft) / TIMER_DURATIONS[mode]) * 100;

  return (
    <div className="timer-container">
      <div className="timer-circle-wrapper">
        <svg className="timer-circle" viewBox="0 0 200 200">
          <circle
            className="timer-circle-bg"
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="#e0e0e0"
            strokeWidth="12"
          />
          <circle
            className="timer-circle-progress"
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="#17a2b8"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 90}`}
            strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress / 100)}`}
            transform="rotate(-90 100 100)"
          />
        </svg>
        <div className="timer-display">
          <div className="timer-time">{formatTime(timeLeft)}</div>
        </div>
      </div>

      <div className="timer-modes">
        <button
          className={`timer-mode-btn ${mode === "focus" ? "" : "inactive"}`}
          onClick={() => handleModeChange("focus")}
        >
          Focus
        </button>
        <button
          className={`timer-mode-btn ${mode === "shortBreak" ? "active" : "inactive"}`}
          onClick={() => handleModeChange("shortBreak")}
        >
          Short Break
        </button>
        <button
          className={`timer-mode-btn ${mode === "longBreak" ? "" : "inactive"}`}
          onClick={() => handleModeChange("longBreak")}
        >
          Long Break
        </button>
      </div>

      <div className="timer-controls">
        <button className="timer-control-btn start-btn" onClick={isActive ? onStop : onStart}>
          {isActive ? "Stop" : "Start"}
        </button>
        <button className="timer-control-btn reset-btn" onClick={handleReset}>
          Reset
        </button>
      </div>
    </div>
  );
}

