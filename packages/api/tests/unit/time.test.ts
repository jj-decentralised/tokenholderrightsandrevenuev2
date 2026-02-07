import { describe, it, expect } from "vitest";
import {
  getDateRangeFromTimeRange,
  formatDate,
  daysBetween,
  annualize,
  chunkDateRange,
} from "../../src/lib/time.js";

describe("time utilities", () => {
  describe("getDateRangeFromTimeRange", () => {
    it("returns 1-day range for 1d", () => {
      const { start, end } = getDateRangeFromTimeRange("1d");
      expect(daysBetween(start, end)).toBe(1);
    });

    it("returns 7-day range for 7d", () => {
      const { start, end } = getDateRangeFromTimeRange("7d");
      expect(daysBetween(start, end)).toBe(7);
    });

    it("returns 30-day range for 30d", () => {
      const { start, end } = getDateRangeFromTimeRange("30d");
      expect(daysBetween(start, end)).toBe(30);
    });

    it("returns 90-day range for 90d", () => {
      const { start, end } = getDateRangeFromTimeRange("90d");
      expect(daysBetween(start, end)).toBe(90);
    });

    it("returns roughly 365-day range for 1y", () => {
      const { start, end } = getDateRangeFromTimeRange("1y");
      const days = daysBetween(start, end);
      expect(days).toBeGreaterThanOrEqual(365);
      expect(days).toBeLessThanOrEqual(366);
    });
  });

  describe("formatDate", () => {
    it("formats date as YYYY-MM-DD", () => {
      const date = new Date("2026-01-15T12:00:00Z");
      expect(formatDate(date)).toBe("2026-01-15");
    });
  });

  describe("daysBetween", () => {
    it("calculates correct day difference", () => {
      const a = new Date("2026-01-01");
      const b = new Date("2026-01-31");
      expect(daysBetween(a, b)).toBe(30);
    });

    it("returns positive for reversed dates", () => {
      const a = new Date("2026-01-31");
      const b = new Date("2026-01-01");
      expect(daysBetween(a, b)).toBe(30);
    });
  });

  describe("annualize", () => {
    it("multiplies daily value by 365", () => {
      expect(annualize(1000)).toBe(365000);
    });

    it("handles zero", () => {
      expect(annualize(0)).toBe(0);
    });
  });

  describe("chunkDateRange", () => {
    it("creates correct number of chunks", () => {
      const start = new Date("2026-01-01");
      const end = new Date("2026-04-01");
      const chunks = chunkDateRange(start, end, 30);
      expect(chunks.length).toBe(3);
    });

    it("handles range smaller than chunk size", () => {
      const start = new Date("2026-01-01");
      const end = new Date("2026-01-15");
      const chunks = chunkDateRange(start, end, 30);
      expect(chunks.length).toBe(1);
    });
  });
});
