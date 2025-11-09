import { useState, useEffect, useRef } from "react";
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
  const [customDurations, setCustomDurations] = useState<Record<TimerMode, number>>({
    focus: TIMER_DURATIONS.focus,
    shortBreak: TIMER_DURATIONS.shortBreak,
    longBreak: TIMER_DURATIONS.longBreak,
  });
  const [timeLeft, setTimeLeft] = useState(customDurations.focus);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let interval: number | null = null;

    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      // Timer finished naturally
      onStop();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, onStop]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleModeChange = (newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(customDurations[newMode]);
    setIsEditing(false);
    if (isActive) {
      onStop();
    }
  };

  const handleReset = () => {
    setTimeLeft(customDurations[mode]);
    onReset();
  };

  const handleTimeClick = () => {
    if (!isActive) {
      setIsEditing(true);
      setEditValue(formatTime(timeLeft));
    }
  };

  const parseTimeInput = (input: string): number | null => {
    // Remove any non-digit characters except colon
    const cleaned = input.replace(/[^\d:]/g, "");

    // Handle MM:SS format
    const parts = cleaned.split(":");
    if (parts.length === 2) {
      const minutes = parseInt(parts[0], 10) || 0;
      const seconds = parseInt(parts[1], 10) || 0;
      if (minutes >= 0 && seconds >= 0 && seconds < 60) {
        return minutes * 60 + seconds;
      }
    } else if (parts.length === 1 && cleaned.length > 0) {
      // Handle just minutes (e.g., "25" means 25 minutes)
      const minutes = parseInt(cleaned, 10);
      if (minutes >= 0) {
        return minutes * 60;
      }
    }

    return null;
  };

  const handleTimeEdit = (value: string) => {
    setEditValue(value);
  };

  const handleTimeSave = () => {
    const parsedSeconds = parseTimeInput(editValue);
    if (parsedSeconds !== null && parsedSeconds > 0) {
      const newDurations = { ...customDurations, [mode]: parsedSeconds };
      setCustomDurations(newDurations);
      setTimeLeft(parsedSeconds);
      setIsEditing(false);
    } else {
      // Invalid input, revert to current time
      setEditValue(formatTime(timeLeft));
      setIsEditing(false);
    }
  };

  const handleTimeCancel = () => {
    setIsEditing(false);
    setEditValue("");
  };

  const handleTimeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleTimeSave();
    } else if (e.key === "Escape") {
      handleTimeCancel();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const currentDuration = customDurations[mode];
  const progress = ((currentDuration - timeLeft) / currentDuration) * 100;

  return (
    <div className="timer-container">
      <div className="timer-circle-wrapper">
        <svg className="timer-circle" viewBox="0 0 200 200">
          <circle className="timer-circle-bg" cx="100" cy="100" r="90" fill="none" stroke="#e0e0e0" strokeWidth="12" />
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
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              className="timer-time-input"
              value={editValue}
              onChange={(e) => handleTimeEdit(e.target.value)}
              onBlur={handleTimeSave}
              onKeyDown={handleTimeKeyDown}
              placeholder="MM:SS"
              maxLength={5}
            />
          ) : (
            <div
              className={`timer-time ${!isActive ? "timer-time-editable" : ""}`}
              onClick={handleTimeClick}
              title={!isActive ? "Click to edit timer duration" : ""}>
              {formatTime(timeLeft)}
            </div>
          )}
        </div>
      </div>

      <div className="timer-modes">
        <button
          className={`timer-mode-btn ${mode === "focus" ? "active" : "inactive"}`}
          onClick={() => handleModeChange("focus")}>
          Focus
        </button>
        <button
          className={`timer-mode-btn ${mode === "shortBreak" ? "active" : "inactive"}`}
          onClick={() => handleModeChange("shortBreak")}>
          Short Break
        </button>
        <button
          className={`timer-mode-btn ${mode === "longBreak" ? "active" : "inactive"}`}
          onClick={() => handleModeChange("longBreak")}>
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
