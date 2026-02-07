import { v4 as uuid } from "uuid";
import { query } from "../../db/connection.js";
import { formatDate } from "../../lib/time.js";

export async function computeDailyMetrics(): Promise<void> {
  const today = formatDate(new Date());
  console.log(`Computing daily metrics for ${today}`);

  const protocols = await query(
    `SELECT p.id as protocol_id, t.id as token_id
    FROM protocol p
    LEFT JOIN token t ON t.protocol_id = p.id
    WHERE p.status = 'active'`
  );

  for (const row of protocols.rows) {
    try {
      await computeMetricsForProtocol(row.protocol_id, row.token_id, today);
    } catch (error) {
      console.error(
        `Failed to compute metrics for protocol ${row.protocol_id}:`,
        (error as Error).message
      );
    }
  }

  console.log(`Metrics computation complete for ${protocols.rows.length} protocols`);
}

async function computeMetricsForProtocol(
  protocolId: string,
  tokenId: string | null,
  date: string
): Promise<void> {
  // Get trailing 30-day revenue
  const revResult = await query(
    `SELECT
      AVG(daily_fees_usd) as avg_fees,
      AVG(daily_revenue_usd) as avg_revenue,
      AVG(daily_holders_revenue_usd) as avg_holder_revenue,
      SUM(daily_fees_usd) as total_fees_30d,
      SUM(daily_revenue_usd) as total_revenue_30d,
      SUM(daily_holders_revenue_usd) as total_holder_revenue_30d,
      SUM(daily_supply_side_usd) as total_supply_side_30d
    FROM revenue_daily
    WHERE protocol_id = $1 AND date >= (CURRENT_DATE - INTERVAL '30 days')`,
    [protocolId]
  );

  const rev = revResult.rows[0];
  const annualizedRevenue = Number(rev.avg_revenue || 0) * 365;
  const annualizedHolderRevenue = Number(rev.avg_holder_revenue || 0) * 365;
  const totalFees30d = Number(rev.total_fees_30d || 0);

  // Market data
  let marketCap: number | null = null;
  let fdv: number | null = null;
  if (tokenId) {
    const marketResult = await query(
      `SELECT market_cap_usd, fdv_usd FROM token_market_daily
      WHERE token_id = $1 ORDER BY date DESC LIMIT 1`,
      [tokenId]
    );
    if (marketResult.rows.length > 0) {
      marketCap = Number(marketResult.rows[0].market_cap_usd);
      fdv = Number(marketResult.rows[0].fdv_usd);
    }
  }

  // Valuation ratios
  const psRatio = marketCap && annualizedRevenue > 0 ? marketCap / (Number(rev.avg_fees || 0) * 365) : null;
  const peRatio = marketCap && annualizedRevenue > 0 ? marketCap / annualizedRevenue : null;
  const realPeRatio = marketCap && annualizedHolderRevenue > 0 ? marketCap / annualizedHolderRevenue : null;
  const revenueYield = marketCap && marketCap > 0 ? (annualizedHolderRevenue / marketCap) * 100 : null;

  // Revenue attribution percentages
  const holderRevenuePct = totalFees30d > 0
    ? (Number(rev.total_holder_revenue_30d || 0) / totalFees30d) * 100 : null;
  const supplySidePct = totalFees30d > 0
    ? (Number(rev.total_supply_side_30d || 0) / totalFees30d) * 100 : null;
  const treasuryPct = holderRevenuePct && supplySidePct
    ? Math.max(0, 100 - holderRevenuePct - supplySidePct) : null;

  // Holder metrics
  let holderGrowth7d: number | null = null;
  let holderGrowth30d: number | null = null;
  let revenuePerHolder: number | null = null;
  let annualRevenuePerHolder: number | null = null;
  let totalHolders = 0;

  if (tokenId) {
    const holderResult = await query(
      `SELECT snapshot_date, total_holders FROM holder_snapshot
      WHERE token_id = $1 AND snapshot_date >= (CURRENT_DATE - INTERVAL '31 days')
      ORDER BY snapshot_date ASC`,
      [tokenId]
    );

    if (holderResult.rows.length > 0) {
      const latest = holderResult.rows[holderResult.rows.length - 1];
      totalHolders = Number(latest.total_holders || 0);

      const d7 = holderResult.rows.find(
        (r: any) => new Date(r.snapshot_date) <= new Date(Date.now() - 7 * 86400000)
      );
      const d30 = holderResult.rows[0];

      if (d7 && Number(d7.total_holders) > 0) {
        holderGrowth7d = ((totalHolders - Number(d7.total_holders)) / Number(d7.total_holders)) * 100;
      }
      if (d30 && Number(d30.total_holders) > 0) {
        holderGrowth30d = ((totalHolders - Number(d30.total_holders)) / Number(d30.total_holders)) * 100;
      }

      if (totalHolders > 0) {
        revenuePerHolder = Number(rev.avg_holder_revenue || 0) / totalHolders;
        annualRevenuePerHolder = annualizedHolderRevenue / totalHolders;
      }
    }
  }

  // Productive Token Score components
  const revenueToHoldersScore = computeRevenueToHoldersScore(holderRevenuePct);
  const mechanismMaturityScore = await computeMechanismMaturityScore(tokenId);
  const holderGrowthScore = computeHolderGrowthScore(holderGrowth30d);
  const concentrationScore = await computeConcentrationScore(tokenId);
  const productiveTokenScore = revenueToHoldersScore + mechanismMaturityScore + holderGrowthScore + concentrationScore;

  await query(
    `INSERT INTO computed_metrics (
      id, protocol_id, token_id, date,
      ps_ratio, pe_ratio, real_pe_ratio, revenue_yield,
      revenue_per_holder, annual_revenue_per_holder,
      holder_revenue_pct, supply_side_pct, treasury_pct,
      holder_growth_7d, holder_growth_30d,
      revenue_to_holders_score, holder_growth_score,
      concentration_score, mechanism_maturity_score, productive_token_score
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
    ON CONFLICT (protocol_id, date) DO UPDATE SET
      token_id = EXCLUDED.token_id,
      ps_ratio = EXCLUDED.ps_ratio, pe_ratio = EXCLUDED.pe_ratio,
      real_pe_ratio = EXCLUDED.real_pe_ratio, revenue_yield = EXCLUDED.revenue_yield,
      revenue_per_holder = EXCLUDED.revenue_per_holder,
      annual_revenue_per_holder = EXCLUDED.annual_revenue_per_holder,
      holder_revenue_pct = EXCLUDED.holder_revenue_pct,
      supply_side_pct = EXCLUDED.supply_side_pct,
      treasury_pct = EXCLUDED.treasury_pct,
      holder_growth_7d = EXCLUDED.holder_growth_7d,
      holder_growth_30d = EXCLUDED.holder_growth_30d,
      revenue_to_holders_score = EXCLUDED.revenue_to_holders_score,
      holder_growth_score = EXCLUDED.holder_growth_score,
      concentration_score = EXCLUDED.concentration_score,
      mechanism_maturity_score = EXCLUDED.mechanism_maturity_score,
      productive_token_score = EXCLUDED.productive_token_score`,
    [
      uuid(), protocolId, tokenId, date,
      psRatio, peRatio, realPeRatio, revenueYield,
      revenuePerHolder, annualRevenuePerHolder,
      holderRevenuePct, supplySidePct, treasuryPct,
      holderGrowth7d, holderGrowth30d,
      revenueToHoldersScore, holderGrowthScore,
      concentrationScore, mechanismMaturityScore, productiveTokenScore,
    ]
  );

  // Update token's productive score
  if (tokenId) {
    await query(
      `UPDATE token SET productive_token_score = $1, updated_at = NOW() WHERE id = $2`,
      [productiveTokenScore, tokenId]
    );
  }
}

