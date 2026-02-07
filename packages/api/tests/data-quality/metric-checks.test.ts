import { describe, it, expect } from "vitest";

// Data quality validation rules
// These tests verify that metric computations follow the expected mathematical properties

describe("metric quality checks", () => {
  describe("Real P/E ratio", () => {
    it("should be positive when market cap and holder revenue are positive", () => {
      const marketCap = 1_000_000_000;
      const annualizedHolderRevenue = 50_000_000;
      const realPE = marketCap / annualizedHolderRevenue;
      expect(realPE).toBeGreaterThan(0);
      expect(realPE).toBe(20);
    });

    it("should be undefined when holder revenue is zero", () => {
      const marketCap = 1_000_000_000;
      const annualizedHolderRevenue = 0;
      const realPE = annualizedHolderRevenue > 0 ? marketCap / annualizedHolderRevenue : null;
      expect(realPE).toBeNull();
    });
  });

  describe("Holder revenue yield", () => {
    it("should be between 0 and 100 for reasonable scenarios", () => {
      const annualizedHolderRevenue = 30_000_000;
      const marketCap = 1_000_000_000;
      const yield_ = (annualizedHolderRevenue / marketCap) * 100;
      expect(yield_).toBeGreaterThan(0);
      expect(yield_).toBeLessThan(100);
      expect(yield_).toBeCloseTo(3.0, 1);
    });
  });

  describe("Revenue efficiency", () => {
    it("should be between 0 and 100", () => {
      const holderRevenue = 5_000_000;
      const totalFees = 20_000_000;
      const efficiency = (holderRevenue / totalFees) * 100;
      expect(efficiency).toBeGreaterThanOrEqual(0);
      expect(efficiency).toBeLessThanOrEqual(100);
      expect(efficiency).toBe(25);
    });

    it("should be 100 when all fees go to holders (dYdX model)", () => {
      const holderRevenue = 26_700_000;
      const totalFees = 26_700_000;
      const efficiency = (holderRevenue / totalFees) * 100;
      expect(efficiency).toBe(100);
    });
  });

  describe("Productive token score", () => {
    function computeScore(
      holderRevenuePct: number,
      mechanismDays: number,
      holderGrowth30d: number,
      top10Pct: number
    ): number {
      // Revenue to holders (0-2.5)
      const revScore = Math.min(2.5, (holderRevenuePct / 50) * 2.5);

      // Mechanism maturity (0-2.5)
      let mechScore = 0;
      if (mechanismDays >= 730) mechScore = 2.5;
      else if (mechanismDays >= 365) mechScore = 1.8;
      else if (mechanismDays >= 180) mechScore = 1.2;
      else if (mechanismDays >= 90) mechScore = 0.7;
      else if (mechanismDays > 0) mechScore = 0.3;

      // Holder growth (0-2.5)
      const growthScore = holderGrowth30d >= 20 ? 2.5 : holderGrowth30d > 0 ? (holderGrowth30d / 20) * 2.5 : 0;

      // Concentration health (0-2.5) - inversely correlated
      let concScore = 0;
      if (top10Pct <= 20) concScore = 2.5;
      else if (top10Pct <= 40) concScore = 2.0;
      else if (top10Pct <= 60) concScore = 1.5;
      else if (top10Pct <= 80) concScore = 0.8;
      else concScore = 0.2;

      return revScore + mechScore + growthScore + concScore;
    }

    it("should be between 0 and 10", () => {
      const score = computeScore(50, 730, 20, 30);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(10);
    });

    it("perfect protocol scores 10", () => {
      const score = computeScore(50, 730, 20, 20);
      expect(score).toBe(10);
    });

    it("zero-revenue protocol scores near 0", () => {
      const score = computeScore(0, 0, 0, 90);
      expect(score).toBe(0.2); // only gets some concentration score
    });

    it("dYdX-like profile scores high", () => {
      // 100% holder rev, 2+ year mechanism, 12% growth, 44% concentration
      const score = computeScore(100, 900, 12, 44);
      expect(score).toBeGreaterThan(7.5);
    });

    it("Lido-like profile (no holder revenue) scores low", () => {
      const score = computeScore(0, 0, 2, 65);
      expect(score).toBeLessThan(2);
    });
  });

  describe("Revenue attribution consistency", () => {
    it("supply side + protocol revenue should sum to total fees", () => {
      const totalFees = 1_000_000;
      const supplySide = 700_000;
      const protocolRevenue = 300_000;
      expect(supplySide + protocolRevenue).toBe(totalFees);
    });

    it("holder revenue + treasury should not exceed protocol revenue", () => {
      const protocolRevenue = 300_000;
      const holderRevenue = 100_000;
      const treasuryRevenue = 200_000;
      expect(holderRevenue + treasuryRevenue).toBeLessThanOrEqual(protocolRevenue);
    });
  });

  describe("Gini coefficient", () => {
    it("should be 0 for perfectly equal distribution", () => {
      const balances = [100, 100, 100, 100, 100];
      const n = balances.length;
      const mean = balances.reduce((a, b) => a + b, 0) / n;
      let sumDiff = 0;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          sumDiff += Math.abs(balances[i] - balances[j]);
        }
      }
      const gini = sumDiff / (2 * n * n * mean);
      expect(gini).toBe(0);
    });

    it("should approach 1 for extremely unequal distribution", () => {
      const balances = [0, 0, 0, 0, 1000000];
      const n = balances.length;
      const mean = balances.reduce((a, b) => a + b, 0) / n;
      let sumDiff = 0;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          sumDiff += Math.abs(balances[i] - balances[j]);
        }
      }
      const gini = sumDiff / (2 * n * n * mean);
      expect(gini).toBeGreaterThan(0.7);
    });
  });
});
