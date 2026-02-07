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

export async function ingestRevenueForProtocol(
  protocolSlug: string,
  protocolId: string,
  runId: string
): Promise<number> {
  let totalRecords = 0;

  for (const [dataType, column] of Object.entries(DIMENSION_COLUMN_MAP)) {
    try {
      const data = await defillama.getProtocolFees(protocolSlug, dataType as DataType);

      if (!data.totalDataChart?.length) continue;

      for (const [timestamp, value] of data.totalDataChart) {
        const date = formatDate(new Date(timestamp * 1000));

        await query(
          `INSERT INTO revenue_daily (id, protocol_id, date, ${column}, source_provider, source_as_of, ingestion_run_id)
          VALUES ($1, $2, $3, $4, 'defillama', NOW(), $5)
          ON CONFLICT (protocol_id, date) DO UPDATE SET
            ${column} = EXCLUDED.${column},
            source_as_of = NOW(),
            ingestion_run_id = EXCLUDED.ingestion_run_id`,
          [uuid(), protocolId, date, value, runId]
        );
        totalRecords++;
      }

      // Store chain breakdown if available
      if (data.totalDataChartBreakdown?.length) {
        for (let i = 0; i < data.totalDataChart.length; i++) {
          const [timestamp] = data.totalDataChart[i];
          const breakdown = data.totalDataChartBreakdown[i];
          if (breakdown && dataType === "dailyFees") {
            const date = formatDate(new Date(timestamp * 1000));
            await query(
              `UPDATE revenue_daily SET chain_breakdown = $1
              WHERE protocol_id = $2 AND date = $3`,
              [JSON.stringify(breakdown), protocolId, date]
            );
          }
        }
      }
    } catch (error) {
      console.error(
        `Failed to ingest ${dataType} for ${protocolSlug}:`,
        (error as Error).message
      );
    }
  }

  return totalRecords;
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
    const protocols = await query(
      `SELECT id, slug, defillama_id FROM protocol WHERE status = 'active'`
    );

    let totalProcessed = 0;
    let totalFailed = 0;

    for (const protocol of protocols.rows) {
      try {
        const slug = protocol.defillama_id || protocol.slug;
        const records = await ingestRevenueForProtocol(slug, protocol.id, runId);
        totalProcessed += records;
        console.log(`  Ingested ${records} revenue records for ${protocol.slug}`);
      } catch (error) {
        totalFailed++;
        console.error(`  Failed: ${protocol.slug}:`, (error as Error).message);
      }
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
