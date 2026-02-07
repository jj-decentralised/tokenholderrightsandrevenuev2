import { v4 as uuid } from "uuid";
import { query, transaction } from "../../db/connection.js";
import { defillama } from "../providers/defillama.js";
import { formatDate } from "../../lib/time.js";

type DataType =
  | "dailyFees" | "dailyRevenue" | "dailyHoldersRevenue"
  | "dailyProtocolRevenue" | "dailySupplySideRevenue"
  | "dailyUserFees" | "dailyEarnings";

const DIMENSION_COLUMN_MAP: Record<DataType, string> = {
  dailyFees: "daily_fees_usd",
  dailyRevenue: "daily_revenue_usd",
  dailyHoldersRevenue: "daily_holders_revenue_usd",
  dailyProtocolRevenue: "daily_protocol_revenue_usd",
  dailySupplySideRevenue: "daily_supply_side_usd",
  dailyUserFees: "daily_user_fees_usd",
  dailyEarnings: "daily_earnings_usd",
};

// Core data types to fetch (most important first). Skip dailyEarnings and
// dailyUserFees as they frequently 500 and are less useful.
const CORE_DATA_TYPES: DataType[] = [
  "dailyFees",
  "dailyRevenue",
  "dailyHoldersRevenue",
  "dailyProtocolRevenue",
  "dailySupplySideRevenue",
];

export async function ingestRevenueForProtocol(
  protocolSlug: string,
  protocolId: string,
  runId: string
): Promise<number> {
  let totalRecords = 0;

  // Fetch all core data types in parallel for this protocol
  const results = await Promise.allSettled(
    CORE_DATA_TYPES.map(async (dataType) => {
      const column = DIMENSION_COLUMN_MAP[dataType];
      const data = await defillama.getProtocolFees(protocolSlug, dataType);
      return { dataType, column, data };
    })
  );

  for (const result of results) {
    if (result.status === "rejected") continue;
    const { dataType, column, data } = result.value;

    if (!data.totalDataChart?.length) continue;

    // Batch insert using a single transaction per data type
    const rows = data.totalDataChart.map(([timestamp, value]) => ({
      date: formatDate(new Date(timestamp * 1000)),
      value,
    }));

    // Process in chunks of 500 for transaction size limits
    const CHUNK = 500;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK);
      await transaction(async (client) => {
        for (const row of chunk) {
          await client.query(
            `INSERT INTO revenue_daily (id, protocol_id, date, ${column}, source_provider, source_as_of, ingestion_run_id)
            VALUES ($1, $2, $3, $4, 'defillama', NOW(), $5)
            ON CONFLICT (protocol_id, date) DO UPDATE SET
              ${column} = EXCLUDED.${column},
              source_as_of = NOW(),
              ingestion_run_id = EXCLUDED.ingestion_run_id`,
            [uuid(), protocolId, row.date, row.value, runId]
          );
        }
      });
      totalRecords += chunk.length;
    }

    // Store chain breakdown if available (fees only)
    if (dataType === "dailyFees" && data.totalDataChartBreakdown?.length) {
      try {
        await transaction(async (client) => {
          for (let i = 0; i < Math.min(data.totalDataChart.length, data.totalDataChartBreakdown.length); i++) {
            const [timestamp] = data.totalDataChart[i];
            const breakdown = data.totalDataChartBreakdown[i];
            if (breakdown) {
              const date = formatDate(new Date(timestamp * 1000));
              await client.query(
                `UPDATE revenue_daily SET chain_breakdown = $1
                WHERE protocol_id = $2 AND date = $3`,
                [JSON.stringify(breakdown), protocolId, date]
              );
            }
          }
        });
      } catch {
        // Non-critical, skip breakdown errors
      }
    }
  }

  return totalRecords;
}

/**
 * Process a batch of protocols concurrently.
 */
async function processBatch(
  batch: Array<{ id: string; slug: string; defillama_id: string }>,
  runId: string
): Promise<{ processed: number; failed: number }> {
  let processed = 0;
  let failed = 0;

  const results = await Promise.allSettled(
    batch.map(async (protocol) => {
      const slug = protocol.defillama_id || protocol.slug;
      const records = await ingestRevenueForProtocol(slug, protocol.id, runId);
      return { slug: protocol.slug, records };
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      processed += result.value.records;
      if (result.value.records > 0) {
        console.log(`  Ingested ${result.value.records} records for ${result.value.slug}`);
      }
    } else {
      failed++;
    }
  }

  return { processed, failed };
}

export async function ingestAllRevenue(): Promise<void> {
  const runId = `revenue-${Date.now()}`;
  console.log(`Starting revenue ingestion run: ${runId}`);

  await query(
    `INSERT INTO ingestion_run (id, provider, job_type, status)
    VALUES ($1, 'defillama', 'revenue_daily', 'running')`,
    [runId]
  );

  try {
    // Only fetch protocols that have fee data — not all 6000+
    const protocols = await query(
      `SELECT id, slug, defillama_id FROM protocol
       WHERE status = 'active' AND has_fee_data = true
       ORDER BY slug`
    );

    console.log(`[revenue] Processing ${protocols.rows.length} fee-generating protocols`);

    let totalProcessed = 0;
    let totalFailed = 0;

    // Process in concurrent batches of 5 protocols at a time
    const CONCURRENCY = 5;
    for (let i = 0; i < protocols.rows.length; i += CONCURRENCY) {
      const batch = protocols.rows.slice(i, i + CONCURRENCY);
      const { processed, failed } = await processBatch(batch, runId);
      totalProcessed += processed;
      totalFailed += failed;

      // Update progress in ingestion_run for status tracking
      const pct = Math.round(((i + batch.length) / protocols.rows.length) * 100);
      await query(
        `UPDATE ingestion_run SET records_processed = $2, records_failed = $3
        WHERE id = $1`,
        [runId, totalProcessed, totalFailed]
      );
      console.log(`[revenue] Progress: ${i + batch.length}/${protocols.rows.length} protocols (${pct}%), ${totalProcessed} records`);
    }

    await query(
      `UPDATE ingestion_run SET status = 'completed', completed_at = NOW(),
        records_processed = $2, records_failed = $3
      WHERE id = $1`,
      [runId, totalProcessed, totalFailed]
    );

    console.log(
      `Revenue ingestion complete: ${totalProcessed} records, ${totalFailed} failures`
    );
  } catch (error) {
    await query(
      `UPDATE ingestion_run SET status = 'failed', completed_at = NOW(),
        error_message = $2
      WHERE id = $1`,
      [runId, (error as Error).message]
    );
    throw error;
  }
}
