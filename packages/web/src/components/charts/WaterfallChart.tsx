"use client";

import { formatUSD } from "@/lib/api";

interface WaterfallItem {
  label: string;
  value: number;
  type: "total" | "positive" | "negative" | "subtotal";
  percentage?: number;
}

interface WaterfallChartProps {
  items: WaterfallItem[];
  height?: number;
}

export function WaterfallChart({ items, height = 280 }: WaterfallChartProps) {
  const maxValue = Math.max(...items.map((i) => Math.abs(i.value)));
  const barWidth = Math.min(80, (600 - items.length * 8) / items.length);

  const colors = {
    total: "#58a6ff",
    positive: "#3fb950",
    negative: "#f85149",
    subtotal: "#8b5cf6",
  };

  let runningTotal = 0;

  return (
    <div className="w-full overflow-x-auto">
      <svg width={Math.max(600, items.length * (barWidth + 8) + 40)} height={height + 60}>
        {items.map((item, i) => {
          const x = 20 + i * (barWidth + 8);
          const barHeight = (Math.abs(item.value) / maxValue) * height * 0.7;
          let y: number;

          if (item.type === "total" || item.type === "subtotal") {
            y = height - barHeight;
            runningTotal = item.value;
          } else {
            const prevTotal = runningTotal;
            runningTotal += item.type === "negative" ? -item.value : item.value;
            y = height - ((Math.max(prevTotal, runningTotal) / maxValue) * height * 0.7);
          }

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 2)}
                fill={colors[item.type]}
                rx={2}
                opacity={0.85}
              />
              <text
                x={x + barWidth / 2}
                y={y - 6}
                textAnchor="middle"
                fill="#e6edf3"
                fontSize="10"
                fontFamily="monospace"
              >
                {formatUSD(item.value, true)}
              </text>
              {item.percentage != null && (
                <text
                  x={x + barWidth / 2}
                  y={y - 18}
                  textAnchor="middle"
                  fill="#8b949e"
                  fontSize="9"
                >
                  {item.percentage.toFixed(1)}%
                </text>
              )}
              <text
                x={x + barWidth / 2}
                y={height + 16}
                textAnchor="middle"
                fill="#8b949e"
                fontSize="9"
                dominantBaseline="hanging"
              >
                {item.label.length > 12 ? item.label.slice(0, 12) + "..." : item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
