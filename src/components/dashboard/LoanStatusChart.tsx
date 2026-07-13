"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card } from "@heroui/react";

const COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  UNDER_REVIEW: "#8b5cf6",
  APPROVED: "#3b82f6",
  DISBURSED: "#10b981",
  COMPLETED: "#06b6d4",
  DEFAULTED: "#ef4444",
};

interface LoanStatusChartProps {
  data: Record<string, number>;
}

export default function LoanStatusChart({ data }: LoanStatusChartProps) {
  const chartData = Object.entries(data)
    .filter(([, count]) => count > 0)
    .map(([name, value]) => ({
      name,
      value,
    }));

  if (chartData.length === 0) {
    return (
      <Card className="border border-slate-200 shadow-sm">
        <Card.Header>
          <p className="text-lg font-semibold text-slate-800">Mortgage Status Distribution</p>
        </Card.Header>
        <Card.Content className="flex items-center justify-center h-64">
          <p className="text-slate-400">No mortgage data available</p>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card className="border border-slate-200 shadow-sm">
      <Card.Header>
        <p className="text-lg font-semibold text-slate-800">Mortgage Status Distribution</p>
      </Card.Header>
      <Card.Content>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={3}
              dataKey="value"
              label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={COLORS[entry.name] || "#94a3b8"}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Card.Content>
    </Card>
  );
}
