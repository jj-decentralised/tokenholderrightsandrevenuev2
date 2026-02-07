import { cn } from "@/lib/api";

interface ProductiveScoreProps {
  score: number | null;
  size?: "sm" | "md" | "lg";
}

export function ProductiveScore({ score, size = "md" }: ProductiveScoreProps) {
  if (score == null) return <span className="text-[#8b949e]">—</span>;

  const getColor = (s: number) => {
    if (s >= 8) return "text-[#3fb950]";
    if (s >= 6) return "text-[#58a6ff]";
    if (s >= 4) return "text-[#d29922]";
    if (s >= 2) return "text-[#f0883e]";
    return "text-[#f85149]";
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
