import { cn } from "@/lib/api";

interface ConfidenceBadgeProps {
  score: number;
  label?: string;
}

export function ConfidenceBadge({ score, label }: ConfidenceBadgeProps) {
  const level = score >= 0.9 ? "high" : score >= 0.7 ? "medium" : "low";
  const colors = {
    high: "text-[#32b88d] border-[#32b88d]/20 bg-[#32b88d]/5",
    medium: "text-[#a84b2f] border-[#a84b2f]/20 bg-[#a84b2f]/5",
    low: "text-[#c0152f] border-[#c0152f]/20 bg-[#c0152f]/5",
  };

  return (
    <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-medium", colors[level])}>
      {label || `${(score * 100).toFixed(0)}% confidence`}
    </span>
  );
}
