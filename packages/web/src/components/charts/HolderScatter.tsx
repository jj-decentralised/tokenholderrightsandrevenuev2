"use client";

import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import { WSJ, formatAxisNumber, formatAxisPercent } from "@/lib/chart-theme";

interface TokenData {
  name: string;
  slug: string;
  holder_count: number | null;
  holder_growth_30d: number | null;
  productive_token_score: number | null;
}

interface Props {
  tokens: TokenData[];
  height?: number;
}

export function HolderScatter({ tokens, height = 400 }: Props) {
  const data = tokens
    .filter((t) => t.holder_count && t.holder_count > 0 && t.holder_growth_30d != null)
    .map((t) => ({
      x: t.holder_count!,
      y: t.holder_growth_30d!,
      z: t.productive_token_score || 5,
      name: t.name,
      slug: t.slug,
    }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-[#888] italic" style={{ height }}>
        Insufficient holder data
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-lg font-semibold">Holder Landscape</h3>
        <span className="text-xs text-[#888] italic">Total holders vs 30-day growth</span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
          <XAxis
            type="number"
            dataKey="x"
            name="Holders"
            scale="log"
            domain={["auto", "auto"]}
            tickFormatter={formatAxisNumber}
            {...WSJ.axis}
            label={{ value: "Total Holders", position: "bottom", offset: 5, style: { fontSize: 11, fill: "#888" } }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Growth"
            tickFormatter={formatAxisPercent}
            {...WSJ.axis}
            label={{ value: "Growth 30D", angle: -90, position: "insideLeft", offset: 5, style: { fontSize: 11, fill: "#888" } }}
          />
          <ZAxis type="number" dataKey="z" range={[30, 250]} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke={WSJ.colors.reference} strokeDasharray="4 4" />
          <Scatter data={data}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.y >= 0 ? WSJ.colors.primary : WSJ.colors.negative}
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
        Holders: {formatAxisNumber(d.x)} &middot; Growth: {d.y >= 0 ? "+" : ""}{d.y.toFixed(1)}%
      </p>
    </div>
  );
}
