"use client";

import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import { WSJ, formatAxisPercent, formatAxisNumber } from "@/lib/chart-theme";

interface Protocol {
  name: string;
  slug: string;
  holder_growth_30d: number | null;
  revenue_yield_pct: number | null;
  holder_count: number | null;
  primary_category?: string;
}

const CAT_COLORS: Record<string, string> = {
  derivatives: "#111111",
  dex: "#0274B6",
  lending: "#888888",
  cdp: "#444444",
  liquid_staking: "#555555",
  yield: "#666666",
};

interface Props {
  protocols: Protocol[];
  height?: number;
}

export function GrowthYieldScatter({ protocols, height = 400 }: Props) {
  const data = protocols
    .filter((p) => p.holder_growth_30d != null && p.revenue_yield_pct != null)
    .map((p) => ({
      x: p.holder_growth_30d!,
      y: p.revenue_yield_pct!,
      z: Math.max(p.holder_count || 100, 100),
      name: p.name,
      slug: p.slug,
      category: p.primary_category || "other",
    }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-[#888] italic" style={{ height }}>
        Insufficient growth/yield data
      </div>
    );
  }

  const avgYield = data.reduce((s, d) => s + d.y, 0) / data.length;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-lg font-semibold">Growth vs Yield</h3>
        <span className="text-xs text-[#888] italic">Holder growth (30d) vs Revenue Yield &middot; Dot size = holders</span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
          <XAxis
            type="number"
            dataKey="x"
            name="Holder Growth"
            tickFormatter={formatAxisPercent}
            {...WSJ.axis}
            label={{ value: "Holder Growth 30D", position: "bottom", offset: 5, style: { fontSize: 11, fill: "#888" } }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Revenue Yield"
            tickFormatter={formatAxisPercent}
            {...WSJ.axis}
            label={{ value: "Revenue Yield", angle: -90, position: "insideLeft", offset: 5, style: { fontSize: 11, fill: "#888" } }}
          />
          <ZAxis type="number" dataKey="z" range={[30, 300]} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine x={0} stroke={WSJ.colors.reference} strokeDasharray="4 4" />
          <ReferenceLine
            y={avgYield}
            stroke={WSJ.colors.reference}
            strokeDasharray="4 4"
            label={{ value: `Avg: ${avgYield.toFixed(1)}%`, position: "insideTopRight", style: { fontSize: 10, fill: "#888" } }}
          />
          <Scatter data={data}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={CAT_COLORS[entry.category] || "#888888"}
                fillOpacity={0.6}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={WSJ.tooltip.contentStyle}>
      <p className="font-semibold text-sm">{d.name}</p>
      <p className="text-xs text-[#444]">
        Growth: {d.x.toFixed(1)}% &middot; Yield: {d.y.toFixed(1)}% &middot; {formatAxisNumber(d.z)} holders
      </p>
    </div>
  );
}
