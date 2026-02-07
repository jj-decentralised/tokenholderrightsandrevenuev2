import cron from "node-cron";
import {
  ingestAllRevenue,
  ingestAllMarketData,
  ingestAllHolderData,
  computeDailyMetrics,
  alliumIngestion,
} from "../services/ingestion/index.js";

export function startScheduler(): void {
  console.log("Starting job scheduler...");

  // Daily at 01:00 UTC - Revenue ingestion
  cron.schedule("0 1 * * *", async () => {
    console.log("[CRON] Starting daily revenue ingestion");
    try {
      await ingestAllRevenue();
    } catch (error) {
      console.error("[CRON] Revenue ingestion failed:", error);
    }
  });

  // Daily at 02:00 UTC - Market data ingestion
  cron.schedule("0 2 * * *", async () => {
    console.log("[CRON] Starting daily market data ingestion");
    try {
      await ingestAllMarketData();
    } catch (error) {
      console.error("[CRON] Market data ingestion failed:", error);
    }
  });

  // Daily at 03:00 UTC - Holder snapshot ingestion
  cron.schedule("0 3 * * *", async () => {
    console.log("[CRON] Starting daily holder snapshot ingestion");
    try {
      await ingestAllHolderData();
    } catch (error) {
      console.error("[CRON] Holder ingestion failed:", error);
    }
  });

  // Daily at 04:00 UTC - Compute derived metrics
  cron.schedule("0 4 * * *", async () => {
    console.log("[CRON] Starting daily metrics computation");
    try {
      await computeDailyMetrics();
    } catch (error) {
      console.error("[CRON] Metrics computation failed:", error);
    }
  });

  // Every 15 minutes - Price updates for top tokens
  cron.schedule("*/15 * * * *", async () => {
    try {
      // Lightweight price update - just simple/price endpoint
      const { coingecko } = await import("../services/providers/coingecko.js");
      const { query: dbQuery } = await import("../db/connection.js");
      const tokens = await dbQuery(
        `SELECT coingecko_id FROM token
        WHERE coingecko_id IS NOT NULL
        ORDER BY productive_token_score DESC NULLS LAST
        LIMIT 20`
      );
      const ids = tokens.rows.map((t: any) => t.coingecko_id);
      if (ids.length > 0) {
        await coingecko.getSimplePrice(ids);
      }
    } catch (error) {
      console.error("[CRON] Price update failed:", error);
    }
  });

  // Daily at 05:00 UTC - Allium price reconciliation
  cron.schedule("0 5 * * *", async () => {
    console.log("[CRON] Starting Allium price reconciliation");
    try {
      await alliumIngestion.reconcilePrices();
    } catch (error) {
      console.error("[CRON] Allium reconciliation failed:", error);
    }
  });

  // Weekly Sunday at 06:00 UTC - Allium custom SQL analytics
  cron.schedule("0 6 * * 0", async () => {
    console.log("[CRON] Starting Allium weekly SQL analytics");
    try {
      await alliumIngestion.runCustomAnalytics([
        {
          name: "ETH DEX Volume (30D)",
          sql: alliumIngestion.SQL_QUERIES.ethDexVolume30d,
          handler: async (rows) => {
            console.log(`  ETH DEX: ${rows.length} days`);
          },
        },
        {
          name: "Top Gas Consumers (7D)",
          sql: alliumIngestion.SQL_QUERIES.topGasConsumers7d,
          handler: async (rows) => {
            console.log(`  Top gas consumers: ${rows.length} contracts`);
          },
        },
      ]);
    } catch (error) {
      console.error("[CRON] Allium SQL analytics failed:", error);
    }
  });

  console.log("Scheduler started with daily, intraday, and weekly jobs");
}
