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
      <div className="flex items-center bg-[#f7f7f5] border border-[#e5e5e3] rounded-lg overflow-hidden">
        {RANGES.map((range) => (
          <button
            key={range.value}
            onClick={() => onChange(range.value)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium transition-colors",
              value === range.value
                ? "bg-[#32b88d] text-white"
                : "text-[#626c71] hover:text-[#133c3b] hover:bg-[#eeeeec]"
            )}
          >
            {range.label}
          </button>
        ))}
      </div>
      {asOf && (
        <span className="text-[10px] text-[#8f9a9e]">
          as of {new Date(asOf).toLocaleString()}
        </span>
      )}
    </div>
  );
}
