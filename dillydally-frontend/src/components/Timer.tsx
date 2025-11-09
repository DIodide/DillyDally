import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TimerProps {
  onSessionChange: (isActive: boolean) => void;
}

type TimerMode = "focus" | "shortBreak" | "longBreak";

const TIMER_DURATIONS = {
  focus: 25 * 60, // 25 minutes
  shortBreak: 5 * 60, // 5 minutes
  longBreak: 15 * 60, // 15 minutes
};

export default function Timer({ onSessionChange }: TimerProps) {
  const [mode, setMode] = useState<TimerMode>("focus");
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATIONS.focus);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleStop();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const handleModeChange = (newMode: string) => {
    const timerMode = newMode as TimerMode;
    setMode(timerMode);
    setTimeLeft(TIMER_DURATIONS[timerMode]);
    setIsRunning(false);
    onSessionChange(false);
  };

  const handleStart = () => {
    setIsRunning(true);
    onSessionChange(true);
  };

  const handleStop = () => {
    setIsRunning(false);
    onSessionChange(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(TIMER_DURATIONS[mode]);
    onSessionChange(false);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((TIMER_DURATIONS[mode] - timeLeft) / TIMER_DURATIONS[mode]) * 100;

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Circular Timer */}
      <div className="relative w-64 h-64">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-gray-200"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
            strokeLinecap="round"
            className="text-[#17a2b8] transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl font-bold text-[#1e3a5f]">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* Mode Tabs */}
      <Tabs value={mode} onValueChange={handleModeChange} className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100">
          <TabsTrigger value="focus" className="data-[state=active]:bg-[#17a2b8] data-[state=active]:text-white">
            Focus
          </TabsTrigger>
          <TabsTrigger value="shortBreak" className="data-[state=active]:bg-[#17a2b8] data-[state=active]:text-white">
            Short Break
          </TabsTrigger>
          <TabsTrigger value="longBreak" className="data-[state=active]:bg-[#17a2b8] data-[state=active]:text-white">
            Long Break
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Control Buttons */}
      <div className="flex gap-4">
        <Button 
          size="lg" 
          onClick={isRunning ? handleStop : handleStart}
          className="px-8 bg-white hover:bg-gray-50 text-[#1e3a5f] border-2 border-gray-200"
        >
          {isRunning ? "Stop" : "Start"}
        </Button>
        <Button 
          size="lg" 
          variant="outline" 
          onClick={handleReset}
          className="px-8 border-2"
        >
          Reset
        </Button>
      </div>
    </div>
  );
}


