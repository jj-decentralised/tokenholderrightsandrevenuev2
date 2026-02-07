import { cn, formatPercent } from "@/lib/api";

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
    <div className={cn("bg-white border border-[#e5e5e3] rounded-lg p-4", className)}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-[#8f9a9e] uppercase tracking-wide font-medium">{title}</span>
        {source && (
          <span className="text-[10px] text-[#8f9a9e] bg-[#f7f7f5] px-1.5 py-0.5 rounded">
            {source}
          </span>
        )}
      </div>
      <div className="text-2xl font-semibold tabular-nums text-[#133c3b]">{value}</div>
      <div className="flex items-center gap-2 mt-1">
        {change != null && (
          <span className={cn("text-sm tabular-nums font-medium", change >= 0 ? "text-[#32b88d]" : "text-[#c0152f]")}>
            {formatPercent(change)}
          </span>
        )}
        {subtitle && <span className="text-xs text-[#8f9a9e]">{subtitle}</span>}
      </div>
    </div>
  );
}
