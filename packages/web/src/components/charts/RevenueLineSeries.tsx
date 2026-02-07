"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { WSJ, formatAxisUSD } from "@/lib/chart-theme";

interface DataPoint {
  date: string;
  daily_fees_usd?: number | null;
  daily_revenue_usd?: number | null;
  daily_holders_revenue_usd?: number | null;
}

interface Props {
  data: DataPoint[];
  height?: number;
  title?: string;
}

export function RevenueLineSeries({ data, height = 360, title }: Props) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center text-[#888] italic" style={{ height }}>
        No revenue history available
      </div>
    );
  }

  // Format dates for display and sort chronologically
  const chartData = data
    .map((d) => ({
      ...d,
      label: formatDateShort(d.date),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div>
      {title && (
        <div className="flex items-baseline justify-between mb-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <span className="text-xs text-[#888] italic">Source: DefiLlama</span>
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
          <CartesianGrid
            strokeDasharray={WSJ.grid.strokeDasharray}
            stroke={WSJ.grid.stroke}
            horizontal={true}
            vertical={false}
          />
          <XAxis
            dataKey="label"
            {...WSJ.axis}
            interval="preserveStartEnd"
            minTickGap={60}
          />
          <YAxis
            tickFormatter={formatAxisUSD}
            {...WSJ.axis}
            width={60}
          />
          <Tooltip
            contentStyle={WSJ.tooltip.contentStyle}
            formatter={(value: number, name: string) => [
              formatAxisUSD(value),
              name === "daily_fees_usd" ? "Fees" :
              name === "daily_revenue_usd" ? "Revenue" :
              "Holder Revenue",
            ]}
            labelFormatter={(label: string) => label}
          />
          <Legend
            formatter={(value: string) =>
              value === "daily_fees_usd" ? "Fees" :
              value === "daily_revenue_usd" ? "Revenue" :
              "Holder Revenue"
            }
            wrapperStyle={{ fontSize: 12, fontFamily: "'EB Garamond', Georgia, serif" }}
          />
          <Line
            type="monotone"
            dataKey="daily_fees_usd"
            stroke={WSJ.colors.tertiary}
            strokeWidth={1}
            strokeDasharray="4 3"
            dot={false}
            activeDot={WSJ.line.activeDot}
          />
          <Line
            type="monotone"
            dataKey="daily_revenue_usd"
            stroke={WSJ.colors.primary}
            strokeWidth={1.5}
            dot={false}
            activeDot={WSJ.line.activeDot}
          />
          <Line
            type="monotone"
            dataKey="daily_holders_revenue_usd"
            stroke={WSJ.colors.secondary}
            strokeWidth={2}
            dot={false}
            activeDot={WSJ.line.activeDot}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
