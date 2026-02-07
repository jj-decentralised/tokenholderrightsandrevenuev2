import dotenv from "dotenv";
dotenv.config();

import {
  ingestAllRevenue,
  ingestAllMarketData,
  ingestAllHolderData,
  computeDailyMetrics,
} from "../services/ingestion/index.js";

const JOBS: Record<string, () => Promise<void>> = {
  revenue: ingestAllRevenue,
  market: ingestAllMarketData,
  holders: ingestAllHolderData,
  compute: computeDailyMetrics,
  all: async () => {
    await ingestAllRevenue();
    await ingestAllMarketData();
    await ingestAllHolderData();
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
