"use client";

import { cn } from "@/lib/api";
import type { TimeRange } from "@/lib/api";

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  asOf?: string;
}

const RANGES: { value: TimeRange; label: string }[] = [
  { value: "1d", label: "1D" },
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
  { value: "1y", label: "1Y" },
  { value: "all", label: "All" },
];

export function TimeRangeSelector({ value, onChange, asOf }: TimeRangeSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center bg-[#161b22] border border-[#30363d] rounded-md overflow-hidden">
        {RANGES.map((range) => (
          <button
            key={range.value}
            onClick={() => onChange(range.value)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium transition-colors",
              value === range.value
                ? "bg-[#58a6ff] text-white"
                : "text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]"
            )}
          >
            {range.label}
          </button>
        ))}
      </div>
      {asOf && (
        <span className="text-[10px] text-[#8b949e]">
          as of {new Date(asOf).toLocaleString()}
        </span>
      )}
    </div>
  );
}
