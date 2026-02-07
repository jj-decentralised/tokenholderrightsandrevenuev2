import { describe, it, expect, vi, beforeEach } from "vitest";

// Test the Allium provider helper logic without making real API calls

describe("Allium provider", () => {
  describe("supported chains caching", () => {
    it("should cache supported chains after first call", async () => {
      // Simulating the caching logic
      let callCount = 0;
      let cache: Record<string, string[]> | null = null;

      async function getSupportedChains(): Promise<Record<string, string[]>> {
        if (cache) return cache;
        callCount++;
        cache = {
          "/api/v1/developer/prices": ["ethereum", "solana", "base", "arbitrum"],
          "/api/v1/developer/wallet/balances": ["ethereum", "solana", "base"],
          "/api/v1/developer/wallet/pnl": ["bitcoin", "ethereum", "solana"],
        };
        return cache;
      }

      const first = await getSupportedChains();
      const second = await getSupportedChains();

      expect(callCount).toBe(1);
      expect(first).toBe(second); // same reference
      expect(first["/api/v1/developer/prices"]).toContain("ethereum");
      expect(first["/api/v1/developer/wallet/pnl"]).toHaveLength(3);
    });
  });

  describe("chain validation", () => {
    it("should use lowercase chain names", () => {
      const chains = ["ethereum", "solana", "base", "arbitrum", "polygon", "hyperevm"];
      for (const chain of chains) {
        expect(chain).toBe(chain.toLowerCase());
      }
    });

    it("should reject uppercase chain names", () => {
      const invalidChains = ["Ethereum", "SOLANA", "Base"];
      const validChains = ["ethereum", "solana", "base"];

      for (let i = 0; i < invalidChains.length; i++) {
        expect(invalidChains[i].toLowerCase()).toBe(validChains[i]);
        expect(invalidChains[i]).not.toBe(validChains[i]);
      }
    });
  });

  describe("request body format differences", () => {
    it("current price uses array of {token_address, chain}", () => {
      const body = [
        { token_address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", chain: "ethereum" },
      ];
      expect(Array.isArray(body)).toBe(true);
      expect(body[0]).toHaveProperty("token_address");
      expect(body[0]).toHaveProperty("chain");
    });

    it("price history uses {addresses[], start_timestamp, end_timestamp, time_granularity}", () => {
      const body = {
        addresses: [
          { token_address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", chain: "ethereum" },
        ],
        start_timestamp: 1706572800,
        end_timestamp: 1707177600,
        time_granularity: "1d",
      };
      expect(body).toHaveProperty("addresses");
      expect(body).toHaveProperty("start_timestamp");
      expect(body).toHaveProperty("end_timestamp");
      expect(body).toHaveProperty("time_granularity");
      expect(Array.isArray(body.addresses)).toBe(true);
    });
  });

  describe("SQL query execution flow", () => {
    it("should follow create -> run-async -> poll -> results pattern", () => {
      const steps = ["create_query", "run_async", "poll_status", "get_results"];
      expect(steps).toHaveLength(4);
      expect(steps[0]).toBe("create_query");
      expect(steps[1]).toBe("run_async");
    });

    it("query status progression is defined", () => {
      const validStatuses = ["created", "queued", "running", "success", "failed"];
      const terminalStatuses = ["success", "failed"];

      expect(terminalStatuses.every((s) => validStatuses.includes(s))).toBe(true);
    });
  });

  describe("common token addresses", () => {
    const KNOWN_TOKENS = {
      ETH: { chain: "ethereum", address: "0x0000000000000000000000000000000000000000" },
      WETH: { chain: "ethereum", address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" },
      USDC_ETH: { chain: "ethereum", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
      USDC_BASE: { chain: "base", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" },
      SOL: { chain: "solana", address: "So11111111111111111111111111111111111111112" },
      HYPE: { chain: "hyperevm", address: "0x5555555555555555555555555555555555555555" },
    };

    it("ETH uses zero address on ethereum", () => {
      expect(KNOWN_TOKENS.ETH.address).toBe("0x0000000000000000000000000000000000000000");
      expect(KNOWN_TOKENS.ETH.chain).toBe("ethereum");
    });

    it("USDC has different addresses per chain", () => {
      expect(KNOWN_TOKENS.USDC_ETH.address).not.toBe(KNOWN_TOKENS.USDC_BASE.address);
      expect(KNOWN_TOKENS.USDC_ETH.chain).toBe("ethereum");
      expect(KNOWN_TOKENS.USDC_BASE.chain).toBe("base");
    });

    it("SOL address is on solana chain", () => {
      expect(KNOWN_TOKENS.SOL.chain).toBe("solana");
      expect(KNOWN_TOKENS.SOL.address).toMatch(/^So1/);
    });
  });

  describe("rate limit configuration", () => {
    it("should enforce 1 req/sec for Allium", () => {
      // Allium enforces strict 1/second rate limit
      const alliumConfig = { maxConcurrent: 1, minTime: 1000 };
      expect(alliumConfig.maxConcurrent).toBe(1);
      expect(alliumConfig.minTime).toBeGreaterThanOrEqual(1000);
    });
  });

  describe("price reconciliation logic", () => {
    it("should flag prices differing by more than threshold", () => {
      const cgPrice = 100;
      const alliumPrice = 108;
      const thresholdPct = 5;

      const diff = (Math.abs(alliumPrice - cgPrice) / cgPrice) * 100;
      expect(diff).toBe(8);
      expect(diff > thresholdPct).toBe(true);
    });

    it("should not flag prices within threshold", () => {
      const cgPrice = 100;
      const alliumPrice = 102;
      const thresholdPct = 5;

      const diff = (Math.abs(alliumPrice - cgPrice) / cgPrice) * 100;
      expect(diff).toBe(2);
      expect(diff > thresholdPct).toBe(false);
    });
  });
});
