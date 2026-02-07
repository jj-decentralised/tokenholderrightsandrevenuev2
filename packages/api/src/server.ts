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

      // Run initial data sync if database is nearly empty
      setTimeout(async () => {
        try {
          const result = await query("SELECT COUNT(*) as count FROM protocol");
          const protocolCount = Number(result.rows[0].count);

          if (protocolCount < 50) {
            console.log(`[startup] Only ${protocolCount} protocols in DB — running initial sync...`);
            const { syncFeeProtocols, syncTokenUniverse } = await import("./services/ingestion/sync-universe.js");
            await syncFeeProtocols();
            await syncTokenUniverse(10);
            console.log("[startup] Initial sync complete — starting revenue ingestion...");

            const { ingestAllRevenue } = await import("./services/ingestion/revenue-ingestion.js");
            await ingestAllRevenue();
            console.log("[startup] Initial revenue ingestion complete");
          } else {
            console.log(`[startup] ${protocolCount} protocols already in DB, skipping initial sync`);
          }
        } catch (error) {
          console.error("[startup] Initial sync failed:", error);
        }
      }, 5000);
    }
  });
}

start();

export default app;
