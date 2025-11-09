import { useQuery } from "convex/react";
import { api } from "../lib/convexApi";
import type { Id } from "@convex/_generated/dataModel";
import "../styles/SessionsSidebar.css";

interface SessionsSidebarProps {
  selectedSessionId: Id<"sessions"> | null;
  onSelectSession: (sessionId: Id<"sessions"> | null) => void;
  onClose: () => void;
}

export default function SessionsSidebar({ selectedSessionId, onSelectSession, onClose }: SessionsSidebarProps) {
  const sessions = useQuery(api.functions.getAllSessions);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sessionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (sessionDate.getTime() === today.getTime()) {
      return `Today at ${date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
    } else if (sessionDate.getTime() === today.getTime() - 86400000) {
      return `Yesterday at ${date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${seconds}s`;
    }
  };

  if (sessions === undefined) {
    return (
      <div className="sessions-sidebar">
        <div className="sessions-sidebar-header">
          <h2>Past Sessions</h2>
          <button className="sessions-sidebar-close" onClick={onClose} aria-label="Close sidebar">
            ✕
          </button>
        </div>
        <div className="sessions-sidebar-loading">Loading sessions...</div>
      </div>
    );
  }

  if (sessions === null || sessions.length === 0) {
    return (
      <div className="sessions-sidebar">
        <div className="sessions-sidebar-header">
          <h2>Past Sessions</h2>
          <button className="sessions-sidebar-close" onClick={onClose} aria-label="Close sidebar">
            ✕
          </button>
        </div>
        <div className="sessions-sidebar-empty">No sessions yet. Start your first focus session!</div>
      </div>
    );
  }

  return (
    <div className="sessions-sidebar">
      <div className="sessions-sidebar-header">
        <h2>Past Sessions</h2>
        <button className="sessions-sidebar-close" onClick={onClose} aria-label="Close sidebar">
          ✕
        </button>
      </div>
      <div className="sessions-list">
        {sessions.map((session) => (
          <button
            key={session._id}
            className={`session-item ${selectedSessionId === session._id ? "active" : ""}`}
            onClick={() => onSelectSession(session._id)}>
            <div className="session-item-header">
              <div className="session-item-date">{formatDate(session._creationTime)}</div>
              <div
                className={`session-item-productivity ${session.productivityPercentage >= 70 ? "high" : session.productivityPercentage >= 40 ? "medium" : "low"}`}>
                {session.productivityPercentage.toFixed(0)}%
              </div>
            </div>
            <div className="session-item-meta">
              <span className="session-item-duration">{formatDuration(session.duration)}</span>
              {session.activityCount > 0 && (
                <span className="session-item-activities">{session.activityCount} activities</span>
              )}
              {session.snapshotCount > 0 && (
                <span className="session-item-snapshots">{session.snapshotCount} snapshots</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
