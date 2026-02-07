import { Router } from "express";
import { query } from "../db/connection.js";
import { AppError } from "../middleware/error-handler.js";

const router = Router();

// GET /rights/:tokenId
router.get("/:tokenId", async (req, res, next) => {
  try {
    const { tokenId } = req.params;

    const token = await query(
      `SELECT t.*, p.name as protocol_name
      FROM token t
      LEFT JOIN protocol p ON p.id = t.protocol_id
      WHERE t.id = $1 OR t.coingecko_id = $1`,
      [tokenId]
    );
    if (token.rows.length === 0) {
      throw new AppError(404, "Token not found");
    }
    const t = token.rows[0];

    const [rights, attributions, buybacks] = await Promise.all([
      query(
        `SELECT * FROM token_rights WHERE token_id = $1 ORDER BY is_active DESC, activation_date DESC`,
        [t.id]
      ),
      query(
        `SELECT ra.*, rs.source_type, rs.description as source_description
        FROM revenue_attribution ra
        JOIN revenue_source rs ON rs.id = ra.revenue_source_id
        WHERE rs.protocol_id = $1
        ORDER BY ra.effective_date DESC`,
        [t.protocol_id]
      ),
      query(
        `SELECT * FROM buyback_event
        WHERE token_id = $1
        ORDER BY event_date DESC
        LIMIT 50`,
        [t.id]
      ),
    ]);

    res.json({
      token_id: t.id,
      symbol: t.symbol,
      protocol_name: t.protocol_name,
      has_revenue_rights: t.has_revenue_rights,
      revenue_mechanism_status: t.revenue_mechanism_status,
      productive_token_score: t.productive_token_score,
      rights: rights.rows,
      revenue_attributions: attributions.rows,
      buyback_history: buybacks.rows,
      as_of: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
