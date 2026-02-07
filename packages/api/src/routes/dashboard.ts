import { Router } from "express";
import { query } from "../db/connection.js";
import { validate } from "../middleware/validate.js";
import { dashboardQuerySchema } from "../lib/validation.js";
import { getDateRangeFromTimeRange } from "../lib/time.js";
import type { TimeRange } from "../types/index.js";

const router = Router();

router.get("/overview", validate(dashboardQuerySchema), async (req, res, next) => {
  try {
    const range = (req.query as { range: TimeRange }).range;
    const { start, end } = getDateRangeFromTimeRange(range);

    // Aggregate revenue metrics
    const aggregates = await query(
      `SELECT
        COALESCE(SUM(daily_fees_usd), 0) as total_fees,
        COALESCE(SUM(daily_revenue_usd), 0) as total_revenue,
        COALESCE(SUM(daily_holders_revenue_usd), 0) as total_holder_revenue
      FROM revenue_daily
      WHERE date >= $1 AND date <= $2`,
      [start, end]
    );

    // Count protocols with active fee sharing
    const feeSharingCount = await query(
      `SELECT COUNT(DISTINCT p.id) as count
      FROM protocol p
      JOIN token t ON t.protocol_id = p.id
      WHERE t.revenue_mechanism_status = 'active'`
    );

    // Top protocols by revenue
    const topProtocols = await query(
      `SELECT
        p.id, p.name, p.slug, p.logo_url, p.primary_category, p.tokenization_type,
        t.symbol as token_symbol,
        COALESCE(SUM(r.daily_fees_usd), 0) as fees_period,
        COALESCE(SUM(r.daily_revenue_usd), 0) as revenue_period,
        COALESCE(SUM(r.daily_holders_revenue_usd), 0) as holder_revenue_period,
        tm.price_usd, tm.market_cap_usd, tm.fdv_usd,
        cm.real_pe_ratio, cm.revenue_yield, cm.holder_revenue_pct,
        cm.productive_token_score,
        hs.total_holders as holders_count,
        cm.holder_growth_30d
      FROM protocol p
      LEFT JOIN token t ON t.protocol_id = p.id AND t.has_revenue_rights = true
      LEFT JOIN revenue_daily r ON r.protocol_id = p.id AND r.date >= $1 AND r.date <= $2
      LEFT JOIN LATERAL (
        SELECT * FROM token_market_daily
        WHERE token_id = t.id
        ORDER BY date DESC LIMIT 1
      ) tm ON true
      LEFT JOIN LATERAL (
        SELECT * FROM computed_metrics
        WHERE protocol_id = p.id
        ORDER BY date DESC LIMIT 1
      ) cm ON true
      LEFT JOIN LATERAL (
        SELECT * FROM holder_snapshot
        WHERE token_id = t.id
        ORDER BY snapshot_date DESC LIMIT 1
      ) hs ON true
      WHERE p.status = 'active'
      GROUP BY p.id, p.name, p.slug, p.logo_url, p.primary_category, p.tokenization_type,
               t.symbol, tm.price_usd, tm.market_cap_usd, tm.fdv_usd,
               cm.real_pe_ratio, cm.revenue_yield, cm.holder_revenue_pct,
               cm.productive_token_score, hs.total_holders, cm.holder_growth_30d
      ORDER BY revenue_period DESC
      LIMIT 50`,
      [start, end]
    );

    // Top movers - highest yield
    const highestYield = await query(
      `SELECT p.id, p.name, p.slug, p.logo_url, cm.revenue_yield, cm.productive_token_score
      FROM computed_metrics cm
      JOIN protocol p ON p.id = cm.protocol_id
      WHERE cm.date = (SELECT MAX(date) FROM computed_metrics)
        AND cm.revenue_yield IS NOT NULL
        AND cm.revenue_yield > 0
      ORDER BY cm.revenue_yield DESC
      LIMIT 5`
    );

    // Top movers - fastest holder growth
    const fastestGrowth = await query(
      `SELECT p.id, p.name, p.slug, p.logo_url, cm.holder_growth_7d, cm.holder_growth_30d
      FROM computed_metrics cm
      JOIN protocol p ON p.id = cm.protocol_id
      WHERE cm.date = (SELECT MAX(date) FROM computed_metrics)
        AND cm.holder_growth_7d IS NOT NULL
      ORDER BY cm.holder_growth_7d DESC
      LIMIT 5`
    );

    const agg = aggregates.rows[0];
    const avgYield = highestYield.rows.length > 0
      ? highestYield.rows.reduce((sum: number, r: any) => sum + Number(r.revenue_yield || 0), 0) / highestYield.rows.length
      : 0;

    res.json({
      total_fees_24h: Number(agg.total_fees),
      total_revenue_24h: Number(agg.total_revenue),
      total_holder_revenue_24h: Number(agg.total_holder_revenue),
      protocols_with_fee_sharing: Number(feeSharingCount.rows[0].count),
      avg_holder_revenue_yield: avgYield,
      top_protocols: topProtocols.rows,
      top_movers: {
        highest_yield: highestYield.rows,
        fastest_holder_growth: fastestGrowth.rows,
      },
      as_of: new Date().toISOString(),
      source: "crypto-terminal",
    });
  } catch (error) {
    next(error);
  }
});

export default router;
