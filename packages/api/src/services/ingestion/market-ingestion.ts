import { v4 as uuid } from "uuid";
import { query, transaction } from "../../db/connection.js";
import { coingecko } from "../providers/coingecko.js";
import { formatDate } from "../../lib/time.js";

/**
 * Ingest market data for ALL tokens in our database by paginating through
 * CoinGecko's /coins/markets endpoint. Matches on coingecko_id.
 */
export async function ingestMarketDataBulk(runId: string): Promise<number> {
  let totalRecords = 0;
  let page = 1;
  const perPage = 250;
  const maxPages = 60; // Up to 15,000 coins

  // Fetch all tracked tokens
  const tokens = await query(
    `SELECT id, coingecko_id FROM token WHERE coingecko_id IS NOT NULL`
  );
  const tokenMap = new Map(
    tokens.rows.map((t: any) => [t.coingecko_id, t.id])
  );

  console.log(`  Tracking ${tokenMap.size} tokens with CoinGecko IDs`);

  // Paginate through CoinGecko markets
  let hasMore = true;
  let matchedThisPage = 0;
  let consecutiveEmptyPages = 0;

  while (hasMore && page <= maxPages) {
    try {
      const markets = await coingecko.getMarkets(page, perPage, false);
      if (markets.length === 0) {
        hasMore = false;
        break;
      }

      matchedThisPage = 0;
      for (const coin of markets) {
        const tokenId = tokenMap.get(coin.id);
        if (!tokenId) continue;

        const date = formatDate(new Date());
        matchedThisPage++;

        await query(
          `INSERT INTO token_market_daily
            (id, token_id, date, price_usd, market_cap_usd, fdv_usd,
             circulating_supply, total_volume_usd, price_change_pct_24h,
             ath_usd, source_provider, source_as_of, ingestion_run_id)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'coingecko', NOW(), $11)
          ON CONFLICT (token_id, date) DO UPDATE SET
            price_usd = EXCLUDED.price_usd,
            market_cap_usd = EXCLUDED.market_cap_usd,
            fdv_usd = EXCLUDED.fdv_usd,
            circulating_supply = EXCLUDED.circulating_supply,
            total_volume_usd = EXCLUDED.total_volume_usd,
            price_change_pct_24h = EXCLUDED.price_change_pct_24h,
            ath_usd = EXCLUDED.ath_usd,
            source_as_of = NOW(),
            ingestion_run_id = EXCLUDED.ingestion_run_id`,
          [
            uuid(), tokenId, date,
            coin.current_price, coin.market_cap,
            coin.fully_diluted_valuation,
            coin.circulating_supply, coin.total_volume,
            coin.price_change_percentage_24h,
            coin.ath, runId,
          ]
        );
        totalRecords++;
      }

      console.log(`  Page ${page}: ${matchedThisPage}/${markets.length} matched (total: ${totalRecords})`);

      // Stop if we haven't matched anything for 5 consecutive pages
      // (means we're past the tail of our tracked tokens)
      if (matchedThisPage === 0) {
        consecutiveEmptyPages++;
        if (consecutiveEmptyPages >= 5) {
          console.log(`  Stopping: ${consecutiveEmptyPages} consecutive pages with no matches`);
          hasMore = false;
        }
      } else {
        consecutiveEmptyPages = 0;
      }

      page++;
      if (markets.length < perPage) hasMore = false;
    } catch (error) {
      console.error(`  Market data page ${page} failed:`, (error as Error).message);
      page++;
      // Continue to next page on error rather than aborting
    }
  }

  return totalRecords;
}

/**
 * Backfill historical market data for a specific token.
 */
export async function ingestMarketHistory(
  tokenId: string,
  coingeckoId: string,
  days: number | "max",
  runId: string
): Promise<number> {
  const chart = await coingecko.getMarketChart(coingeckoId, days);
  let records = 0;

  for (let i = 0; i < chart.prices.length; i++) {
    const [timestamp, price] = chart.prices[i];
    const date = formatDate(new Date(timestamp));
    const mcap = chart.market_caps[i]?.[1] || null;
    const volume = chart.total_volumes[i]?.[1] || null;

    await query(
      `INSERT INTO token_market_daily
        (id, token_id, date, price_usd, market_cap_usd, total_volume_usd,
         source_provider, source_as_of, ingestion_run_id)
      VALUES ($1, $2, $3, $4, $5, $6, 'coingecko', NOW(), $7)
      ON CONFLICT (token_id, date) DO UPDATE SET
        price_usd = EXCLUDED.price_usd,
        market_cap_usd = COALESCE(EXCLUDED.market_cap_usd, token_market_daily.market_cap_usd),
        total_volume_usd = COALESCE(EXCLUDED.total_volume_usd, token_market_daily.total_volume_usd),
        source_as_of = NOW()`,
      [uuid(), tokenId, date, price, mcap, volume, runId]
    );
    records++;
  }

  return records;
}

/**
 * Backfill historical market data for all tokens that have no historical data yet.
 * Processes tokens in batches with priority by market cap.
 */
export async function backfillMarketHistory(
  days: number = 365,
  batchSize: number = 50
): Promise<number> {
  const runId = `market-backfill-${Date.now()}`;
  console.log(`Starting market history backfill (${days} days, batch ${batchSize}): ${runId}`);

  await query(
    `INSERT INTO ingestion_run (id, provider, job_type, status)
    VALUES ($1, 'coingecko', 'market_backfill', 'running')`,
    [runId]
  );

  let totalRecords = 0;
  let processed = 0;
  let failed = 0;

  try {
    // Find tokens that need backfill: have coingecko_id but fewer than 30 days of data
    const tokens = await query(
      `SELECT t.id, t.coingecko_id, t.name,
              COUNT(tmd.id) AS data_days
      FROM token t
      LEFT JOIN token_market_daily tmd ON tmd.token_id = t.id
      WHERE t.coingecko_id IS NOT NULL
      GROUP BY t.id, t.coingecko_id, t.name
      HAVING COUNT(tmd.id) < 30
      ORDER BY COUNT(tmd.id) ASC
      LIMIT $1`,
      [batchSize]
    );

    console.log(`  Found ${tokens.rows.length} tokens needing backfill`);

    for (const token of tokens.rows) {
      try {
        const records = await ingestMarketHistory(
          token.id,
          token.coingecko_id,
          days,
          runId
        );
        totalRecords += records;
        processed++;
        console.log(`  Backfilled ${records} days for ${token.name} (${processed}/${tokens.rows.length})`);
      } catch (error) {
        failed++;
        console.error(`  Backfill failed for ${token.name}:`, (error as Error).message);
      }
    }

    await query(
      `UPDATE ingestion_run SET status = 'completed', completed_at = NOW(),
        records_processed = $2, records_failed = $3
      WHERE id = $1`,
      [runId, totalRecords, failed]
    );

    console.log(`Market history backfill complete: ${totalRecords} records for ${processed} tokens, ${failed} failures`);
    return totalRecords;
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

export async function ingestAllMarketData(): Promise<void> {
  const runId = `market-${Date.now()}`;
  console.log(`Starting market data ingestion run: ${runId}`);

  await query(
    `INSERT INTO ingestion_run (id, provider, job_type, status)
    VALUES ($1, 'coingecko', 'market_daily', 'running')`,
    [runId]
  );

  try {
    const records = await ingestMarketDataBulk(runId);

    await query(
      `UPDATE ingestion_run SET status = 'completed', completed_at = NOW(),
        records_processed = $2
      WHERE id = $1`,
      [runId, records]
    );

    console.log(`Market data ingestion complete: ${records} records`);
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