function computeRevenueToHoldersScore(pct: number | null): number {
  if (!pct || pct <= 0) return 0;
  if (pct >= 50) return 2.5;
  return (pct / 50) * 2.5;
}

async function computeMechanismMaturityScore(tokenId: string | null): Promise<number> {
  if (!tokenId) return 0;
  const result = await query(
    `SELECT activation_date, is_active FROM token_rights
    WHERE token_id = $1 AND right_type IN ('fee_sharing', 'buyback_burn', 'buyback_redistribute', 've_model')
    ORDER BY activation_date ASC LIMIT 1`,
    [tokenId]
  );
  if (result.rows.length === 0 || !result.rows[0].is_active) return 0;
  const activationDate = new Date(result.rows[0].activation_date);
  const daysSinceActivation = (Date.now() - activationDate.getTime()) / (86400 * 1000);
  if (daysSinceActivation >= 730) return 2.5;  // 2+ years
  if (daysSinceActivation >= 365) return 1.8;
  if (daysSinceActivation >= 180) return 1.2;
  if (daysSinceActivation >= 90) return 0.7;
  return 0.3;
}

function computeHolderGrowthScore(growth30d: number | null): number {
  if (!growth30d) return 0;
  if (growth30d >= 20) return 2.5;
  if (growth30d > 0) return (growth30d / 20) * 2.5;
  return 0;
}

async function computeConcentrationScore(tokenId: string | null): Promise<number> {
  if (!tokenId) return 0;
  const result = await query(
    `SELECT top10_pct FROM holder_snapshot
    WHERE token_id = $1 ORDER BY snapshot_date DESC LIMIT 1`,
    [tokenId]
  );
  if (result.rows.length === 0 || !result.rows[0].top10_pct) return 0;
  const top10 = Number(result.rows[0].top10_pct);
  // Lower concentration = higher score
  if (top10 <= 20) return 2.5;
  if (top10 <= 40) return 2.0;
  if (top10 <= 60) return 1.5;
  if (top10 <= 80) return 0.8;
  return 0.2;
}
