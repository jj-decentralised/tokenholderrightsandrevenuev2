import dotenv from "dotenv";
dotenv.config();

import {
  ingestAllRevenue,
  ingestAllMarketData,
  ingestAllHolderData,
  computeDailyMetrics,
  alliumIngestion,
  syncProtocolUniverse,
  syncFeeProtocols,
  syncTokenUniverse,
  backfillMarketHistory,
} from "../services/ingestion/index.js";

const JOBS: Record<string, () => Promise<void>> = {
  // ── Universe sync jobs ─────────────────────────────────────────────
  "sync-universe": async () => {
    await syncProtocolUniverse();
  },
  "sync-fees": async () => {
    await syncFeeProtocols();
  },
  "sync-tokens": async () => {
    await syncTokenUniverse();
  },
  "sync-all": async () => {
    await syncProtocolUniverse();
    await syncTokenUniverse();
  },

  // ── Data ingestion jobs ────────────────────────────────────────────
  revenue: ingestAllRevenue,
  market: ingestAllMarketData,
  holders: ingestAllHolderData,
  compute: computeDailyMetrics,
  "backfill-market": async () => {
    const days = parseInt(process.argv[3] || "365", 10);
    const batch = parseInt(process.argv[4] || "50", 10);
    await backfillMarketHistory(days, batch);
  },
  "allium-reconcile": () => alliumIngestion.reconcilePrices(),
  "allium-sql": () =>
    alliumIngestion.runCustomAnalytics([
      {
        name: "ETH DEX Volume (30D)",
        sql: alliumIngestion.SQL_QUERIES.ethDexVolume30d,
        handler: async (rows) => {
          console.log(`  Received ${rows.length} days of ETH DEX volume data`);
        },
      },
      {
        name: "Solana DEX Volume (7D)",
        sql: alliumIngestion.SQL_QUERIES.solanaDexVolume,
        handler: async (rows) => {
          console.log(`  Received ${rows.length} rows of Solana DEX volume data`);
        },
      },
    ]),

  // ── Full pipeline ──────────────────────────────────────────────────
  all: async () => {
    console.log("=== Step 1/6: Sync protocol universe ===");
    await syncFeeProtocols();
    console.log("=== Step 2/6: Sync token universe ===");
    await syncTokenUniverse();
    console.log("=== Step 3/6: Ingest revenue data ===");
    await ingestAllRevenue();
    console.log("=== Step 4/6: Ingest market data ===");
    await ingestAllMarketData();
    console.log("=== Step 5/6: Ingest holder data ===");
    await ingestAllHolderData();
    console.log("=== Step 6/6: Compute metrics ===");
    await computeDailyMetrics();
  },
};

async function main(): Promise<void> {
  const jobName = process.argv[2] || "all";
  const job = JOBS[jobName];

  if (!job) {
    console.error(`Unknown job: ${jobName}`);
    console.error(`Available jobs: ${Object.keys(JOBS).join(", ")}`);
    process.exit(1);
  }

  console.log(`Running job: ${jobName}`);
  const start = Date.now();

  try {
    await job();
    const duration = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`Job '${jobName}' completed in ${duration}s`);
    process.exit(0);
  } catch (error) {
    console.error(`Job '${jobName}' failed:`, error);
    process.exit(1);
  }
}

main();
