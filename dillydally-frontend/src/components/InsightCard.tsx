import { Card, CardContent } from "@/components/ui/card";

interface InsightCardProps {
  title: string;
  description: string;
  value: string;
  trend?: string;
  trendColor?: string;
}

export default function InsightCard({ title, description, value, trend, trendColor = "text-green-600" }: InsightCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[#1e3a5f] mb-1">{title}</h3>
            <p className="text-sm text-[#5183b5]">{description}</p>
          </div>
          <div className="text-right">
            {trend && (
              <div className={`text-sm font-medium ${trendColor} mb-1`}>
                {trend}
              </div>
            )}
            <div className="text-3xl font-bold text-[#1e3a5f]">{value}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


