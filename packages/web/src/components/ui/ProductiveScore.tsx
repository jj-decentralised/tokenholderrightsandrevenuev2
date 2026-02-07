import { cn } from "@/lib/api";

interface ProductiveScoreProps {
  score: number | null;
  size?: "sm" | "md" | "lg";
}

export function ProductiveScore({ score, size = "md" }: ProductiveScoreProps) {
  if (score == null) return <span className="text-[#8f9a9e]">&mdash;</span>;

  const getColor = (s: number) => {
    if (s >= 8) return "text-[#32b88d]";
    if (s >= 6) return "text-[#2563eb]";
    if (s >= 4) return "text-[#a84b2f]";
    if (s >= 2) return "text-[#c0152f]";
    return "text-[#8f9a9e]";
  };

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base font-semibold",
    lg: "text-xl font-bold",
  };

  return (
    <span className={cn("tabular-nums", getColor(score), sizeClasses[size])}>
      {score.toFixed(1)}
    </span>
  );
}
