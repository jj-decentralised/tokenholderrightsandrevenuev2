interface MetricCardProps {
  title: string;
  value: string;
  change?: number | null;
  subtitle?: string;
  source?: string;
}

export function MetricCard({ title, value, change, subtitle, source }: MetricCardProps) {
  return (
    <div className="py-3 border-b border-[#e8e8e8]">
      <p className="text-xs text-[#888] uppercase tracking-wide">{title}</p>
      <p className="text-2xl font-bold tabular-nums mt-0.5">{value}</p>
      <div className="flex items-center gap-2 mt-0.5">
        {change != null && (
          <span className={`text-sm tabular-nums font-medium ${change >= 0 ? "text-positive" : "text-negative"}`}>
            {change >= 0 ? "+" : ""}{change.toFixed(2)}%
          </span>
        )}
        {subtitle && <span className="text-xs text-[#888]">{subtitle}</span>}
      </div>
      {source && <p className="text-xs text-[#888] italic mt-0.5">{source}</p>}
    </div>
  );
}
