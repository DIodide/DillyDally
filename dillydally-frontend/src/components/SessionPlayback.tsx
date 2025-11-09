import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../lib/convexApi";
import type { Id } from "@convex/_generated/dataModel";
import "../styles/SessionPlayback.css";

interface SessionPlaybackProps {
  sessionId: Id<"sessions"> | null;
  onDismiss: () => void;
}

interface TimelineRegion {
  activity: string;
  startTime: number;
  endTime: number;
  duration: number;
  isProductive: boolean;
  snapshots: Array<{
    timestamp: number;
    summary: string;
    isProductive: boolean;
  }>;
}

export default function SessionPlayback({ sessionId, onDismiss }: SessionPlaybackProps) {
  const snapshots = useQuery(
    api.functions.getSessionSnapshots,
    sessionId ? { sessionId } : "skip"
  );
  const [expandedActivities, setExpandedActivities] = useState<Set<number>>(new Set());

  if (!sessionId || snapshots === undefined) {
    return null;
  }

  const toggleActivityExpansion = (index: number) => {
    setExpandedActivities((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Process snapshots into timeline regions grouped by activity
  const processSnapshots = (): TimelineRegion[] => {
    if (!snapshots || snapshots.length === 0) {
      return [];
    }

    // Sort snapshots by timestamp (ascending)
    const sortedSnapshots = [...snapshots].sort((a, b) => a.timestamp - b.timestamp);

    const regions: TimelineRegion[] = [];
    let currentRegion: TimelineRegion | null = null;

    for (const snapshot of sortedSnapshots) {
      if (!currentRegion || currentRegion.activity !== snapshot.activity) {
        // Start a new region
        if (currentRegion) {
          // Close previous region
          currentRegion.endTime = snapshot.timestamp;
          currentRegion.duration = currentRegion.endTime - currentRegion.startTime;
          regions.push(currentRegion);
        }

        currentRegion = {
          activity: snapshot.activity,
          startTime: snapshot.timestamp,
          endTime: snapshot.timestamp,
          duration: 0,
          isProductive: snapshot.isProductive,
          snapshots: [
            {
              timestamp: snapshot.timestamp,
              summary: snapshot.summary,
              isProductive: snapshot.isProductive,
            },
          ],
        };
      } else {
        // Continue current region
        currentRegion.snapshots.push({
          timestamp: snapshot.timestamp,
          summary: snapshot.summary,
          isProductive: snapshot.isProductive,
        });
        // Update productivity status (use majority or most recent)
        if (snapshot.isProductive) {
          currentRegion.isProductive = snapshot.isProductive;
        }
      }
    }

    // Close the last region
    if (currentRegion) {
      if (sortedSnapshots.length > 0) {
        currentRegion.endTime = sortedSnapshots[sortedSnapshots.length - 1].timestamp;
      }
      currentRegion.duration = currentRegion.endTime - currentRegion.startTime;
      regions.push(currentRegion);
    }

    return regions;
  };

  const timelineRegions = processSnapshots();

  // Calculate total session duration
  const sessionDuration =
    timelineRegions.length > 0
      ? timelineRegions[timelineRegions.length - 1].endTime - timelineRegions[0].startTime
      : 0;

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const calculatePercentage = (duration: number) => {
    if (sessionDuration === 0) return 0;
    return (duration / sessionDuration) * 100;
  };

  // Calculate productivity stats
  const productiveTime = timelineRegions
    .filter((r) => r.isProductive)
    .reduce((sum, r) => sum + r.duration, 0);
  const productivityPercentage = sessionDuration > 0 ? (productiveTime / sessionDuration) * 100 : 0;

  return (
    <div className="session-playback-container">
      <div className="session-playback-header">
        <h2 className="session-playback-title">Session Play-by-Play</h2>
        <button className="session-playback-dismiss" onClick={onDismiss}>
          ✕ Dismiss
        </button>
      </div>

      {timelineRegions.length === 0 ? (
        <div className="session-playback-empty">
          <p>No activity data available for this session.</p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="session-playback-stats">
            <div className="playback-stat">
              <div className="playback-stat-label">Total Duration</div>
              <div className="playback-stat-value">{formatDuration(sessionDuration)}</div>
            </div>
            <div className="playback-stat">
              <div className="playback-stat-label">Productive Time</div>
              <div className="playback-stat-value">{formatDuration(productiveTime)}</div>
            </div>
            <div className="playback-stat">
              <div className="playback-stat-label">Productivity</div>
              <div className="playback-stat-value">{productivityPercentage.toFixed(1)}%</div>
            </div>
            <div className="playback-stat">
              <div className="playback-stat-label">Activities</div>
              <div className="playback-stat-value">{timelineRegions.length}</div>
            </div>
          </div>

          {/* Timeline */}
          <div className="session-playback-timeline-container">
            <h3 className="timeline-title">Activity Timeline</h3>
            <div className="timeline-wrapper">
              {timelineRegions.map((region, index) => {
                const percentage = calculatePercentage(region.duration);
                const leftPercentage =
                  sessionDuration > 0
                    ? ((region.startTime - timelineRegions[0].startTime) / sessionDuration) * 100
                    : 0;

                return (
                  <div
                    key={index}
                    className={`timeline-region ${region.isProductive ? "productive" : "not-productive"}`}
                    style={{
                      width: `${percentage}%`,
                      left: `${leftPercentage}%`,
                    }}>
                    <div className="timeline-region-content">
                      <div className="timeline-region-label">{region.activity}</div>
                      <div className="timeline-region-duration">{formatDuration(region.duration)}</div>
                    </div>
                    <div className="timeline-region-tooltip">
                      <div className="tooltip-activity">{region.activity}</div>
                      <div className="tooltip-time">
                        {formatTime(region.startTime)} - {formatTime(region.endTime)}
                      </div>
                      <div className="tooltip-duration">Duration: {formatDuration(region.duration)}</div>
                      <div className={`tooltip-status ${region.isProductive ? "productive" : "not-productive"}`}>
                        {region.isProductive ? "✓ Productive" : "✗ Not Productive"}
                      </div>
                      <div className="tooltip-snapshots">{region.snapshots.length} snapshots</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Activity List */}
          <div className="session-playback-activities">
            <h3 className="activities-title">Activity Details</h3>
            <div className="activities-list">
              {timelineRegions.map((region, index) => (
                <div key={index} className={`activity-item ${region.isProductive ? "productive" : "not-productive"}`}>
                  <div className="activity-header">
                    <div className="activity-name">{region.activity}</div>
                    <div className={`activity-status ${region.isProductive ? "productive" : "not-productive"}`}>
                      {region.isProductive ? "✓ Productive" : "✗ Not Productive"}
                    </div>
                  </div>
                  <div className="activity-meta">
                    <span className="activity-time">
                      {formatTime(region.startTime)} - {formatTime(region.endTime)}
                    </span>
                    <span className="activity-duration">{formatDuration(region.duration)}</span>
                  </div>
                  <div className={`activity-snapshots ${expandedActivities.has(index) ? "expanded" : ""}`}>
                    {(expandedActivities.has(index) ? region.snapshots : region.snapshots.slice(0, 3)).map(
                      (snapshot, snapIndex) => (
                        <div key={snapIndex} className="snapshot-preview">
                          <div className="snapshot-time">{formatTime(snapshot.timestamp)}</div>
                          <div className="snapshot-summary">{snapshot.summary}</div>
                        </div>
                      )
                    )}
                    {region.snapshots.length > 3 && (
                      <button
                        className="snapshot-more"
                        onClick={() => toggleActivityExpansion(index)}
                        type="button">
                        {expandedActivities.has(index)
                          ? `Show less`
                          : `+${region.snapshots.length - 3} more snapshots`}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

