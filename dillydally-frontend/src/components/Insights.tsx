import "../styles/Insights.css";
import { useQuery } from "convex/react";
import { api } from "../lib/convexApi";

interface InsightItemProps {
  title: string;
  subtitle: string;
  value: string;
  trend?: string;
}

function InsightItem({ title, subtitle, value, trend }: InsightItemProps) {
  const trendColor = trend?.startsWith("+") ? "#17a2b8" : trend?.startsWith("-") ? "#dc3545" : "#6c757d";
  const trendBgColor = trend?.startsWith("+") ? "#d4f1f4" : trend?.startsWith("-") ? "#f8d7da" : "#f8f9fa";

  return (
    <div className="insight-item">
      <div className="insight-left">
        <div className="insight-title">{title}</div>
        <div className="insight-subtitle">{subtitle}</div>
      </div>
      <div className="insight-right">
        {trend && (
          <span className="insight-trend" style={{ color: trendColor, backgroundColor: trendBgColor }}>
            {trend}
          </span>
        )}
        <span className="insight-value">{value}</span>
      </div>
    </div>
  );
}

function formatDuration(ms: number): string {
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  if (hours > 0) {
    const decimalHours = ms / (60 * 60 * 1000);
    return `${decimalHours.toFixed(1)} hrs`;
  }
  return `${minutes} min`;
}

function calculateMostProductiveHour(timestamps: number[]): number | null {
  if (timestamps.length === 0) return null;

  // Count productive snapshots by hour in user's local timezone
  const hourCounts: Record<number, number> = {};
  timestamps.forEach((timestamp) => {
    const date = new Date(timestamp);
    const hour = date.getHours(); // Uses user's local timezone
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  // Find the hour with the most productive snapshots
  const mostProductiveHour = Object.entries(hourCounts).reduce((a, b) =>
    hourCounts[parseInt(b[0])] > hourCounts[parseInt(a[0])] ? b : a
  );

  return parseInt(mostProductiveHour[0]);
}

function formatHour(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const nextHour = hour === 23 ? 0 : hour + 1;
  const displayNextHour = nextHour === 0 ? 12 : nextHour > 12 ? nextHour - 12 : nextHour;
  return `${displayHour}-${displayNextHour} ${period}`;
}

export default function Insights() {
  const insights = useQuery(api.functions.getWeeklyInsights);

  if (insights === undefined) {
    return (
      <div className="insights-container">
        <h2 className="insights-heading">Insights</h2>
        <div style={{ padding: "2rem", textAlign: "center", color: "#6c757d" }}>Loading insights...</div>
      </div>
    );
  }

  if (insights === null) {
    return (
      <div className="insights-container">
        <h2 className="insights-heading">Insights</h2>
        <div style={{ padding: "2rem", textAlign: "center", color: "#6c757d" }}>
          Please sign in to view your insights.
        </div>
      </div>
    );
  }

  return (
    <div className="insights-container">
      <h2 className="insights-heading">Insights</h2>

      <div className="insights-section">
        <h3 className="insights-section-title">This Week</h3>

        <InsightItem
          title="Total Focus Time"
          subtitle="Time spent in focused work sessions"
          value={formatDuration(insights.totalFocusTime)}
          trend={insights.totalFocusTimeTrend}
        />

        <InsightItem
          title="Sessions Completed"
          subtitle="Number of pomodoro sessions finished"
          value={insights.sessionsCompleted.toString()}
          trend={insights.sessionsCompletedTrend}
        />

        <InsightItem title="Break Completion Rate" subtitle="Percentage of scheduled breaks taken" value="N/A" />

        <InsightItem
          title="Average Session Length"
          subtitle="Mean duration of focus sessions"
          value={formatDuration(insights.averageSessionLength)}
          trend={insights.averageSessionLengthTrend}
        />
      </div>

      <div className="insights-section">
        <h3 className="insights-section-title">Productivity Patterns</h3>

        <InsightItem
          title="Most Productive Time"
          subtitle="Your peak focus hour based on completed sessions"
          value={(() => {
            const hour = calculateMostProductiveHour(insights.productiveSnapshotTimestamps);
            return hour !== null ? formatHour(hour) : "N/A";
          })()}
        />

        <InsightItem
          title="Current Streak"
          subtitle="Consecutive days with at least one focus session"
          value={`${insights.currentStreak} ${insights.currentStreak === 1 ? "day" : "days"}`}
        />

        <InsightItem
          title="Weekly Goal Progress"
          subtitle="Progress toward 15 hours of focus time"
          value={`${insights.weeklyGoalProgress.toFixed(0)}%`}
        />
      </div>

      <div className="insights-section">
        <h3 className="insights-section-title">AI Insights</h3>

        <InsightItem
          title="AI Assistance Time"
          subtitle="Time using AI tools during focus sessions"
          value={formatDuration(insights.aiAssistanceTime)}
          trend={insights.aiAssistanceTimeTrend}
        />

        <InsightItem
          title="Focus Without AI"
          subtitle="Percentage of deep work done independently"
          value={`${insights.focusWithoutAI.toFixed(0)}%`}
        />

        <InsightItem
          title="Distraction Alerts"
          subtitle="Times you switched away from focus tasks"
          value={insights.distractionAlerts.toString()}
          trend={insights.distractionAlertsTrend}
        />
      </div>
    </div>
  );
}
