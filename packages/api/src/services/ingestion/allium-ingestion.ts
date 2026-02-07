import { query, transaction } from "../../db/connection.js";
import { allium } from "../providers/allium.js";
import type { AlliumTokenAddress } from "../providers/allium.js";
import { v4 as uuid } from "uuid";

/**
 * Allium ingestion worker: cross-chain analytics, reconciliation, and SQL-based data.
 *
 * Uses Allium for:
 * 1. Price reconciliation — cross-check CoinGecko prices against Allium on-chain prices
 * 2. Wallet balance verification — verify treasury and staking wallet balances
 * 3. Custom SQL analytics — DEX volumes, protocol-level on-chain metrics
 * 4. Historical price backfill at specific timestamps
 */

// The query_id for running custom SQL. Set via ALLIUM_QUERY_ID env or created on first run.
let explorerQueryId: string | null = process.env.ALLIUM_QUERY_ID || null;

async function ensureQueryId(): Promise<string> {
  if (explorerQueryId) return explorerQueryId;

  console.log("Creating Allium Explorer query template...");
  const { query_id } = await allium.createQuery("Crypto Terminal SQL", "{{ sql_query }}", 10000);
  explorerQueryId = query_id;
  console.log(`Allium Explorer query_id: ${query_id} — set ALLIUM_QUERY_ID env to persist.`);
  return query_id;
}

// ---- Price Reconciliation ----

/**
 * Cross-check CoinGecko prices against Allium on-chain prices.
 * Flags discrepancies greater than the threshold (default 5%).
 */
export async function reconcilePrices(thresholdPct: number = 5): Promise<void> {
  const runId = uuid();
  console.log(`[allium:reconcile-prices] Starting run ${runId}`);

  await query(
    `INSERT INTO ingestion_run (id, provider, job_type, status, started_at)
     VALUES ($1, 'allium', 'price_reconciliation', 'running', NOW())`,
    [runId]
  );

  try {
    // Load chains Allium supports for prices
    const chains = await allium.getSupportedChains();
    const priceChains = chains["/api/v1/developer/prices"] || [];
    console.log(`  Allium supports prices on ${priceChains.length} chains`);

    // Get token contracts that have on-chain addresses and CoinGecko prices
    const tokens = await query(
      `SELECT tc.chain_name, tc.contract_address, t.id as token_id, t.symbol,
              tm.price_usd as coingecko_price, tm.date as cg_date
       FROM token_contract tc
       JOIN token t ON t.id = tc.token_id
       LEFT JOIN LATERAL (
         SELECT price_usd, date FROM token_market_daily
         WHERE token_id = t.id ORDER BY date DESC LIMIT 1
       ) tm ON true
       WHERE tc.contract_address IS NOT NULL
         AND tm.price_usd IS NOT NULL
         AND LOWER(tc.chain_name) = ANY($1)
       ORDER BY tm.price_usd DESC
       LIMIT 100`,
      [priceChains]
    );

    if (tokens.rows.length === 0) {
      console.log("  No tokens with both on-chain addresses and CoinGecko prices");
      await query(
        `UPDATE ingestion_run SET status = 'completed', completed_at = NOW(),
         records_processed = 0 WHERE id = $1`,
        [runId]
      );
      return;
    }

    // Batch into groups of 10 (Allium accepts arrays)
    const allTokenAddresses: AlliumTokenAddress[] = tokens.rows.map((r: any) => ({
      token_address: r.contract_address,
      chain: r.chain_name.toLowerCase(),
    }));

    let processed = 0;
    let flagged = 0;

    for (let i = 0; i < allTokenAddresses.length; i += 10) {
      const batch = allTokenAddresses.slice(i, i + 10);
      const batchTokens = tokens.rows.slice(i, i + 10);

      try {
        const alliumPrices = await allium.getCurrentPrices(batch);

        for (const ap of alliumPrices) {
          const matchingToken = batchTokens.find(
            (t: any) => t.contract_address.toLowerCase() === ap.address.toLowerCase()
          );
          if (!matchingToken || !ap.price) continue;

          const cgPrice = Number(matchingToken.coingecko_price);
          const diff = Math.abs(ap.price - cgPrice) / cgPrice * 100;

          if (diff > thresholdPct) {
            flagged++;
            console.warn(
              `  PRICE DISCREPANCY: ${matchingToken.symbol} — CoinGecko: $${cgPrice.toFixed(4)}, Allium: $${ap.price.toFixed(4)} (${diff.toFixed(1)}% diff)`
            );

            // Log to restatement_log for review
            await query(
              `INSERT INTO restatement_log (id, entity_type, entity_id, field_name, old_value, new_value, reason, date_affected, source_provider)
               VALUES ($1, 'token', $2, 'price_usd', $3, $4, $5, CURRENT_DATE, 'allium')`,
              [
                uuid(),
                matchingToken.token_id,
                cgPrice.toString(),
                ap.price.toString(),
                `Price discrepancy ${diff.toFixed(1)}% between CoinGecko and Allium on-chain`,
              ]
            );
          }

          processed++;
        }
      } catch (err) {
        console.error(`  Batch ${i} failed:`, (err as Error).message);
      }
    }

    await query(
      `UPDATE ingestion_run SET status = 'completed', completed_at = NOW(),
       records_processed = $2, records_failed = $3 WHERE id = $1`,
      [runId, processed, flagged]
    );

    console.log(`[allium:reconcile-prices] Done. Processed: ${processed}, Flagged: ${flagged}`);
  } catch (err) {
    await query(
      `UPDATE ingestion_run SET status = 'failed', completed_at = NOW(),
       error_message = $2 WHERE id = $1`,
      [runId, (err as Error).message]
    );
    throw err;
  }
}

