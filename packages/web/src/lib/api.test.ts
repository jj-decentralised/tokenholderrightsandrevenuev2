import { describe, it, expect } from "vitest";
import { formatUSD, formatPercent, formatNumber, formatRatio, cn } from "./api";

describe("formatting utilities", () => {
  describe("formatUSD", () => {
    it("formats null as dash", () => {
      expect(formatUSD(null)).toBe("—");
      expect(formatUSD(undefined)).toBe("—");
    });

    it("formats standard amounts", () => {
      expect(formatUSD(1234.56)).toBe("$1,234.56");
    });

    it("formats compact billions", () => {
      expect(formatUSD(1_500_000_000, true)).toBe("$1.50B");
    });

    it("formats compact millions", () => {
      expect(formatUSD(2_500_000, true)).toBe("$2.50M");
    });

    it("formats compact thousands", () => {
      expect(formatUSD(45_000, true)).toBe("$45.00K");
    });
  });

  describe("formatPercent", () => {
    it("formats null as dash", () => {
      expect(formatPercent(null)).toBe("—");
    });

    it("formats positive with plus sign", () => {
      expect(formatPercent(12.34)).toBe("+12.34%");
    });

    it("formats negative with minus sign", () => {
      expect(formatPercent(-5.67)).toBe("-5.67%");
    });
  });

  describe("formatNumber", () => {
    it("formats null as dash", () => {
      expect(formatNumber(null)).toBe("—");
    });

    it("formats large numbers", () => {
      expect(formatNumber(1234567)).toBe("1,234,567");
    });

    it("formats compact millions", () => {
      expect(formatNumber(1_500_000, true)).toBe("1.5M");
    });
  });

  describe("formatRatio", () => {
    it("formats null as dash", () => {
      expect(formatRatio(null)).toBe("—");
    });

    it("formats ratio with x suffix", () => {
      expect(formatRatio(14.5)).toBe("14.5x");
    });

    it("handles infinity", () => {
      expect(formatRatio(Infinity)).toBe("—");
    });
  });

  describe("cn", () => {
    it("joins class names", () => {
      expect(cn("foo", "bar")).toBe("foo bar");
    });

    it("filters falsy values", () => {
      expect(cn("foo", false, undefined, "bar")).toBe("foo bar");
    });
  });
});
