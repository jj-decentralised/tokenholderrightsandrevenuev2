"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface RevenueChartProps {
  data: Array<{
    date: string;
    fees?: number;
    revenue?: number;
    holder_revenue?: number;
  }>;
  height?: number;
}

export function RevenueChart({ data, height = 300 }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eeeeec" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#8f9a9e" }}
          tickLine={false}
          axisLine={{ stroke: "#e5e5e3" }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#8f9a9e" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`}
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
        <Area
          type="monotone"
          dataKey="fees"
          stroke="#8f9a9e"
          fill="#f7f7f5"
          strokeWidth={1.5}
          name="Fees"
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#2563eb"
          fill="#2563eb"
          fillOpacity={0.1}
          strokeWidth={1.5}
          name="Revenue"
        />
        <Area
          type="monotone"
          dataKey="holder_revenue"
          stroke="#32b88d"
          fill="#32b88d"
          fillOpacity={0.15}
          strokeWidth={2}
          name="Holder Revenue"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
