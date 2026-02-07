interface ConfidenceBadgeProps {
  score: number;
  label?: string;
}

export function ConfidenceBadge({ score, label }: ConfidenceBadgeProps) {
  const level = score >= 0.9 ? "High" : score >= 0.7 ? "Medium" : "Low";
  const color = score >= 0.9 ? "text-[#111]" : score >= 0.7 ? "text-[#888]" : "text-[#c0152f]";

  return (
    <span className={`text-xs italic ${color}`}>
      {label || `${level} confidence`}
    </span>
  );
}
