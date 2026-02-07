import { Router } from "express";
import { query } from "../db/connection.js";
import { validate } from "../middleware/validate.js";
import { holderQuerySchema } from "../lib/validation.js";
import { getDateRangeFromTimeRange } from "../lib/time.js";
import { AppError } from "../middleware/error-handler.js";
import type { TimeRange } from "../types/index.js";

const router = Router();

// GET /tokens/:tokenId/holders
router.get("/:tokenId/holders", validate(holderQuerySchema), async (req, res, next) => {
  try {
    const { tokenId } = req.params;
    const range = (req.query as { range: TimeRange }).range;
    const { start, end } = getDateRangeFromTimeRange(range);

    const token = await query(
      `SELECT t.*, p.name as protocol_name, p.slug as protocol_slug
      FROM token t
      LEFT JOIN protocol p ON p.id = t.protocol_id
      WHERE t.id = $1 OR t.coingecko_id = $1`,
      [tokenId]
    );
    if (token.rows.length === 0) {
      throw new AppError(404, "Token not found");
    }
    const t = token.rows[0];

    const [history, latestSnapshot, topHolders] = await Promise.all([
      query(
        `SELECT hs.snapshot_date, hs.total_holders, hs.top10_pct, hs.top50_pct,
                hs.top100_pct, hs.gini_coefficient, hs.new_holders_24h
        FROM holder_snapshot hs
        WHERE hs.token_id = $1 AND hs.snapshot_date >= $2 AND hs.snapshot_date <= $3
        ORDER BY hs.snapshot_date ASC`,
        [t.id, start, end]
      ),
      query(
        `SELECT * FROM holder_snapshot
        WHERE token_id = $1
        ORDER BY snapshot_date DESC LIMIT 1`,
        [t.id]
      ),
      query(
        `SELECT hd.wallet_address, hd.balance, hd.balance_usd, hd.pct_of_supply,
                hd.first_held_date, hd.wallet_label, hd.rank
        FROM holder_detail hd
        JOIN holder_snapshot hs ON hs.id = hd.holder_snapshot_id
        WHERE hs.token_id = $1
          AND hs.snapshot_date = (SELECT MAX(snapshot_date) FROM holder_snapshot WHERE token_id = $1)
        ORDER BY hd.rank ASC
        LIMIT 100`,
        [t.id]
      ),
    ]);

    const latest = latestSnapshot.rows[0];
    let holderGrowth7d = null;
    let holderGrowth30d = null;

    if (history.rows.length > 1) {
      const current = latest?.total_holders || 0;
      const rows = history.rows;
      const d7 = rows.find(
        (r: any) => new Date(r.snapshot_date) <= new Date(Date.now() - 7 * 86400000)
      );
      const d30 = rows.find(
        (r: any) => new Date(r.snapshot_date) <= new Date(Date.now() - 30 * 86400000)
      );
      if (d7 && d7.total_holders > 0) {
        holderGrowth7d = ((current - d7.total_holders) / d7.total_holders) * 100;
      }
      if (d30 && d30.total_holders > 0) {
        holderGrowth30d = ((current - d30.total_holders) / d30.total_holders) * 100;
      }
    }

    res.json({
      token_id: t.id,
      symbol: t.symbol,
      protocol_name: t.protocol_name,
      total_holders: latest?.total_holders || 0,
      holder_growth_7d: holderGrowth7d,
      holder_growth_30d: holderGrowth30d,
      top10_concentration: latest?.top10_pct || null,
      gini_coefficient: latest?.gini_coefficient || null,
      history: history.rows,
      top_holders: topHolders.rows,
      range,
      as_of: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
