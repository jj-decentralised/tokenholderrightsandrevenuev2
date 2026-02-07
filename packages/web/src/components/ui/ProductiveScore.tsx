interface ProductiveScoreProps {
  score: number | null;
  size?: "sm" | "md" | "lg";
}

export function ProductiveScore({ score, size = "md" }: ProductiveScoreProps) {
  if (score == null) return <span className="text-[#888]">&mdash;</span>;

  const sizeClass = size === "sm" ? "text-xs" : size === "lg" ? "text-xl font-bold" : "text-sm font-semibold";
  const color = score >= 7 ? "text-[#111]" : score >= 4 ? "text-[#444]" : "text-[#c0152f]";

  return (
    <span className={`tabular-nums ${sizeClass} ${color}`}>
      {score.toFixed(1)}
    </span>
  );
}
