"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { formatUSD } from "@/lib/api";

interface RevenueChartProps {
  data: Array<{
    date: string;
    daily_fees_usd?: number | null;
    daily_revenue_usd?: number | null;
    daily_holders_revenue_usd?: number | null;
  }>;
  height?: number;
}

export function RevenueChart({ data, height = 300 }: RevenueChartProps) {
  const chartData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    fees: d.daily_fees_usd ?? 0,
    revenue: d.daily_revenue_usd ?? 0,
    holderRevenue: d.daily_holders_revenue_usd ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <defs>
          <linearGradient id="gradFees" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b949e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#8b949e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#58a6ff" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#58a6ff" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradHolder" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3fb950" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#3fb950" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
        <XAxis
          dataKey="date"
          tick={{ fill: "#8b949e", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "#30363d" }}
        />
        <YAxis
          tick={{ fill: "#8b949e", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "#30363d" }}
          tickFormatter={(v) => formatUSD(v, true)}
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
            formatUSD(value),
            name === "fees" ? "Total Fees" : name === "revenue" ? "Protocol Revenue" : "Holder Revenue",
          ]}
        />
        <Legend
          wrapperStyle={{ fontSize: "11px", color: "#8b949e" }}
          formatter={(value) =>
            value === "fees" ? "Total Fees" : value === "revenue" ? "Protocol Revenue" : "Holder Revenue"
          }
        />
        <Area type="monotone" dataKey="fees" stroke="#8b949e" fill="url(#gradFees)" strokeWidth={1.5} />
        <Area type="monotone" dataKey="revenue" stroke="#58a6ff" fill="url(#gradRevenue)" strokeWidth={1.5} />
        <Area type="monotone" dataKey="holderRevenue" stroke="#3fb950" fill="url(#gradHolder)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
