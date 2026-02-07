"use client";

import { AreaChart, Area, ResponsiveContainer } from "recharts";

interface SparklineChartProps {
  data: number[];
  color?: string;
  height?: number;
}

export function SparklineChart({
  data,
  color = "#32b88d",
  height = 32,
}: SparklineChartProps) {
  const chartData = data.map((value, i) => ({ value, i }));
  const isPositive = data.length >= 2 && data[data.length - 1] >= data[0];
  const sparkColor = color || (isPositive ? "#32b88d" : "#c0152f");

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <Area
          type="monotone"
          dataKey="value"
          stroke={sparkColor}
          fill={sparkColor}
          fillOpacity={0.1}
          strokeWidth={1.5}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
