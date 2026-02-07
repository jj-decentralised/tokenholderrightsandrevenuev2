import { cn, formatUSD, formatPercent } from "@/lib/api";

interface MetricCardProps {
  title: string;
  value: string;
  change?: number | null;
  subtitle?: string;
  source?: string;
  className?: string;
}

export function MetricCard({ title, value, change, subtitle, source, className }: MetricCardProps) {
  return (
    <div className={cn("bg-[#161b22] border border-[#30363d] rounded-lg p-4", className)}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-[#8b949e] uppercase tracking-wide">{title}</span>
        {source && (
          <span className="text-[10px] text-[#8b949e] bg-[#21262d] px-1.5 py-0.5 rounded">
            {source}
          </span>
        )}
      </div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="flex items-center gap-2 mt-1">
        {change != null && (
          <span
            className={cn(
              "text-sm tabular-nums",
              change >= 0 ? "text-[#3fb950]" : "text-[#f85149]"
            )}
          >
            {formatPercent(change)}
          </span>
        )}
        {subtitle && <span className="text-xs text-[#8b949e]">{subtitle}</span>}
      </div>
    </div>
  );
}
