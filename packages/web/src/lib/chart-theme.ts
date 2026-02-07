export const WSJ = {
  colors: {
    primary: "#111111",
    secondary: "#0274B6",
    tertiary: "#888888",
    grid: "#e8e8e8",
    axis: "#d0d0d0",
    label: "#888888",
    positive: "#1a7a2e",
    negative: "#c0152f",
    reference: "#d0d0d0",
    bg: "#ffffff",
    muted: "#f8f7f4",
  },
  axis: {
    tick: { fontSize: 11, fill: "#888888", fontFamily: "'EB Garamond', Georgia, serif" },
    tickLine: false as const,
    axisLine: { stroke: "#d0d0d0" },
  },
  grid: {
    strokeDasharray: "2 4",
    stroke: "#e8e8e8",
    horizontal: true,
    vertical: false,
  },
  tooltip: {
    contentStyle: {
      backgroundColor: "#ffffff",
      border: "1px solid #d0d0d0",
      borderRadius: 0,
      fontSize: 13,
      fontFamily: "'EB Garamond', Georgia, serif",
      color: "#111111",
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      padding: "8px 12px",
    },
    cursor: { stroke: "#d0d0d0", strokeDasharray: "4 4" },
  },
  dot: {
    fill: "#111111",
    r: 4,
    strokeWidth: 0,
  },
  line: {
    strokeWidth: 1.5,
    dot: false as const,
    activeDot: { r: 4, fill: "#0274B6", stroke: "#ffffff", strokeWidth: 2 },
  },
  scatter: {
    fill: "#111111",
    fillOpacity: 0.7,
    stroke: "none",
  },
};

export function formatAxisUSD(value: number): string {
  if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(0)}B`;
  if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  if (Math.abs(value) >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

export function formatAxisPercent(value: number): string {
  return `${value.toFixed(0)}%`;
}

export function formatAxisNumber(value: number): string {
  if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (Math.abs(value) >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
  return value.toFixed(0);
}
