import { useState, useEffect, useRef } from "react";
import "../styles/Timer.css";

interface TimerProps {
  isActive: boolean;
  isPaused?: boolean;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
}

type TimerMode = "focus" | "shortBreak" | "longBreak";

const TIMER_DURATIONS = {
  focus: 25 * 60, // 25 minutes in seconds
  shortBreak: 5 * 60, // 5 minutes
  longBreak: 15 * 60, // 15 minutes
};

// Helper function to format seconds as MM:SS
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

export default function Timer({ isActive, isPaused = false, onStart, onStop, onPause, onResume }: TimerProps) {
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
  const startTimeRef = useRef<number | null>(null);
  const initialDurationRef = useRef<number>(customDurations.focus);
  const animationFrameRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number>(0); // Total time paused in milliseconds
  const pauseStartTimeRef = useRef<number | null>(null); // When pause started

  // Sync initialDurationRef when timeLeft changes externally (e.g., mode change, reset)
  useEffect(() => {
    if (!isActive && startTimeRef.current === null) {
      initialDurationRef.current = timeLeft;
    }
  }, [timeLeft, isActive]);

  // Handle pause/resume
  useEffect(() => {
    if (isPaused && isActive && pauseStartTimeRef.current === null) {
      // Pause started - record when pause began
      pauseStartTimeRef.current = Date.now();
    } else if (!isPaused && isActive && pauseStartTimeRef.current !== null) {
      // Resume - add paused duration to total paused time
      const pauseDuration = Date.now() - pauseStartTimeRef.current;
      pausedTimeRef.current += pauseDuration;
      pauseStartTimeRef.current = null;
    } else if (!isActive) {
      // Timer stopped - reset pause tracking
      pausedTimeRef.current = 0;
      pauseStartTimeRef.current = null;
    }
  }, [isPaused, isActive]);

  // Use timestamp-based timing to avoid throttling issues
  useEffect(() => {
    if (isActive && !isPaused && timeLeft > 0) {
      // Store start time and initial duration when timer starts
      if (startTimeRef.current === null) {
        startTimeRef.current = Date.now();
        initialDurationRef.current = timeLeft;
        pausedTimeRef.current = 0; // Reset paused time when starting fresh
      }

      const updateTimer = () => {
        if (startTimeRef.current === null || !isActive || isPaused) return;

        // Calculate elapsed time minus paused time
        const now = Date.now();
        const elapsed = Math.floor((now - startTimeRef.current - pausedTimeRef.current) / 1000);
        const remaining = Math.max(0, initialDurationRef.current - elapsed);

        setTimeLeft(remaining);

        if (remaining > 0 && isActive && !isPaused) {
          // Use requestAnimationFrame for smooth updates when visible
          // Fall back to setTimeout when hidden (less throttled than setInterval)
          if (document.hidden) {
            animationFrameRef.current = window.setTimeout(updateTimer, 100) as unknown as number;
          } else {
            animationFrameRef.current = requestAnimationFrame(updateTimer);
          }
        } else if (remaining === 0) {
          // Timer finished
          startTimeRef.current = null;
          pausedTimeRef.current = 0;
          pauseStartTimeRef.current = null;
          onStop();
        }
      };

      // Start the update loop
      if (document.hidden) {
        animationFrameRef.current = window.setTimeout(updateTimer, 100) as unknown as number;
      } else {
        animationFrameRef.current = requestAnimationFrame(updateTimer);
      }

      return () => {
        if (animationFrameRef.current !== null) {
          if (document.hidden) {
            clearTimeout(animationFrameRef.current);
          } else {
            cancelAnimationFrame(animationFrameRef.current);
          }
          animationFrameRef.current = null;
        }
      };
    } else if (isActive && timeLeft === 0) {
      // Timer finished naturally
      startTimeRef.current = null;
      pausedTimeRef.current = 0;
      pauseStartTimeRef.current = null;
      onStop();
    } else if (!isActive) {
      // Timer stopped or reset
      startTimeRef.current = null;
      pausedTimeRef.current = 0;
      pauseStartTimeRef.current = null;
    }
  }, [isActive, isPaused, onStop]);

  // Update document title with timer when active (but not paused)
  useEffect(() => {
    if (isActive && !isPaused && timeLeft > 0) {
      const formattedTime = formatTime(timeLeft);
      document.title = `${formattedTime} - DillyDally`;
    } else if (isActive && isPaused) {
      document.title = "⏸️ Paused - DillyDally";
    } else {
      document.title = "DillyDally";
    }

    // Cleanup: reset title when component unmounts
    return () => {
      if (!isActive) {
        document.title = "DillyDally";
      }
    };
  }, [isActive, isPaused, timeLeft]);

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
    startTimeRef.current = null;
    pausedTimeRef.current = 0;
    pauseStartTimeRef.current = null;
    if (isActive) {
      onStop();
    }
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
      startTimeRef.current = null;
      initialDurationRef.current = parsedSeconds;
      pausedTimeRef.current = 0;
      pauseStartTimeRef.current = null;
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
        {!isActive ? (
          <button className="timer-control-btn start-btn" onClick={onStart}>
            Start
          </button>
        ) : isPaused ? (
          <>
            <button className="timer-control-btn resume-btn" onClick={onResume}>
              Resume
            </button>
            <button className="timer-control-btn stop-btn" onClick={onStop}>
              Stop
            </button>
          </>
        ) : (
          <>
            <button className="timer-control-btn pause-btn" onClick={onPause}>
              Pause
            </button>
            <button className="timer-control-btn stop-btn" onClick={onStop}>
              Stop
            </button>
          </>
        )}
      </div>
    </div>
  );
}
