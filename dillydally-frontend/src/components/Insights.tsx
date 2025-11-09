import "../styles/Insights.css";

interface InsightItemProps {
  title: string;
  subtitle: string;
  value: string;
  trend?: string;
}

function InsightItem({ title, subtitle, value, trend }: InsightItemProps) {
  const trendColor = trend?.startsWith("+") ? "#28a745" : trend?.startsWith("-") ? "#dc3545" : "#6c757d";

  return (
    <div className="insight-item">
      <div className="insight-left">
        <div className="insight-title">{title}</div>
        <div className="insight-subtitle">{subtitle}</div>
      </div>
      <div className="insight-right">
        {trend && (
          <span className="insight-trend" style={{ color: trendColor }}>
            {trend}
          </span>
        )}
        <span className="insight-value">{value}</span>
      </div>
    </div>
  );
}

export default function Insights() {
  return (
    <div className="insights-container">
      <h2 className="insights-heading">Insights</h2>

      <div className="insights-section">
        <h3 className="insights-section-title">This Week</h3>

        <InsightItem
          title="Total Focus Time"
          subtitle="Time spent in focused work sessions"
          value="12.5 hrs"
          trend="+15%"
        />

        <InsightItem
          title="Sessions Completed"
          subtitle="Number of pomodoro sessions finished"
          value="24"
          trend="+8%"
        />

        <InsightItem
          title="Break Completion Rate"
          subtitle="Percentage of scheduled breaks taken"
          value="92%"
          trend="+5%"
        />

        <InsightItem
          title="Average Session Length"
          subtitle="Mean duration of focus sessions"
          value="25 min"
          trend="0%"
        />
      </div>

      <div className="insights-section">
        <h3 className="insights-section-title">Productivity Patterns</h3>

        <InsightItem
          title="Most Productive Time"
          subtitle="Your peak focus hour based on completed sessions"
          value="10-11 AM"
        />

        <InsightItem
          title="Current Streak"
          subtitle="Consecutive days with at least one focus session"
          value="7 days"
          trend="+12%"
        />

        <InsightItem
          title="Weekly Goal Progress"
          subtitle="Progress toward 15 hours of focus time"
          value="87%"
          trend="+23%"
        />
      </div>

      <div className="insights-section">
        <h3 className="insights-section-title">AI Insights</h3>

        <InsightItem
          title="AI Assistance Time"
          subtitle="Time using AI tools during focus sessions"
          value="3.2 hrs"
          trend="-5%"
        />

        <InsightItem
          title="Focus Without AI"
          subtitle="Percentage of deep work done independently"
          value="74%"
        />

        <InsightItem
          title="Distraction Alerts"
          subtitle="Times you switched away from focus tasks"
          value="8"
          trend="-20%"
        />
      </div>
    </div>
  );
}

