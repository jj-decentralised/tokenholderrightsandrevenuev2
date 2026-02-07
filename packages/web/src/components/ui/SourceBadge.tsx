import { cn } from "@/lib/api";

interface SourceBadgeProps {
  sources: string[];
  className?: string;
}

export function SourceBadge({ sources, className }: SourceBadgeProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {sources.map((source) => (
        <span
          key={source}
          className="text-[10px] text-[#8f9a9e] bg-[#f7f7f5] border border-[#eeeeec] px-1.5 py-0.5 rounded"
        >
          {source}
        </span>
      ))}
    </div>
  );
}
