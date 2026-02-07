import { Router } from "express";
import { query } from "../db/connection.js";
import { validate } from "../middleware/validate.js";
import { revenueAtlasSchema } from "../lib/validation.js";
import { getDateRangeFromTimeRange } from "../lib/time.js";

const router = Router();

router.get("/atlas", validate(revenueAtlasSchema), async (req, res, next) => {
  try {
    const { range, category, chain, tokenized, min_revenue, page, limit, sort_by, sort_dir } =
      req.query as any;
    const { start, end } = getDateRangeFromTimeRange(range);
    const offset = (page - 1) * limit;

    const conditions: string[] = ["r.date >= $1", "r.date <= $2", "p.status = 'active'"];
    const params: unknown[] = [start, end];
    let paramIdx = 3;

    if (category) {
      conditions.push(`p.primary_category = $${paramIdx}`);
      params.push(category);
      paramIdx++;
    }
    if (tokenized !== undefined) {
      if (tokenized) {
        conditions.push(`p.tokenization_type = 'tokenized'`);
      } else {
        conditions.push(`p.tokenization_type = 'non_tokenized'`);
      }
    }
    if (min_revenue) {
      conditions.push(`SUM(r.daily_revenue_usd) >= $${paramIdx}`);
      params.push(min_revenue);
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const validSorts: Record<string, string> = {
      fees: "total_fees",
      revenue: "total_revenue",
      holder_revenue: "total_holder_revenue",
      name: "p.name",
    };
    const orderCol = validSorts[sort_by] || "total_revenue";
    const orderDir = sort_dir === "asc" ? "ASC" : "DESC";

    const result = await query(
      `SELECT
        p.id as protocol_id, p.name, p.slug, p.primary_category as category,
        COALESCE(SUM(r.daily_fees_usd), 0) as total_fees,
        COALESCE(SUM(r.daily_revenue_usd), 0) as total_revenue,
        COALESCE(SUM(r.daily_holders_revenue_usd), 0) as total_holder_revenue,
        CASE WHEN SUM(r.daily_fees_usd) > 0
          THEN ROUND(SUM(r.daily_holders_revenue_usd) / SUM(r.daily_fees_usd) * 100, 2)
          ELSE 0
        END as holder_revenue_pct
      FROM revenue_daily r
      JOIN protocol p ON p.id = r.protocol_id
      ${whereClause}
      GROUP BY p.id, p.name, p.slug, p.primary_category
      ${min_revenue ? "" : ""}
      ORDER BY ${orderCol} ${orderDir}
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(DISTINCT p.id) as total
      FROM revenue_daily r
      JOIN protocol p ON p.id = r.protocol_id
      ${whereClause}`,
      params
    );

    res.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        total: Number(countResult.rows[0].total),
        total_pages: Math.ceil(Number(countResult.rows[0].total) / limit),
      },
      range,
      as_of: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
