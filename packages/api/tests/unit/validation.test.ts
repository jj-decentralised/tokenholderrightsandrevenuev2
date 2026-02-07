import { describe, it, expect } from "vitest";
import {
  timeRangeSchema,
  paginationSchema,
  dashboardQuerySchema,
  screenerSchema,
} from "../../src/lib/validation.js";

describe("validation schemas", () => {
  describe("timeRangeSchema", () => {
    it("accepts valid ranges", () => {
      expect(timeRangeSchema.parse("7d")).toBe("7d");
      expect(timeRangeSchema.parse("30d")).toBe("30d");
      expect(timeRangeSchema.parse("1y")).toBe("1y");
      expect(timeRangeSchema.parse("all")).toBe("all");
    });

    it("defaults to 30d", () => {
      expect(timeRangeSchema.parse(undefined)).toBe("30d");
    });

    it("rejects invalid ranges", () => {
      expect(() => timeRangeSchema.parse("2w")).toThrow();
      expect(() => timeRangeSchema.parse("")).toThrow();
    });
  });

  describe("paginationSchema", () => {
    it("has correct defaults", () => {
      const result = paginationSchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
    });

    it("parses string numbers", () => {
      const result = paginationSchema.parse({ page: "3", limit: "25" });
      expect(result.page).toBe(3);
      expect(result.limit).toBe(25);
    });

    it("enforces maximum limit", () => {
      expect(() => paginationSchema.parse({ limit: "1000" })).toThrow();
    });

    it("enforces minimum page", () => {
      expect(() => paginationSchema.parse({ page: "0" })).toThrow();
    });
  });

  describe("dashboardQuerySchema", () => {
    it("accepts valid query", () => {
      const result = dashboardQuerySchema.parse({ range: "7d" });
      expect(result.range).toBe("7d");
    });

    it("defaults range to 30d", () => {
      const result = dashboardQuerySchema.parse({});
      expect(result.range).toBe("30d");
    });
  });

  describe("screenerSchema", () => {
    it("parses complex screener query", () => {
      const result = screenerSchema.parse({
        category: "dex,lending",
        has_token: "true",
        min_revenue_24h: "10000",
        max_real_pe: "50",
        sort_by: "revenue",
        sort_dir: "desc",
        page: "1",
        limit: "20",
      });
      expect(result.category).toEqual(["dex", "lending"]);
      expect(result.has_token).toBe(true);
      expect(result.min_revenue_24h).toBe(10000);
      expect(result.max_real_pe).toBe(50);
      expect(result.sort_by).toBe("revenue");
      expect(result.limit).toBe(20);
    });
  });
});
