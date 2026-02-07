import { v4 as uuid } from "uuid";
import { query } from "../../db/connection.js";
import { codex } from "../providers/codex.js";
import { formatDate } from "../../lib/time.js";

export async function ingestHolderSnapshot(
  tokenId: string,
  tokenContractId: string,
  codexTokenId: string,
  runId: string,
  fetchDetails = false
): Promise<number> {
  let records = 0;
  const date = formatDate(new Date());

  if (fetchDetails) {
    // Full holder detail fetch
    const holders = await codex.getHolders(codexTokenId, 200);
    const snapshotId = uuid();

    // Calculate top50 and top100 percentages
    let top50Pct = null;
    let top100Pct = null;
    const items = holders.items || [];
    const totalBalance = items.reduce((sum, h) => sum + h.shiftedBalance, 0);

    if (totalBalance > 0 && items.length >= 50) {
      const top50Balance = items.slice(0, 50).reduce((sum, h) => sum + h.shiftedBalance, 0);
      top50Pct = (top50Balance / totalBalance) * 100;
    }
    if (totalBalance > 0 && items.length >= 100) {
      const top100Balance = items.slice(0, 100).reduce((sum, h) => sum + h.shiftedBalance, 0);
      top100Pct = (top100Balance / totalBalance) * 100;
    }

    // Calculate Gini coefficient
    let gini = null;
    if (items.length > 1) {
      const balances = items.map((h) => h.shiftedBalance).sort((a, b) => a - b);
      const n = balances.length;
      const mean = balances.reduce((a, b) => a + b, 0) / n;
      if (mean > 0) {
        let sumDiff = 0;
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            sumDiff += Math.abs(balances[i] - balances[j]);
          }
        }
        gini = sumDiff / (2 * n * n * mean);
      }
    }

    // Get previous snapshot for delta
    const prevSnapshot = await query(
      `SELECT total_holders FROM holder_snapshot
      WHERE token_contract_id = $1 AND snapshot_date < $2
      ORDER BY snapshot_date DESC LIMIT 1`,
      [tokenContractId, date]
    );
    const prevHolders = prevSnapshot.rows[0]?.total_holders || 0;
    const newHolders24h = holders.count - prevHolders;

    await query(
      `INSERT INTO holder_snapshot
        (id, token_contract_id, token_id, snapshot_date, total_holders,
         top10_pct, top50_pct, top100_pct, gini_coefficient, new_holders_24h,
         source_provider, source_as_of, ingestion_run_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'codex', NOW(), $11)
      ON CONFLICT (token_contract_id, snapshot_date) DO UPDATE SET
        total_holders = EXCLUDED.total_holders,
        top10_pct = EXCLUDED.top10_pct,
        top50_pct = EXCLUDED.top50_pct,
        top100_pct = EXCLUDED.top100_pct,
        gini_coefficient = EXCLUDED.gini_coefficient,
        new_holders_24h = EXCLUDED.new_holders_24h,
        source_as_of = NOW()`,
      [
        snapshotId, tokenContractId, tokenId, date,
        holders.count, holders.top10HoldersPercent,
        top50Pct, top100Pct, gini, newHolders24h, runId,
      ]
    );
    records++;

    // Store holder details
    for (let i = 0; i < items.length; i++) {
      const h = items[i];
      await query(
        `INSERT INTO holder_detail
          (id, holder_snapshot_id, wallet_address, balance, balance_usd,
           pct_of_supply, first_held_date, rank)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          uuid(), snapshotId, h.address, h.shiftedBalance, h.balanceUsd,
          totalBalance > 0 ? (h.shiftedBalance / totalBalance) * 100 : 0,
          h.firstHeldTimestamp ? new Date(h.firstHeldTimestamp * 1000) : null,
          i + 1,
        ]
      );
    }
    records += items.length;
  } else {
    // Lightweight count-only fetch
    const data = await codex.getHolderCount(codexTokenId);
    const snapshotId = uuid();

    const prevSnapshot = await query(
      `SELECT total_holders FROM holder_snapshot
      WHERE token_contract_id = $1 AND snapshot_date < $2
      ORDER BY snapshot_date DESC LIMIT 1`,
      [tokenContractId, date]
    );
    const prevHolders = prevSnapshot.rows[0]?.total_holders || 0;

    await query(
      `INSERT INTO holder_snapshot
        (id, token_contract_id, token_id, snapshot_date, total_holders,
         top10_pct, new_holders_24h, source_provider, source_as_of, ingestion_run_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'codex', NOW(), $8)
      ON CONFLICT (token_contract_id, snapshot_date) DO UPDATE SET
        total_holders = EXCLUDED.total_holders,
        top10_pct = EXCLUDED.top10_pct,
        new_holders_24h = EXCLUDED.new_holders_24h,
        source_as_of = NOW()`,
      [
        snapshotId, tokenContractId, tokenId, date,
        data.count, data.top10HoldersPercent,
        data.count - prevHolders, runId,
      ]
    );
    records++;
  }

  return records;
}

export async function ingestAllHolderData(): Promise<void> {
  const runId = `holder-${Date.now()}`;
  console.log(`Starting holder data ingestion run: ${runId}`);

  await query(
    `INSERT INTO ingestion_run (id, provider, job_type, status)
    VALUES ($1, 'codex', 'holder_snapshot', 'running')`,
    [runId]
  );

  try {
    const contracts = await query(
      `SELECT tc.id as contract_id, tc.token_id, tc.codex_token_id,
              t.symbol, ROW_NUMBER() OVER (ORDER BY t.productive_token_score DESC NULLS LAST) as rank
      FROM token_contract tc
      JOIN token t ON t.id = tc.token_id
      WHERE tc.codex_token_id IS NOT NULL`
    );

    let totalRecords = 0;
    let totalFailed = 0;

    for (const contract of contracts.rows) {
      try {
        const fetchDetails = Number(contract.rank) <= 50;
        const records = await ingestHolderSnapshot(
          contract.token_id,
          contract.contract_id,
          contract.codex_token_id,
          runId,
          fetchDetails
        );
        totalRecords += records;
        console.log(`  Ingested ${records} holder records for ${contract.symbol}`);
      } catch (error) {
        totalFailed++;
        console.error(`  Failed: ${contract.symbol}:`, (error as Error).message);
      }
    }

    await query(
      `UPDATE ingestion_run SET status = 'completed', completed_at = NOW(),
        records_processed = $2, records_failed = $3
      WHERE id = $1`,
      [runId, totalRecords, totalFailed]
    );

    console.log(`Holder ingestion complete: ${totalRecords} records, ${totalFailed} failures`);
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
