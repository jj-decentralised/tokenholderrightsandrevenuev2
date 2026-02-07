"use client";

import { useEffect, useState } from "react";

interface SyncStatus {
  syncing: boolean;
  active_job: {
    job_type: string;
    status: string;
    records_processed: number;
    records_failed: number;
    started_at: string;
  } | null;
  last_completed: {
    job_type: string;
    completed_at: string;
    records_processed: number;
  } | null;
  counts: {
    protocols: number;
    fee_protocols: number;
    tokens: number;
    revenue_rows: number;
    protocols_with_revenue: number;
  };
  progress: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatJobType(type: string): string {
  const map: Record<string, string> = {
    revenue_daily: "Revenue data",
    sync_universe: "Protocol universe",
    sync_fee_protocols: "Fee protocols",
    market_daily: "Market data",
    holder_snapshot: "Holder data",
    computed_metrics: "Computing metrics",
  };
  return map[type] || type.replace(/_/g, " ");
}

export function SyncStatusBar() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [error, setError] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    async function fetchStatus() {
      try {
        const res = await fetch(`${API_BASE}/sync/status`);
        if (!res.ok) throw new Error("API unavailable");
        const data = await res.json();
        setStatus(data);
        setError(false);
      } catch {
        setError(true);
      }
    }

    fetchStatus();
    // Poll every 10s while syncing, every 60s otherwise
    interval = setInterval(fetchStatus, status?.syncing ? 10000 : 60000);

    return () => clearInterval(interval);
  }, [status?.syncing]);

  if (dismissed) return null;

  // API not reachable
  if (error) {
    return (
      <div className="bg-[#fff3cd] border border-[#ffc107] rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">API not connected — showing cached/mock data</span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-xs text-[#8f9a9e] hover:text-[#133c3b]"
        >
          Dismiss
        </button>
      </div>
    );
  }

  if (!status) return null;

  // Actively syncing
  if (status.syncing && status.active_job) {
    const job = status.active_job;
    return (
      <div className="bg-[#f0f7ff] border border-[#58a6ff] rounded-lg px-4 py-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#58a6ff] rounded-full animate-pulse" />
            <span className="text-sm font-medium">
              Syncing: {formatJobType(job.job_type)}
            </span>
          </div>
          <span className="text-xs text-[#8f9a9e]">
            {job.records_processed.toLocaleString()} records processed
          </span>
        </div>
        <div className="w-full bg-[#e5e5e3] rounded-full h-1.5">
          <div
            className="bg-[#58a6ff] h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(2, status.progress)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-[#8f9a9e]">
            {status.counts.protocols_with_revenue}/{status.counts.fee_protocols} protocols
          </span>
          <span className="text-xs text-[#8f9a9e]">{status.progress}%</span>
        </div>
      </div>
    );
  }

  // Data summary when not syncing
  const hasData = status.counts.revenue_rows > 0;
  if (!hasData) {
    return (
      <div className="bg-[#f7f7f5] border border-[#e5e5e3] rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-[#ffc107] rounded-full" />
          <span className="text-sm">
            Waiting for initial data sync — {status.counts.protocols.toLocaleString()} protocols discovered, revenue data loading...
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-xs text-[#8f9a9e] hover:text-[#133c3b]"
        >
          Dismiss
        </button>
      </div>
    );
  }

  // Data loaded — show summary
  return (
    <div className="bg-[#f0fdf4] border border-[#86efac] rounded-lg px-4 py-2 mb-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 bg-[#22c55e] rounded-full" />
        <span className="text-xs text-[#6b7280]">
          Live: {status.counts.fee_protocols.toLocaleString()} protocols | {status.counts.revenue_rows.toLocaleString()} revenue records | {status.counts.tokens.toLocaleString()} tokens
        </span>
        {status.last_completed && (
          <span className="text-xs text-[#9ca3af]">
            Last sync: {formatTimeAgo(status.last_completed.completed_at)}
          </span>
        )}
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-xs text-[#8f9a9e] hover:text-[#133c3b]"
      >
        Hide
      </button>
    </div>
  );
}
