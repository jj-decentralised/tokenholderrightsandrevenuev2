"use client";

import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import { WSJ, formatAxisUSD } from "@/lib/chart-theme";

interface Protocol {
  name: string;
  slug: string;
  market_cap_usd: number | null;
  real_pe_ratio: number | null;
  period_holder_revenue: number;
  primary_category?: string;
}

interface Props {
  protocols: Protocol[];
  height?: number;
}

export function ValuationScatter({ protocols, height = 400 }: Props) {
  const data = protocols
    .filter((p) => p.market_cap_usd && p.market_cap_usd > 0 && p.real_pe_ratio && p.real_pe_ratio > 0 && p.real_pe_ratio < 1000)
    .map((p) => ({
      x: p.market_cap_usd!,
      y: p.real_pe_ratio!,
      z: Math.max(p.period_holder_revenue || 1, 1),
      name: p.name,
      slug: p.slug,
    }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-[#888] italic" style={{ height }}>
        Insufficient valuation data to display scatter plot
      </div>
    );
  }

  const medianPE = getMedian(data.map((d) => d.y));
  const medianMcap = getMedian(data.map((d) => d.x));

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-lg font-semibold">Valuation Map</h3>
        <span className="text-xs text-[#888] italic">Market Cap vs Real P/E &middot; Dot size = holder revenue</span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
          <XAxis
            type="number"
            dataKey="x"
            name="Market Cap"
            scale="log"
            domain={["auto", "auto"]}
            tickFormatter={formatAxisUSD}
            {...WSJ.axis}
            label={{ value: "Market Cap", position: "bottom", offset: 5, style: { fontSize: 11, fill: "#888" } }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Real P/E"
            scale="log"
            domain={["auto", "auto"]}
            tickFormatter={(v: number) => `${v.toFixed(0)}x`}
            {...WSJ.axis}
            label={{ value: "Real P/E", angle: -90, position: "insideLeft", offset: 5, style: { fontSize: 11, fill: "#888" } }}
          />
          <ZAxis type="number" dataKey="z" range={[40, 400]} />
          <Tooltip
            content={<CustomTooltip />}
            {...WSJ.tooltip}
          />
          <ReferenceLine
            y={medianPE}
            stroke={WSJ.colors.reference}
            strokeDasharray="4 4"
            label={{ value: `Median P/E: ${medianPE.toFixed(1)}x`, position: "insideTopRight", style: { fontSize: 10, fill: "#888" } }}
          />
          <ReferenceLine
            x={medianMcap}
            stroke={WSJ.colors.reference}
            strokeDasharray="4 4"
          />
          <Scatter data={data} {...WSJ.scatter}>
            {data.map((entry, i) => (
              <Cell key={i} fill={WSJ.colors.primary} fillOpacity={0.6} />
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
        Market Cap: {formatAxisUSD(d.x)} &middot; P/E: {d.y.toFixed(1)}x
      </p>
    </div>
  );
}

function getMedian(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
