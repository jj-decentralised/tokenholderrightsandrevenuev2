"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatNumber, formatPercent } from "@/lib/api";

interface HolderChartProps {
  data: Array<{
    snapshot_date: string;
    total_holders?: number | null;
    top10_pct?: number | null;
  }>;
  height?: number;
}

export function HolderChart({ data, height = 250 }: HolderChartProps) {
  const chartData = data.map((d) => ({
    date: new Date(d.snapshot_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    holders: d.total_holders ?? 0,
    concentration: d.top10_pct ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
        <XAxis
          dataKey="date"
          tick={{ fill: "#8b949e", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "#30363d" }}
        />
        <YAxis
          yAxisId="left"
          tick={{ fill: "#8b949e", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "#30363d" }}
          tickFormatter={(v) => formatNumber(v, true)}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fill: "#8b949e", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "#30363d" }}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#161b22",
            border: "1px solid #30363d",
            borderRadius: "6px",
            color: "#e6edf3",
            fontSize: "12px",
          }}
          formatter={(value: number, name: string) => [
            name === "holders" ? formatNumber(value) : `${value.toFixed(1)}%`,
            name === "holders" ? "Total Holders" : "Top 10 Concentration",
          ]}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="holders"
          stroke="#58a6ff"
          strokeWidth={2}
          dot={false}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="concentration"
          stroke="#f0883e"
          strokeWidth={1.5}
          dot={false}
          strokeDasharray="4 4"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
