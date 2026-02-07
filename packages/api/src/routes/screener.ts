import { Router } from "express";
import { query } from "../db/connection.js";
import { validate } from "../middleware/validate.js";
import { screenerSchema } from "../lib/validation.js";

const router = Router();

router.get("/", validate(screenerSchema), async (req, res, next) => {
  try {
    const params = req.query as any;
    const { page, limit, sort_by, sort_dir } = params;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const sqlParams: unknown[] = [];
    let paramIdx = 1;

    if (params.category?.length) {
      conditions.push(`p.primary_category = ANY($${paramIdx})`);
      sqlParams.push(params.category);
      paramIdx++;
    }
    if (params.has_token !== undefined) {
      conditions.push(`p.tokenization_type ${params.has_token ? "!=" : "="} 'non_tokenized'`);
    }
    if (params.has_revenue_rights !== undefined) {
      conditions.push(`t.has_revenue_rights = $${paramIdx}`);
      sqlParams.push(params.has_revenue_rights);
      paramIdx++;
    }
    if (params.min_revenue_24h != null) {
      conditions.push(`r_latest.daily_revenue_usd >= $${paramIdx}`);
      sqlParams.push(params.min_revenue_24h);
      paramIdx++;
    }
    if (params.max_revenue_24h != null) {
      conditions.push(`r_latest.daily_revenue_usd <= $${paramIdx}`);
      sqlParams.push(params.max_revenue_24h);
      paramIdx++;
    }
    if (params.min_real_pe != null) {
      conditions.push(`cm.real_pe_ratio >= $${paramIdx}`);
      sqlParams.push(params.min_real_pe);
      paramIdx++;
    }
    if (params.max_real_pe != null) {
      conditions.push(`cm.real_pe_ratio <= $${paramIdx}`);
      sqlParams.push(params.max_real_pe);
      paramIdx++;
    }
    if (params.min_holders != null) {
      conditions.push(`hs.total_holders >= $${paramIdx}`);
      sqlParams.push(params.min_holders);
      paramIdx++;
    }
    if (params.max_holders != null) {
      conditions.push(`hs.total_holders <= $${paramIdx}`);
      sqlParams.push(params.max_holders);
      paramIdx++;
    }
    if (params.min_market_cap != null) {
      conditions.push(`tm.market_cap_usd >= $${paramIdx}`);
      sqlParams.push(params.min_market_cap);
      paramIdx++;
    }
    if (params.max_market_cap != null) {
      conditions.push(`tm.market_cap_usd <= $${paramIdx}`);
      sqlParams.push(params.max_market_cap);
      paramIdx++;
    }
    if (params.min_productive_score != null) {
      conditions.push(`cm.productive_token_score >= $${paramIdx}`);
      sqlParams.push(params.min_productive_score);
      paramIdx++;
    }
    if (params.max_productive_score != null) {
      conditions.push(`cm.productive_token_score <= $${paramIdx}`);
      sqlParams.push(params.max_productive_score);
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const validSorts: Record<string, string> = {
      name: "p.name",
      revenue: "r_latest.daily_revenue_usd",
      holder_revenue: "r_latest.daily_holders_revenue_usd",
      market_cap: "tm.market_cap_usd",
      real_pe: "cm.real_pe_ratio",
      holders: "hs.total_holders",
      holder_growth: "cm.holder_growth_30d",
      productive_score: "cm.productive_token_score",
      yield: "cm.revenue_yield",
    };
    const orderCol = validSorts[sort_by] || "r_latest.daily_revenue_usd";
    const orderDir = sort_dir === "asc" ? "ASC" : "DESC";

    const result = await query(
      `SELECT
        p.id, p.name, p.slug, p.logo_url, p.primary_category, p.tokenization_type,
        t.symbol as token_symbol, t.has_revenue_rights,
        r_latest.daily_fees_usd as fees_24h,
        r_latest.daily_revenue_usd as revenue_24h,
        r_latest.daily_holders_revenue_usd as holder_revenue_24h,
        tm.price_usd, tm.market_cap_usd, tm.fdv_usd,
        cm.real_pe_ratio, cm.revenue_yield, cm.holder_revenue_pct,
        cm.productive_token_score, cm.holder_growth_30d,
        hs.total_holders
      FROM protocol p
      LEFT JOIN token t ON t.protocol_id = p.id
      LEFT JOIN LATERAL (
        SELECT * FROM revenue_daily WHERE protocol_id = p.id ORDER BY date DESC LIMIT 1
      ) r_latest ON true
      LEFT JOIN LATERAL (
        SELECT * FROM token_market_daily WHERE token_id = t.id ORDER BY date DESC LIMIT 1
      ) tm ON true
      LEFT JOIN LATERAL (
        SELECT * FROM computed_metrics WHERE protocol_id = p.id ORDER BY date DESC LIMIT 1
      ) cm ON true
      LEFT JOIN LATERAL (
        SELECT * FROM holder_snapshot WHERE token_id = t.id ORDER BY snapshot_date DESC LIMIT 1
      ) hs ON true
      ${whereClause}
      ORDER BY ${orderCol} ${orderDir} NULLS LAST
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...sqlParams, limit, offset]
    );

    res.json({
      data: result.rows,
      pagination: { page, limit },
      as_of: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
