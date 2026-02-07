import type { TimeRange } from "../types/index.js";

export function getDateRangeFromTimeRange(range: TimeRange): { start: Date; end: Date } {
  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);

  const start = new Date(end);
  switch (range) {
    case "1d":
      start.setUTCDate(start.getUTCDate() - 1);
      break;
    case "7d":
      start.setUTCDate(start.getUTCDate() - 7);
      break;
    case "30d":
      start.setUTCDate(start.getUTCDate() - 30);
      break;
    case "90d":
      start.setUTCDate(start.getUTCDate() - 90);
      break;
    case "1y":
      start.setUTCFullYear(start.getUTCFullYear() - 1);
      break;
    case "all":
      start.setUTCFullYear(2019, 0, 1);
      break;
  }

  return { start, end };
}

export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function daysBetween(a: Date, b: Date): number {
  return Math.abs(Math.floor((b.getTime() - a.getTime()) / (86400 * 1000)));
}

export function annualize(dailyValue: number): number {
  return dailyValue * 365;
}

export function chunkDateRange(
  start: Date,
  end: Date,
  chunkDays: number
): Array<{ start: Date; end: Date }> {
  const chunks: Array<{ start: Date; end: Date }> = [];
  let current = new Date(start);

  while (current < end) {
    const chunkEnd = new Date(current);
    chunkEnd.setUTCDate(chunkEnd.getUTCDate() + chunkDays);
    if (chunkEnd > end) {
      chunks.push({ start: new Date(current), end: new Date(end) });
    } else {
      chunks.push({ start: new Date(current), end: new Date(chunkEnd) });
    }
    current = new Date(chunkEnd);
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return chunks;
}
