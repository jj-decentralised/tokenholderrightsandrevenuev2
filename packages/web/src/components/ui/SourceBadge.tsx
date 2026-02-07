interface SourceBadgeProps {
  sources: string[];
}

export function SourceBadge({ sources }: SourceBadgeProps) {
  return (
    <span className="text-xs text-[#888] italic">
      Source: {sources.join(", ")}
    </span>
  );
}
