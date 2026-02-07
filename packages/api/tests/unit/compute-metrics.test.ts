import { describe, it, expect } from "vitest";

// Test the pure computation logic (extracted for testability)
function computeRevenueToHoldersScore(pct: number | null): number {
  if (!pct || pct <= 0) return 0;
  if (pct >= 50) return 2.5;
  return (pct / 50) * 2.5;
}

function computeHolderGrowthScore(growth30d: number | null): number {
  if (!growth30d) return 0;
  if (growth30d >= 20) return 2.5;
  if (growth30d > 0) return (growth30d / 20) * 2.5;
  return 0;
}

describe("compute metrics", () => {
  describe("computeRevenueToHoldersScore", () => {
    it("returns 0 for null", () => {
      expect(computeRevenueToHoldersScore(null)).toBe(0);
    });

    it("returns 0 for zero percent", () => {
      expect(computeRevenueToHoldersScore(0)).toBe(0);
    });

    it("returns 2.5 for 50% or above", () => {
      expect(computeRevenueToHoldersScore(50)).toBe(2.5);
      expect(computeRevenueToHoldersScore(100)).toBe(2.5);
    });

    it("scales linearly between 0 and 50", () => {
      expect(computeRevenueToHoldersScore(25)).toBe(1.25);
      expect(computeRevenueToHoldersScore(10)).toBe(0.5);
    });
  });

  describe("computeHolderGrowthScore", () => {
    it("returns 0 for null", () => {
      expect(computeHolderGrowthScore(null)).toBe(0);
    });

    it("returns 0 for negative growth", () => {
      expect(computeHolderGrowthScore(-5)).toBe(0);
    });

    it("returns 2.5 for 20% or above", () => {
      expect(computeHolderGrowthScore(20)).toBe(2.5);
      expect(computeHolderGrowthScore(50)).toBe(2.5);
    });

    it("scales linearly between 0 and 20", () => {
      expect(computeHolderGrowthScore(10)).toBe(1.25);
    });
  });
});