// ---- Treasury & Staking Wallet Verification ----

/**
 * Verify known treasury/staking wallet balances using Allium wallet API.
 * Useful for confirming buyback fund sizes and treasury holdings.
 */
export async function verifyWalletBalances(
  wallets: Array<{ chain: string; address: string; label: string; protocol_id: string }>
): Promise<void> {
  const runId = uuid();
  console.log(`[allium:wallet-verify] Starting run ${runId}, ${wallets.length} wallets`);

  await query(
    `INSERT INTO ingestion_run (id, provider, job_type, status, started_at)
     VALUES ($1, 'allium', 'wallet_verification', 'running', NOW())`,
    [runId]
  );

  try {
    // Check which chains support wallet balances
    const chains = await allium.getSupportedChains();
    const balanceChains = chains["/api/v1/developer/wallet/balances"] || [];

    const eligible = wallets.filter((w) => balanceChains.includes(w.chain.toLowerCase()));
    console.log(`  ${eligible.length}/${wallets.length} wallets on supported chains`);

    let processed = 0;

    for (const w of eligible) {
      try {
        const balances = await allium.getWalletBalances([
          { chain: w.chain.toLowerCase(), address: w.address },
        ]);

        const totalUsd = balances.reduce((sum, b) => sum + (b.balance_usd || 0), 0);

        // Store in source_lineage for audit
        await query(
          `INSERT INTO source_lineage (id, entity_type, entity_id, field_name, provider, raw_value, fetched_at)
           VALUES ($1, 'wallet', $2, 'total_balance_usd', 'allium', $3, NOW())
           ON CONFLICT DO NOTHING`,
          [uuid(), `${w.protocol_id}:${w.label}`, JSON.stringify({ total_usd: totalUsd, tokens: balances.length })]
        );

        console.log(`  ${w.label} (${w.chain}): $${totalUsd.toLocaleString()} across ${balances.length} tokens`);
        processed++;
      } catch (err) {
        console.error(`  Failed for ${w.label}:`, (err as Error).message);
      }
    }

    await query(
      `UPDATE ingestion_run SET status = 'completed', completed_at = NOW(),
       records_processed = $2 WHERE id = $1`,
      [runId, processed]
    );

    console.log(`[allium:wallet-verify] Done. Processed: ${processed}`);
  } catch (err) {
    await query(
      `UPDATE ingestion_run SET status = 'failed', completed_at = NOW(),
       error_message = $2 WHERE id = $1`,
      [runId, (err as Error).message]
    );
    throw err;
  }
}

// ---- Custom SQL Analytics ----

/**
 * Run custom SQL queries via Allium Explorer for on-chain analytics
 * that aren't available through the REST endpoints.
 *
 * Example: DEX volume aggregation, protocol-specific contract events,
 * cross-chain fee reconciliation.
 */
export async function runCustomAnalytics(
  sqlQueries: Array<{ name: string; sql: string; handler: (rows: any[]) => Promise<void> }>
): Promise<void> {
  const runId = uuid();
  console.log(`[allium:custom-sql] Starting run ${runId}, ${sqlQueries.length} queries`);

  await query(
    `INSERT INTO ingestion_run (id, provider, job_type, status, started_at)
     VALUES ($1, 'allium', 'custom_sql', 'running', NOW())`,
    [runId]
  );

  const queryId = await ensureQueryId();
  let processed = 0;
  let failed = 0;

  for (const q of sqlQueries) {
    try {
      console.log(`  Running: ${q.name}`);
      const results = await allium.executeSQL(queryId, q.sql, 120_000);
      console.log(`  ${q.name}: ${results.length} rows`);

      await q.handler(results);
      processed++;
    } catch (err) {
      console.error(`  ${q.name} failed:`, (err as Error).message);
      failed++;
    }
  }

  await query(
    `UPDATE ingestion_run SET status = $2, completed_at = NOW(),
     records_processed = $3, records_failed = $4 WHERE id = $1`,
    [runId, failed > 0 ? "partial" : "completed", processed, failed]
  );

  console.log(`[allium:custom-sql] Done. Processed: ${processed}, Failed: ${failed}`);
}

