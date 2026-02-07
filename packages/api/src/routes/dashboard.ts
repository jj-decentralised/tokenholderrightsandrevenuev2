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

    // Top protocols by revenue — simplified query that works even with empty tables
    const topProtocols = await query(
      `SELECT
        p.id, p.name, p.slug, p.logo_url, p.primary_category, p.tokenization_type,
        t.symbol as token_symbol,
        COALESCE(rev.period_fees, 0) as period_fees,
        COALESCE(rev.period_revenue, 0) as period_revenue,
        COALESCE(rev.period_holder_revenue, 0) as period_holder_revenue,
        tm.price_usd, tm.market_cap_usd, tm.fdv_usd,
        cm.real_pe_ratio,
        cm.revenue_yield as revenue_yield_pct,
        cm.productive_token_score,
        hs.total_holders as holder_count,
        cm.holder_growth_30d
      FROM protocol p
      LEFT JOIN token t ON t.protocol_id = p.id
      LEFT JOIN LATERAL (
        SELECT
          SUM(daily_fees_usd) as period_fees,
          SUM(daily_revenue_usd) as period_revenue,
          SUM(daily_holders_revenue_usd) as period_holder_revenue
        FROM revenue_daily
        WHERE protocol_id = p.id AND date >= $1 AND date <= $2
      ) rev ON true
      LEFT JOIN LATERAL (
        SELECT price_usd, market_cap_usd, fdv_usd
        FROM token_market_daily
        WHERE token_id = t.id
        ORDER BY date DESC LIMIT 1
      ) tm ON t.id IS NOT NULL
      LEFT JOIN LATERAL (
        SELECT real_pe_ratio, revenue_yield, productive_token_score, holder_growth_30d
        FROM computed_metrics
        WHERE protocol_id = p.id
        ORDER BY date DESC LIMIT 1
      ) cm ON true
      LEFT JOIN LATERAL (
        SELECT total_holders
        FROM holder_snapshot
        WHERE token_id = t.id
        ORDER BY snapshot_date DESC LIMIT 1
      ) hs ON t.id IS NOT NULL
      WHERE p.status = 'active'
      ORDER BY COALESCE(rev.period_fees, 0) DESC
      LIMIT 50`,
      [start, end]
    );

    // Top movers - highest yield (safe with empty computed_metrics)
    const highestYield = await query(
      `SELECT p.id, p.name, p.slug, t.symbol as token_symbol, cm.revenue_yield as revenue_yield_pct
      FROM computed_metrics cm
      JOIN protocol p ON p.id = cm.protocol_id
      LEFT JOIN token t ON t.protocol_id = p.id
      WHERE cm.date = (SELECT MAX(date) FROM computed_metrics)
        AND cm.revenue_yield IS NOT NULL
        AND cm.revenue_yield > 0
      ORDER BY cm.revenue_yield DESC
      LIMIT 5`
    );

    // Top movers - fastest holder growth
    const fastestGrowth = await query(
      `SELECT p.id, p.name, p.slug, t.symbol as token_symbol, cm.holder_growth_30d
      FROM computed_metrics cm
      JOIN protocol p ON p.id = cm.protocol_id
      LEFT JOIN token t ON t.protocol_id = p.id
      WHERE cm.date = (SELECT MAX(date) FROM computed_metrics)
        AND cm.holder_growth_30d IS NOT NULL
      ORDER BY cm.holder_growth_30d DESC
      LIMIT 5`
    );

    const agg = aggregates.rows[0];
    const avgYield = highestYield.rows.length > 0
      ? highestYield.rows.reduce((sum: number, r: any) => sum + Number(r.revenue_yield_pct || 0), 0) / highestYield.rows.length
      : 0;

    // Response format that matches the frontend DashboardData interface
    res.json({
      overview: {
        total_fees: Number(agg.total_fees),
        total_revenue: Number(agg.total_revenue),
        total_holder_revenue: Number(agg.total_holder_revenue),
        protocols_with_fee_sharing: Number(feeSharingCount.rows[0].count),
        avg_holder_revenue_yield: avgYield,
      },
      protocols: topProtocols.rows.map((p: any) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        logo_url: p.logo_url,
        primary_category: p.primary_category,
        tokenization_type: p.tokenization_type,
        token_symbol: p.token_symbol,
        period_fees: Number(p.period_fees),
        period_revenue: Number(p.period_revenue),
        period_holder_revenue: Number(p.period_holder_revenue),
        price_usd: p.price_usd ? Number(p.price_usd) : null,
        market_cap_usd: p.market_cap_usd ? Number(p.market_cap_usd) : null,
        fdv_usd: p.fdv_usd ? Number(p.fdv_usd) : null,
        real_pe_ratio: p.real_pe_ratio ? Number(p.real_pe_ratio) : null,
        revenue_yield_pct: p.revenue_yield_pct ? Number(p.revenue_yield_pct) : null,
        productive_token_score: p.productive_token_score ? Number(p.productive_token_score) : null,
        holder_count: p.holder_count ? Number(p.holder_count) : null,
        holder_growth_30d: p.holder_growth_30d ? Number(p.holder_growth_30d) : null,
      })),
      top_movers: {
        highest_yield: highestYield.rows,
        fastest_growth: fastestGrowth.rows,
      },
      as_of: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
