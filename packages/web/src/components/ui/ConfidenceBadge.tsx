import { cn } from "@/lib/api";

interface ConfidenceBadgeProps {
  score: number; // 0-1
  label?: string;
}

export function ConfidenceBadge({ score, label }: ConfidenceBadgeProps) {
  const level = score >= 0.9 ? "high" : score >= 0.7 ? "medium" : "low";
  const colors = {
    high: "text-[#3fb950] border-[#3fb950]/30 bg-[#3fb950]/10",
    medium: "text-[#d29922] border-[#d29922]/30 bg-[#d29922]/10",
    low: "text-[#f85149] border-[#f85149]/30 bg-[#f85149]/10",
  };

  return (
    <span className={cn("text-[10px] px-1.5 py-0.5 rounded border", colors[level])}>
      {label || `${(score * 100).toFixed(0)}% confidence`}
    </span>
  );
}
