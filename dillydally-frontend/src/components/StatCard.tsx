import { Card, CardContent } from "@/components/ui/card";
import type { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  title: string;
  value: string;
  iconBg?: string;
}

export default function StatCard({ icon, title, value, iconBg = "bg-blue-100" }: StatCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="flex items-center gap-4 p-6">
        <div className={`${iconBg} p-3 rounded-lg`}>
          {icon}
        </div>
        <div className="flex flex-col">
          <p className="text-sm text-[#5183b5] font-medium">{title}</p>
          <p className="text-2xl font-bold text-[#1e3a5f]">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

