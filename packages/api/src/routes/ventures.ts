import { Router } from "express";
import { query } from "../db/connection.js";
import { validate } from "../middleware/validate.js";
import { protocolQuerySchema } from "../lib/validation.js";
import { getDateRangeFromTimeRange } from "../lib/time.js";
import { AppError } from "../middleware/error-handler.js";
import type { TimeRange } from "../types/index.js";

const router = Router();

// GET /ventures/:ventureId/summary
router.get("/:ventureId/summary", validate(protocolQuerySchema), async (req, res, next) => {
  try {
    const { ventureId } = req.params;
    const range = (req.query as { range: TimeRange }).range;
    const { start, end } = getDateRangeFromTimeRange(range);

    const protocol = await query(
      `SELECT * FROM protocol WHERE id = $1 OR slug = $1`,
      [ventureId]
    );
    if (protocol.rows.length === 0) {
      throw new AppError(404, "Protocol not found");
    }
    const p = protocol.rows[0];

    const [subProducts, token, revenueAgg, latestMarket, latestMetrics, rights] =
      await Promise.all([
        query(`SELECT * FROM sub_product WHERE protocol_id = $1 ORDER BY name`, [p.id]),
        query(
          `SELECT * FROM token WHERE protocol_id = $1 ORDER BY has_revenue_rights DESC LIMIT 1`,
          [p.id]
        ),
        query(
          `SELECT
            COALESCE(SUM(daily_fees_usd), 0) as total_fees,
            COALESCE(SUM(daily_revenue_usd), 0) as total_revenue,
            COALESCE(SUM(daily_holders_revenue_usd), 0) as total_holder_revenue,
            COALESCE(SUM(daily_supply_side_usd), 0) as total_supply_side,
            COALESCE(SUM(daily_earnings_usd), 0) as total_earnings
          FROM revenue_daily
          WHERE protocol_id = $1 AND date >= $2 AND date <= $3`,
          [p.id, start, end]
        ),
        query(
          `SELECT * FROM token_market_daily
          WHERE token_id = (SELECT id FROM token WHERE protocol_id = $1 LIMIT 1)
          ORDER BY date DESC LIMIT 1`,
          [p.id]
        ),
        query(
          `SELECT * FROM computed_metrics WHERE protocol_id = $1 ORDER BY date DESC LIMIT 1`,
          [p.id]
        ),
        query(
          `SELECT tr.* FROM token_rights tr
          JOIN token t ON t.id = tr.token_id
          WHERE t.protocol_id = $1 AND tr.is_active = true`,
          [p.id]
        ),
      ]);

    res.json({
      protocol: p,
      sub_products: subProducts.rows,
      token: token.rows[0] || null,
      revenue_summary: revenueAgg.rows[0],
      latest_market: latestMarket.rows[0] || null,
      latest_metrics: latestMetrics.rows[0] || null,
      rights: rights.rows,
      range,
      as_of: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /ventures/:ventureId/products
router.get("/:ventureId/products", validate(protocolQuerySchema), async (req, res, next) => {
  try {
    const { ventureId } = req.params;
    const range = (req.query as { range: TimeRange }).range;
    const { start, end } = getDateRangeFromTimeRange(range);

    const protocol = await query(
      `SELECT id FROM protocol WHERE id = $1 OR slug = $1`,
      [ventureId]
    );
    if (protocol.rows.length === 0) {
      throw new AppError(404, "Protocol not found");
    }
    const protocolId = protocol.rows[0].id;

    const products = await query(
      `SELECT
        sp.id, sp.name, sp.defillama_slug, sp.category, sp.chain, sp.version, sp.status,
        COALESCE(SUM(r.daily_fees_usd), 0) as total_fees,
        COALESCE(SUM(r.daily_revenue_usd), 0) as total_revenue,
        COALESCE(SUM(r.daily_holders_revenue_usd), 0) as total_holder_revenue
      FROM sub_product sp
      LEFT JOIN revenue_daily r ON r.product_breakdown ? sp.defillama_slug
        AND r.protocol_id = $1 AND r.date >= $2 AND r.date <= $3
      WHERE sp.protocol_id = $1
      GROUP BY sp.id, sp.name, sp.defillama_slug, sp.category, sp.chain, sp.version, sp.status
      ORDER BY total_revenue DESC`,
      [protocolId, start, end]
    );

    res.json({
      protocol_id: protocolId,
      products: products.rows,
      range,
      as_of: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /ventures/:ventureId/revenue-history
router.get("/:ventureId/revenue-history", validate(protocolQuerySchema), async (req, res, next) => {
  try {
    const { ventureId } = req.params;
    const range = (req.query as { range: TimeRange }).range;
    const { start, end } = getDateRangeFromTimeRange(range);

    const protocol = await query(
      `SELECT id FROM protocol WHERE id = $1 OR slug = $1`,
      [ventureId]
    );
    if (protocol.rows.length === 0) {
      throw new AppError(404, "Protocol not found");
    }

    const history = await query(
      `SELECT date, daily_fees_usd, daily_revenue_usd, daily_holders_revenue_usd,
              daily_supply_side_usd, daily_protocol_revenue_usd, daily_earnings_usd,
              chain_breakdown, product_breakdown
      FROM revenue_daily
      WHERE protocol_id = $1 AND date >= $2 AND date <= $3
      ORDER BY date ASC`,
      [protocol.rows[0].id, start, end]
    );

    res.json({
      protocol_id: protocol.rows[0].id,
      history: history.rows,
      range,
      as_of: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
