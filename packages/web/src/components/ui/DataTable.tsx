"use client";

import { useState } from "react";
import { cn } from "@/lib/api";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: "left" | "right" | "center";
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onSort?: (key: string, dir: "asc" | "desc") => void;
  onRowClick?: (row: T) => void;
  sortKey?: string;
  sortDir?: "asc" | "desc";
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  onSort,
  onRowClick,
  sortKey,
  sortDir,
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full data-table">
        <thead>
          <tr className="border-b border-[#30363d]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-3 py-2 text-xs font-medium text-[#8b949e] uppercase tracking-wide whitespace-nowrap",
                  col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left",
                  col.sortable && "cursor-pointer hover:text-[#e6edf3]"
                )}
                style={{ width: col.width }}
                onClick={() => {
                  if (col.sortable && onSort) {
                    const newDir = sortKey === col.key && sortDir === "desc" ? "asc" : "desc";
                    onSort(col.key, newDir);
                  }
                }}
              >
                <span className="flex items-center gap-1">
                  {col.header}
                  {col.sortable && sortKey === col.key && (
                    <span>{sortDir === "asc" ? "\u25B2" : "\u25BC"}</span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={i}
              onClick={() => onRowClick?.(row)}
              className={cn(
                "border-b border-[#21262d] hover:bg-[#161b22] transition-colors",
                onRowClick && "cursor-pointer"
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "px-3 py-2.5 text-sm tabular-nums",
                    col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                  )}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-8 text-center text-[#8b949e]">
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
