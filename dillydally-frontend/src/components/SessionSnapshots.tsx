import { useQuery } from "convex/react";
import { api } from "../lib/convexApi";
import type { Id } from "@convex/_generated/dataModel";
import "../styles/SessionSnapshots.css";

interface SessionSnapshotsProps {
  sessionId: Id<"sessions"> | null;
}

export default function SessionSnapshots({ sessionId }: SessionSnapshotsProps) {
  const snapshots = useQuery(
    api.functions.getSessionSnapshots,
    sessionId ? { sessionId } : "skip"
  );

  if (!sessionId) {
    return null;
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="session-snapshots-container">
      <h2 className="session-snapshots-heading">Session Snapshots</h2>

      {snapshots === undefined ? (
        <div className="session-snapshots-loading">Loading snapshots...</div>
      ) : snapshots.length === 0 ? (
        <div className="session-snapshots-empty">No snapshots yet for this session.</div>
      ) : (
        <div className="session-snapshots-section">
          {snapshots.map((snapshot) => (
            <div key={snapshot._id} className="snapshot-item">
              <div className="snapshot-header">
                <div className="snapshot-time">{formatTimestamp(snapshot.timestamp)}</div>
                <div
                  className={`snapshot-productivity ${snapshot.isProductive ? "productive" : "not-productive"}`}>
                  {snapshot.isProductive ? "✓ Productive" : "✗ Not Productive"}
                </div>
              </div>
              <div className="snapshot-activity">
                <span className="snapshot-activity-label">Activity:</span>
                <span className="snapshot-activity-value">{snapshot.activity}</span>
              </div>
              <div className="snapshot-summary">{snapshot.summary}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

