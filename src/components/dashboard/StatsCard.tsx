import { Card } from "@heroui/react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: "blue" | "green" | "purple" | "orange" | "red" | "indigo";
}

const colorMap = {
  blue: "from-blue-500 to-blue-600",
  green: "from-green-500 to-green-600",
  purple: "from-purple-500 to-purple-600",
  orange: "from-orange-500 to-orange-600",
  red: "from-red-500 to-red-600",
  indigo: "from-indigo-500 to-indigo-600",
};

const bgColorMap = {
  blue: "bg-blue-50",
  green: "bg-green-50",
  purple: "bg-purple-50",
  orange: "bg-orange-50",
  red: "bg-red-50",
  indigo: "bg-indigo-50",
};

export default function StatsCard({ title, value, icon, color }: StatsCardProps) {
  return (
    <Card className="border border-slate-200 shadow-sm">
      <Card.Content className="flex flex-row items-center gap-4">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", bgColorMap[color])}>
          <div className={cn("w-6 h-6 text-white", `bg-gradient-to-br ${colorMap[color]} rounded-lg flex items-center justify-center`)}>
            {icon}
          </div>
        </div>
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
      </Card.Content>
    </Card>
  );
}