// ---- Historical Price Backfill ----

/**
 * Backfill historical OHLCV prices from Allium for tokens that have
 * on-chain addresses. Useful for verifying CoinGecko data and filling
 * gaps in coverage.
 */
export async function backfillPriceHistory(
  tokens: AlliumTokenAddress[],
  startTimestamp: number,
  endTimestamp: number,
  granularity: "1h" | "4h" | "1d" = "1d"
): Promise<void> {
  const runId = uuid();
  console.log(`[allium:price-backfill] Starting run ${runId}, ${tokens.length} tokens`);

  await query(
    `INSERT INTO ingestion_run (id, provider, job_type, status, started_at)
     VALUES ($1, 'allium', 'price_backfill', 'running', NOW())`,
    [runId]
  );

  try {
    // Chunk into batches of 5 tokens (Allium history can be heavy)
    let totalRecords = 0;

    for (let i = 0; i < tokens.length; i += 5) {
      const batch = tokens.slice(i, i + 5);

      try {
        const history = await allium.getPriceHistory(batch, startTimestamp, endTimestamp, granularity);

        for (const item of history.items) {
          // Store as source_lineage for cross-reference
          for (const price of item.prices) {
            await query(
              `INSERT INTO source_lineage (id, entity_type, entity_id, field_name, provider, raw_value, fetched_at)
               VALUES ($1, 'price', $2, 'ohlcv', 'allium', $3, NOW())
               ON CONFLICT DO NOTHING`,
              [
                uuid(),
                `${item.chain}:${item.mint}:${price.timestamp}`,
                JSON.stringify(price),
              ]
            );
            totalRecords++;
          }
        }
      } catch (err) {
        console.error(`  Batch ${i} failed:`, (err as Error).message);
      }
    }

    await query(
      `UPDATE ingestion_run SET status = 'completed', completed_at = NOW(),
       records_processed = $2 WHERE id = $1`,
      [runId, totalRecords]
    );

    console.log(`[allium:price-backfill] Done. ${totalRecords} OHLCV records stored`);
  } catch (err) {
    await query(
      `UPDATE ingestion_run SET status = 'failed', completed_at = NOW(),
       error_message = $2 WHERE id = $1`,
      [runId, (err as Error).message]
    );
    throw err;
  }
}

// ---- Pre-built SQL Queries for Protocol Analytics ----

/**
 * Common SQL queries for protocol-level on-chain analytics via Allium Explorer.
 */
export const SQL_QUERIES = {
  /** Daily DEX volume on Ethereum for the last 30 days */
  ethDexVolume30d: `
    SELECT
      DATE(block_timestamp) as date,
      COUNT(*) as swap_count,
      SUM(amount_usd) as volume_usd
    FROM ethereum.dex.trades
    WHERE block_timestamp >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY DATE(block_timestamp)
    ORDER BY date DESC
  `,

  /** Top 20 protocols by Ethereum gas consumption (last 7 days) */
  topGasConsumers7d: `
    SELECT
      to_address as contract_address,
      COUNT(*) as tx_count,
      SUM(gas_used * gas_price / 1e18) as eth_spent
    FROM ethereum.raw.transactions
    WHERE block_timestamp >= CURRENT_DATE - INTERVAL '7 days'
      AND status = 1
    GROUP BY to_address
    ORDER BY eth_spent DESC
    LIMIT 20
  `,

  /** Uniswap V3 daily volume by pool (last 30 days) */
  uniswapV3Volume: `
    SELECT
      DATE(block_timestamp) as date,
      pool_address,
      token0_symbol,
      token1_symbol,
      SUM(amount_usd) as volume_usd,
      COUNT(*) as num_swaps
    FROM ethereum.dex.trades
    WHERE protocol = 'uniswap_v3'
      AND block_timestamp >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY date, pool_address, token0_symbol, token1_symbol
    ORDER BY volume_usd DESC
    LIMIT 100
  `,

  /** Solana DEX volume by protocol (last 7 days) */
  solanaDexVolume: `
    SELECT
      DATE(block_timestamp) as date,
      protocol,
      SUM(amount_usd) as volume_usd,
      COUNT(*) as num_trades
    FROM solana.dex.trades
    WHERE block_timestamp >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY date, protocol
    ORDER BY volume_usd DESC
  `,
};

export const alliumIngestion = {
  reconcilePrices,
  verifyWalletBalances,
  runCustomAnalytics,
  backfillPriceHistory,
  SQL_QUERIES,
};
