import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/error-handler.js";
import { config } from "./lib/config.js";
import { startScheduler } from "./jobs/scheduler.js";
import { runMigrations } from "./db/migrate.js";
import { query } from "./db/connection.js";

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan("combined"));
app.use(express.json());

// Health / status endpoint
app.get("/health", async (_req, res) => {
  try {
    const dbCheck = await query("SELECT COUNT(*) as count FROM protocol");
    const tokenCount = await query("SELECT COUNT(*) as count FROM token WHERE coingecko_id IS NOT NULL");
    const revenueCount = await query("SELECT COUNT(*) as count FROM revenue_daily").catch(() => ({ rows: [{ count: 0 }] }));
    const lastIngestion = await query(
      "SELECT id, provider, job_type, status, started_at, completed_at, records_processed FROM ingestion_run ORDER BY started_at DESC LIMIT 5"
    ).catch(() => ({ rows: [] }));

    res.json({
      status: "ok",
      database: "connected",
      counts: {
        protocols: Number(dbCheck.rows[0].count),
        tokens_with_coingecko: Number(tokenCount.rows[0].count),
        revenue_daily_rows: Number(revenueCount.rows[0].count),
      },
      recent_ingestion_runs: lastIngestion.rows,
      environment: config.nodeEnv,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      database: "disconnected",
      error: (error as Error).message,
    });
  }
});

// Sync status endpoint — used by the frontend progress bar
app.get("/api/v1/sync/status", async (_req, res) => {
  try {
    const protocolCount = await query(
      "SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE has_fee_data = true) as with_fees FROM protocol"
    ).catch(() => ({ rows: [{ total: 0, with_fees: 0 }] }));

    const revenueCount = await query(
      "SELECT COUNT(*) as count, COUNT(DISTINCT protocol_id) as protocols FROM revenue_daily"
    ).catch(() => ({ rows: [{ count: 0, protocols: 0 }] }));

    const tokenCount = await query(
      "SELECT COUNT(*) as count FROM token"
    ).catch(() => ({ rows: [{ count: 0 }] }));

    // Latest running or most recent ingestion run
    const activeRun = await query(
      `SELECT id, provider, job_type, status, started_at, completed_at, records_processed, records_failed
       FROM ingestion_run
       WHERE status = 'running'
       ORDER BY started_at DESC
       LIMIT 1`
    ).catch(() => ({ rows: [] }));

    const lastCompleted = await query(
      `SELECT id, provider, job_type, status, started_at, completed_at, records_processed
       FROM ingestion_run
       WHERE status = 'completed'
       ORDER BY completed_at DESC
       LIMIT 1`
    ).catch(() => ({ rows: [] }));

    const feeProtocolTotal = Number(protocolCount.rows[0].with_fees);
    const protocolsWithRevenue = Number(revenueCount.rows[0].protocols);

    res.json({
      syncing: activeRun.rows.length > 0,
      active_job: activeRun.rows[0] || null,
      last_completed: lastCompleted.rows[0] || null,
      counts: {
        protocols: Number(protocolCount.rows[0].total),
        fee_protocols: feeProtocolTotal,
        tokens: Number(tokenCount.rows[0].count),
        revenue_rows: Number(revenueCount.rows[0].count),
        protocols_with_revenue: protocolsWithRevenue,
      },
      progress: feeProtocolTotal > 0
        ? Math.round((protocolsWithRevenue / feeProtocolTotal) * 100)
        : 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ syncing: false, error: (error as Error).message });
  }
});

// Manual trigger: sync protocol universe
app.post("/api/v1/admin/sync", async (_req, res) => {
  try {
    const { syncFeeProtocols, syncTokenUniverse } = await import("./services/ingestion/sync-universe.js");
    res.json({ status: "started", message: "Protocol sync started in background" });
    syncFeeProtocols()
      .then(() => syncTokenUniverse(10))
      .then(() => console.log("[admin] Manual sync complete"))
      .catch((err) => console.error("[admin] Manual sync failed:", err));
  } catch (error) {
    res.status(500).json({ status: "error", error: (error as Error).message });
  }
});

// Manual trigger: revenue ingestion
app.post("/api/v1/admin/ingest", async (_req, res) => {
  try {
    const { ingestAllRevenue } = await import("./services/ingestion/revenue-ingestion.js");
    res.json({ status: "started", message: "Revenue ingestion started in background" });
    ingestAllRevenue()
      .then(() => console.log("[admin] Revenue ingestion complete"))
      .catch((err) => console.error("[admin] Revenue ingestion failed:", err));
  } catch (error) {
    res.status(500).json({ status: "error", error: (error as Error).message });
  }
});

// API routes
app.use("/api/v1", routes);

// Error handler
app.use(errorHandler);

// Start server
const port = config.port;

async function start(): Promise<void> {
  // Auto-migrate on startup
  try {
    console.log("[startup] Running database migrations...");
    await runMigrations();
  } catch (error) {
    console.error("[startup] Migration failed:", error);
  }

  app.listen(port, () => {
    console.log(`Crypto Terminal API running on port ${port}`);
    console.log(`Environment: ${config.nodeEnv}`);
    console.log(`Health check: http://localhost:${port}/health`);

    // Start scheduler in production
    if (config.nodeEnv === "production") {
      startScheduler();

      // Run full data pipeline on startup to ensure data is fresh
      setTimeout(async () => {
        try {
          const feeCheck = await query("SELECT COUNT(*) as count FROM protocol WHERE has_fee_data = true");
          const feeProtocols = Number(feeCheck.rows[0].count);
          const revCheck = await query("SELECT COUNT(*) as count FROM revenue_daily").catch(() => ({ rows: [{ count: 0 }] }));
          const revRows = Number(revCheck.rows[0].count);

          console.log(`[startup] Status: ${feeProtocols} fee protocols, ${revRows} revenue rows`);

          // Step 1: Always sync fee protocols to ensure has_fee_data is set
          console.log("[startup] Step 1/4: Syncing fee protocols...");
          const { syncFeeProtocols, syncTokenUniverse } = await import("./services/ingestion/sync-universe.js");
          await syncFeeProtocols();

          // Step 2: Sync token universe (top 2500 by market cap)
          console.log("[startup] Step 2/4: Syncing token universe...");
          await syncTokenUniverse(10);

          // Step 3: Revenue ingestion (only fee protocols, parallel)
          console.log("[startup] Step 3/4: Running revenue ingestion...");
          const { ingestAllRevenue } = await import("./services/ingestion/revenue-ingestion.js");
          await ingestAllRevenue();

          // Step 4: Market data
          console.log("[startup] Step 4/4: Running market data ingestion...");
          const { ingestAllMarketData } = await import("./services/ingestion/market-ingestion.js");
          await ingestAllMarketData();

          console.log("[startup] Full data pipeline complete!");
        } catch (error) {
          console.error("[startup] Data pipeline failed:", error);
        }
      }, 5000);
    }
  });
}

start();

export default app;
