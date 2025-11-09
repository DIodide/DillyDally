import "./App.css";
import { useState, useRef } from "react";
import SessionCapture from "./components/SessionCapture";
import FaceTracking from "./components/FaceTracking";
import Timer from "./components/Timer";
import StatCard from "./components/StatCard";
import InsightCard from "./components/InsightCard";
import Logo from "./components/Logo";
import type { AttentionState } from "./utils/faceTracking/classify";
import { Clock, Coffee, AlertTriangle, Settings } from "lucide-react";

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

  const handleTimerSessionChange = (isActive: boolean) => {
    setIsSessionActive(isActive);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with Logo and Settings */}
        <div className="flex justify-between items-center mb-8">
          <Logo />
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Timer Section */}
        <div className="mb-12">
          <Timer onSessionChange={handleTimerSessionChange} />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard
            icon={<Clock className="w-6 h-6 text-[#17a2b8]" />}
            title="Time Focused Today"
            value="0 m"
            iconBg="bg-blue-100"
          />
          <StatCard
            icon={<Coffee className="w-6 h-6 text-[#17a2b8]" />}
            title="Breaks"
            value="0"
            iconBg="bg-blue-100"
          />
          <StatCard
            icon={<AlertTriangle className="w-6 h-6 text-[#17a2b8]" />}
            title="Distraction Alerts"
            value="0"
            iconBg="bg-blue-100"
          />
        </div>

        {/* Insights Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[#1e3a5f] mb-6">Insights</h2>

          {/* This Week */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-[#1e3a5f] mb-4">This Week</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InsightCard
                title="Total Focus Time"
                description="Time spent in focused work sessions"
                value="12.5 hrs"
                trend="↗ +15%"
                trendColor="text-green-600"
              />
              <InsightCard
                title="Sessions Completed"
                description="Number of pomodoro sessions finished"
                value="24"
                trend="↗ +8%"
                trendColor="text-green-600"
              />
              <InsightCard
                title="Break Completion Rate"
                description="Percentage of scheduled breaks taken"
                value="92%"
                trend="↗ +5%"
                trendColor="text-green-600"
              />
              <InsightCard
                title="Average Session Length"
                description="Mean duration of focus sessions"
                value="25 min"
                trend="— 0%"
                trendColor="text-gray-600"
              />
            </div>
          </div>

          {/* Productivity Patterns */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-[#1e3a5f] mb-4">Productivity Patterns</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InsightCard
                title="Most Productive Time"
                description="Your peak focus hour based on completed sessions"
                value="10-11 AM"
              />
              <InsightCard
                title="Current Streak"
                description="Consecutive days with at least one focus session"
                value="7 days"
                trend="↗ +12%"
                trendColor="text-green-600"
              />
              <InsightCard
                title="Weekly Goal Progress"
                description="Progress toward 15 hours of focus time"
                value="87%"
                trend="↗ +23%"
                trendColor="text-green-600"
              />
            </div>
          </div>

          {/* AI Insights */}
          <div>
            <h3 className="text-xl font-semibold text-[#1e3a5f] mb-4">AI Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InsightCard
                title="AI Assistance Time"
                description="Time using AI tools during focus sessions"
                value="3.2 hrs"
                trend="↘ -5%"
                trendColor="text-red-600"
              />
              <InsightCard
                title="Focus Without AI"
                description="Percentage of deep work done independently"
                value="74%"
              />
              <InsightCard
                title="Distraction Alerts"
                description="Times you switched away from focus tasks"
                value="8"
                trend="↘ -20%"
                trendColor="text-red-600"
              />
            </div>
          </div>
        </div>

        {/* Hidden Session Capture and Face Tracking */}
        <div className="hidden">
          <SessionCapture onSessionChange={() => {}} />
          <FaceTracking 
            isTracking={isSessionActive}
            onAttentionChange={handleAttentionChange}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
