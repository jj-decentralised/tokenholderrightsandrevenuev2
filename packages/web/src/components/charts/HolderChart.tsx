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

interface HolderChartProps {
  data: Array<{
    date: string;
    holders: number;
    top10_pct?: number;
  }>;
  height?: number;
}

export function HolderChart({ data, height = 250 }: HolderChartProps) {
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
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fffffe",
            border: "1px solid #e5e5e3",
            borderRadius: "8px",
            fontSize: 12,
            color: "#133c3b",
          }}
        />
        <Area
          type="monotone"
          dataKey="holders"
          stroke="#32b88d"
          fill="#32b88d"
          fillOpacity={0.12}
          strokeWidth={2}
          name="Total Holders"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
