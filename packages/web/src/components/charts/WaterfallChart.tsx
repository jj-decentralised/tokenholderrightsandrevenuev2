"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface WaterfallItem {
  label: string;
  value: number;
  color: string;
}

interface WaterfallChartProps {
  data: WaterfallItem[];
  height?: number;
}

export function WaterfallChart({ data, height = 280 }: WaterfallChartProps) {
  let cumulative = 0;
  const chartData = data.map((item) => {
    const start = cumulative;
    cumulative += item.value;
    return {
      name: item.label,
      value: item.value,
      start,
      color: item.color,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eeeeec" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "#8f9a9e" }}
          tickLine={false}
          axisLine={{ stroke: "#e5e5e3" }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#8f9a9e" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${(v / 1e6).toFixed(0)}M`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fffffe",
            border: "1px solid #e5e5e3",
            borderRadius: "8px",
            fontSize: 12,
            color: "#133c3b",
          }}
          formatter={(value: number) => [`$${(value / 1e6).toFixed(2)}M`, undefined]}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
