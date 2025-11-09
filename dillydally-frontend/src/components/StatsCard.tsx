import "../styles/StatsCard.css";

interface StatsCardProps {
  icon: string;
  title: string;
  value: string;
  iconBgColor?: string;
}

export default function StatsCard({ icon, title, value, iconBgColor = "#d4f1f4" }: StatsCardProps) {
  return (
    <div className="stats-card">
      <div className="stats-icon" style={{ backgroundColor: iconBgColor }}>
        {icon}
      </div>
      <div className="stats-content">
        <div className="stats-title">{title}</div>
        <div className="stats-value">{value}</div>
      </div>
    </div>
  );
}

