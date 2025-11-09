import { useQuery } from "convex/react";
import { useState, useEffect } from "react";
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

interface AttentionTimelineRegion {
  attentionState: string;
  startTime: number;
  endTime: number;
  duration: number;
  snapshots: Array<{
    timestamp: number;
    attentionState: string;
  }>;
}

export default function SessionPlayback({ sessionId, onDismiss }: SessionPlaybackProps) {
  const snapshots = useQuery(
    api.functions.getSessionSnapshots,
    sessionId ? { sessionId } : "skip"
  );
  const cameraSnapshots = useQuery(
    api.functions.getSessionCameraSnapshots,
    sessionId ? { sessionId } : "skip"
  );
  const [expandedActivities, setExpandedActivities] = useState<Set<number>>(new Set());
  const [clickedRegion, setClickedRegion] = useState<{
    index: number;
    position: { x: number; y: number };
    label: string;
  } | null>(null);

  // Handle clicking outside to dismiss popup
  useEffect(() => {
    if (clickedRegion) {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest(".attention-region-popup") && !target.closest(".clickable-attention")) {
          setClickedRegion(null);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [clickedRegion]);

  if (!sessionId || snapshots === undefined || cameraSnapshots === undefined) {
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

  // Normalize attention state - group all "away" directions into one state
  const normalizeAttentionState = (state: string): string => {
    if (state === "away_left" || state === "away_right" || state === "away_up" || state === "away_down") {
      return "away";
    }
    return state;
  };

  // Process camera snapshots into attention timeline regions with 2-second aggregation
  const processCameraSnapshots = (): AttentionTimelineRegion[] => {
    if (!cameraSnapshots || cameraSnapshots.length === 0) {
      return [];
    }

    // Sort camera snapshots by timestamp (ascending)
    const sortedSnapshots = [...cameraSnapshots].sort((a, b) => a.timestamp - b.timestamp);

    // Group snapshots into 2-second intervals
    // Key: floor(timestamp / 2000) * 2000 (start of 2-second interval)
    const intervalMap = new Map<number, Array<{ timestamp: number; attentionState: string }>>();

    for (const snapshot of sortedSnapshots) {
      const normalizedState = normalizeAttentionState(snapshot.attentionState);
      // Floor to nearest 2-second interval
      const intervalStart = Math.floor(snapshot.timestamp / 2000) * 2000;
      
      if (!intervalMap.has(intervalStart)) {
        intervalMap.set(intervalStart, []);
      }
      intervalMap.get(intervalStart)!.push({
        timestamp: snapshot.timestamp,
        attentionState: normalizedState,
      });
    }

    // Determine majority state for each interval
    const intervals: Array<{ startTime: number; endTime: number; state: string; snapshots: Array<{ timestamp: number; attentionState: string }> }> = [];
    
    for (const [intervalStart, snapshots] of intervalMap.entries()) {
      // Count occurrences of each state in this interval
      const stateCounts = new Map<string, number>();
      for (const snapshot of snapshots) {
        stateCounts.set(snapshot.attentionState, (stateCounts.get(snapshot.attentionState) || 0) + 1);
      }

      // Find the majority state
      let majorityState = "";
      let maxCount = 0;
      for (const [state, count] of stateCounts.entries()) {
        if (count > maxCount) {
          maxCount = count;
          majorityState = state;
        }
      }

      intervals.push({
        startTime: intervalStart,
        endTime: intervalStart + 2000, // 2 second duration
        state: majorityState,
        snapshots: snapshots,
      });
    }

    // Sort intervals by start time
    intervals.sort((a, b) => a.startTime - b.startTime);

    // Merge consecutive intervals with the same state into regions
    const regions: AttentionTimelineRegion[] = [];
    let currentRegion: AttentionTimelineRegion | null = null;

    for (const interval of intervals) {
      if (!currentRegion || currentRegion.attentionState !== interval.state) {
        // Start a new region
        if (currentRegion) {
          // Close previous region - use the last interval's end time
          currentRegion.endTime = currentRegion.endTime;
          currentRegion.duration = currentRegion.endTime - currentRegion.startTime;
          regions.push(currentRegion);
        }

        currentRegion = {
          attentionState: interval.state,
          startTime: interval.startTime,
          endTime: interval.endTime,
          duration: interval.endTime - interval.startTime,
          snapshots: interval.snapshots,
        };
      } else {
        // Continue current region - merge intervals
        currentRegion.endTime = interval.endTime;
        currentRegion.duration = currentRegion.endTime - currentRegion.startTime;
        currentRegion.snapshots.push(...interval.snapshots);
      }
    }

    // Close the last region
    if (currentRegion) {
      // Use actual snapshot timestamps for more accurate end time
      if (currentRegion.snapshots.length > 0) {
        const maxTimestamp = Math.max(...currentRegion.snapshots.map(s => s.timestamp));
        currentRegion.endTime = Math.max(currentRegion.endTime, maxTimestamp);
      }
      currentRegion.duration = currentRegion.endTime - currentRegion.startTime;
      regions.push(currentRegion);
    }

    return regions;
  };

  const attentionTimelineRegions = processCameraSnapshots();

  // Calculate total session duration (use the earliest of either timeline)
  const sessionStartTime = Math.min(
    timelineRegions.length > 0 ? timelineRegions[0].startTime : Infinity,
    attentionTimelineRegions.length > 0 ? attentionTimelineRegions[0].startTime : Infinity
  );
  const sessionEndTime = Math.max(
    timelineRegions.length > 0 ? timelineRegions[timelineRegions.length - 1].endTime : 0,
    attentionTimelineRegions.length > 0 ? attentionTimelineRegions[attentionTimelineRegions.length - 1].endTime : 0
  );
  const sessionDuration = sessionEndTime > sessionStartTime ? sessionEndTime - sessionStartTime : 0;

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

  // Calculate attention/focus stats
  const focusedTime = attentionTimelineRegions
    .filter((r) => r.attentionState === "looking_at_screen")
    .reduce((sum, r) => sum + r.duration, 0);
  const focusPercentage = sessionDuration > 0 ? (focusedTime / sessionDuration) * 100 : 0;
  const distractionCount = attentionTimelineRegions.filter((r) => r.attentionState === "away").length;

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
            <div className="playback-stat">
              <div className="playback-stat-label">Focus Time</div>
              <div className="playback-stat-value">{formatDuration(focusedTime)}</div>
            </div>
            <div className="playback-stat">
              <div className="playback-stat-label">Focus Rate</div>
              <div className="playback-stat-value">{focusPercentage.toFixed(1)}%</div>
            </div>
            <div className="playback-stat">
              <div className="playback-stat-label">Distraction Events</div>
              <div className="playback-stat-value">{distractionCount}</div>
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
                    ? ((region.startTime - sessionStartTime) / sessionDuration) * 100
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

          {/* Attention Timeline */}
          {attentionTimelineRegions.length > 0 && (
            <div className="session-playback-timeline-container">
              <h3 className="timeline-title">Attention & Focus Timeline</h3>
              <div className="timeline-wrapper">
                {attentionTimelineRegions.map((region, index) => {
                  const percentage = calculatePercentage(region.duration);
                  const leftPercentage =
                    sessionDuration > 0
                      ? ((region.startTime - sessionStartTime) / sessionDuration) * 100
                      : 0;

                  const getAttentionLabel = (state: string): string => {
                    switch (state) {
                      case "looking_at_screen":
                        return "Focused";
                      case "away":
                        return "Looking Away";
                      case "no_face":
                        return "No Face";
                      default:
                        return state;
                    }
                  };

                  const isFocused = region.attentionState === "looking_at_screen";
                  const isNoFace = region.attentionState === "no_face";
                  const isAway = region.attentionState === "away";
                  const isClickable = isFocused || isAway;

                  const handleRegionClick = (e: React.MouseEvent<HTMLDivElement>) => {
                    if (isClickable) {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      setClickedRegion({
                        index,
                        position: {
                          x: rect.left + rect.width / 2,
                          y: rect.bottom,
                        },
                        label: getAttentionLabel(region.attentionState),
                      });
                    }
                  };

                  return (
                    <div
                      key={index}
                      className={`timeline-region ${isFocused ? "focused" : isNoFace ? "no-face" : "distracted"} ${isClickable ? "clickable-attention" : ""}`}
                      style={{
                        width: `${percentage}%`,
                        left: `${leftPercentage}%`,
                        cursor: isClickable ? "pointer" : "default",
                      }}
                      onClick={isClickable ? handleRegionClick : undefined}>
                      <div className="timeline-region-content">
                        {isFocused && (
                          <div className="timeline-region-icon" title="Focused">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </div>
                        )}
                        {isAway && (
                          <div className="timeline-region-icon" title="Looking Away">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                          </div>
                        )}
                        {isNoFace && (
                          <div className="timeline-region-label">{getAttentionLabel(region.attentionState)}</div>
                        )}
                        <div className="timeline-region-duration">{formatDuration(region.duration)}</div>
                      </div>
                      {!isClickable && (
                        <div className="timeline-region-tooltip">
                          <div className="tooltip-activity">{getAttentionLabel(region.attentionState)}</div>
                          <div className="tooltip-time">
                            {formatTime(region.startTime)} - {formatTime(region.endTime)}
                          </div>
                          <div className="tooltip-duration">Duration: {formatDuration(region.duration)}</div>
                          <div className={`tooltip-status ${isFocused ? "focused" : "distracted"}`}>
                            {isFocused ? "✓ Focused on Screen" : isNoFace ? "⚠ No Face Detected" : "✗ Looking Away"}
                          </div>
                          <div className="tooltip-snapshots">{region.snapshots.length} camera readings</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Popup for attention regions */}
          {clickedRegion && (
            <div
              className="attention-region-popup"
              style={{
                left: `${clickedRegion.position.x}px`,
                top: `${clickedRegion.position.y + 8}px`,
              }}>
              {clickedRegion.label}
            </div>
          )}

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
                  <div className="activity-snapshots-wrapper">
                    <div className={`activity-snapshots ${expandedActivities.has(index) ? "expanded" : ""}`}>
                      {(expandedActivities.has(index) ? region.snapshots : region.snapshots.slice(0, 3)).map(
                        (snapshot, snapIndex) => (
                          <div key={snapIndex} className="snapshot-preview">
                            <div className="snapshot-time">{formatTime(snapshot.timestamp)}</div>
                            <div className="snapshot-summary">{snapshot.summary}</div>
                          </div>
                        )
                      )}
                    </div>
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

