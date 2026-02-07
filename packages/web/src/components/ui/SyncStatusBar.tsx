"use client";

import { useEffect, useState } from "react";

interface SyncStatus {
  syncing: boolean;
  active_job: { job_type: string; records_processed: number } | null;
  last_completed: { completed_at: string } | null;
  counts: { fee_protocols: number; revenue_rows: number; tokens: number; protocols_with_revenue: number };
  progress: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export function SyncStatusBar() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    async function fetchStatus() {
      try {
        const res = await fetch(`${API_BASE}/sync/status`);
        if (!res.ok) throw new Error();
        setStatus(await res.json());
        setError(false);
      } catch {
        setError(true);
      }
    }
    fetchStatus();
    interval = setInterval(fetchStatus, status?.syncing ? 10000 : 60000);
    return () => clearInterval(interval);
  }, [status?.syncing]);

  if (error) {
    return (
      <p className="text-xs text-[#888] italic py-1 border-b border-[#e8e8e8] mb-6">
        API not connected &mdash; displaying cached data
      </p>
    );
  }

  if (!status) return null;

  if (status.syncing && status.active_job) {
    return (
      <div className="py-2 border-b border-[#e8e8e8] mb-6">
        <div className="flex items-center gap-3 text-xs">
          <span className="inline-block w-1.5 h-1.5 bg-[#0274B6] rounded-full animate-pulse" />
          <span className="text-[#444]">
            Syncing {status.active_job.job_type.replace(/_/g, " ")} &mdash; {status.active_job.records_processed.toLocaleString()} records &mdash; {status.progress}%
          </span>
        </div>
        <div className="w-full bg-[#e8e8e8] h-px mt-1.5">
          <div className="bg-[#111] h-px transition-all" style={{ width: `${Math.max(2, status.progress)}%` }} />
        </div>
      </div>
    );
  }

  if (status.counts.revenue_rows > 0) {
    return (
      <p className="text-xs text-[#888] py-1 border-b border-[#e8e8e8] mb-6">
        {status.counts.fee_protocols.toLocaleString()} protocols &middot; {status.counts.revenue_rows.toLocaleString()} revenue records &middot; {status.counts.tokens.toLocaleString()} tokens
        {status.last_completed && (
          <> &middot; Last sync: {formatTimeAgo(status.last_completed.completed_at)}</>
        )}
      </p>
    );
  }

  return (
    <p className="text-xs text-[#888] italic py-1 border-b border-[#e8e8e8] mb-6">
      Initializing data pipeline...
    </p>
  );
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
