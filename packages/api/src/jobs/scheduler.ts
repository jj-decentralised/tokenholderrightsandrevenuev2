import cron from "node-cron";
import {
  ingestAllRevenue,
  ingestAllMarketData,
  ingestAllHolderData,
  computeDailyMetrics,
  alliumIngestion,
  syncFeeProtocols,
  syncProtocolUniverse,
  syncTokenUniverse,
} from "../services/ingestion/index.js";

export function startScheduler(): void {
  console.log("Starting job scheduler...");

  // Daily at 00:30 UTC - Sync fee protocols from DefiLlama (runs BEFORE ingestion)
  cron.schedule("30 0 * * *", async () => {
    console.log("[CRON] Starting daily fee-protocol sync");
    try {
      await syncFeeProtocols();
      await syncTokenUniverse(10); // Top 2500 tokens
    } catch (error) {
      console.error("[CRON] Protocol sync failed:", error);
    }
  });

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

  // Weekly Sunday at 06:00 UTC - Full universe sync (deep scan)
  cron.schedule("0 6 * * 0", async () => {
    console.log("[CRON] Starting weekly full universe sync");
    try {
      await syncProtocolUniverse();
      await syncTokenUniverse(40); // Top 10,000 tokens
    } catch (error) {
      console.error("[CRON] Full universe sync failed:", error);
    }
  });

  // Weekly Sunday at 08:00 UTC - Allium custom SQL analytics
  cron.schedule("0 8 * * 0", async () => {
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

  console.log("Scheduler started:");
  console.log("  00:30 UTC - Daily fee-protocol sync");
  console.log("  01:00 UTC - Revenue ingestion");
  console.log("  02:00 UTC - Market data ingestion");
  console.log("  03:00 UTC - Holder snapshots");
  console.log("  04:00 UTC - Compute metrics");
  console.log("  05:00 UTC - Allium reconciliation");
  console.log("  Sunday 06:00 UTC - Full universe sync");
  console.log("  Sunday 08:00 UTC - Allium SQL analytics");
  console.log("  Every 15 min - Top token price updates");
}
