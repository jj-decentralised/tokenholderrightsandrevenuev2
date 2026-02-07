import { v4 as uuid } from "uuid";
import { query, transaction } from "../../db/connection.js";
import { defillama } from "../providers/defillama.js";
import { coingecko } from "../providers/coingecko.js";

/**
 * DefiLlama category → our category_enum mapping.
 * DefiLlama uses mixed-case category names; we normalise to snake_case enum values.
 */
const CATEGORY_MAP: Record<string, string> = {
  dexes: "dex",
  dex: "dex",
  lending: "lending",
  cdp: "cdp",
  derivatives: "derivatives",
  "liquid staking": "liquid_staking",
  "liquid restaking": "liquid_restaking",
  yield: "yield",
  "yield aggregator": "yield_aggregator",
  bridge: "bridge",
  "dex aggregator": "dex_aggregator",
  options: "options",
  insurance: "insurance",
  synthetics: "synthetics",
  rwa: "rwa",
  "prediction market": "prediction_market",
  launchpad: "launchpad",
  chain: "chain",
  "nft marketplace": "nft_marketplace",
  payments: "payments",
  services: "services",
  "stablecoin issuer": "stablecoin_issuer",
  // Additional DeFiLlama-specific mappings
  "nft lending": "lending",
  "nft": "nft_marketplace",
  "leveraged farming": "yield",
  "algo-stables": "stablecoin_issuer",
  "reserve currency": "other",
  "cross chain": "bridge",
  "decentralized stablecoin": "stablecoin_issuer",
  "farm": "yield",
  "indexes": "yield_aggregator",
  "liquidity manager": "yield",
  "privacy": "other",
  "uncollateralized lending": "lending",
  "leveraged staking": "liquid_staking",
  "restaking": "liquid_restaking",
  "perpetuals": "derivatives",
  "gaming": "other",
  "oracle": "services",
};

const VALID_CATEGORIES = new Set([
  "dex", "lending", "cdp", "derivatives", "liquid_staking",
  "liquid_restaking", "yield", "yield_aggregator", "bridge",
  "dex_aggregator", "options", "insurance", "synthetics",
  "rwa", "prediction_market", "launchpad", "stablecoin_issuer",
  "chain", "nft_marketplace", "payments", "services", "other",
]);

function mapCategory(raw: string | undefined | null): string {
  if (!raw) return "other";
  const lower = raw.toLowerCase().trim();
  const mapped = CATEGORY_MAP[lower];
  if (mapped) return mapped;
  // Try direct match
  if (VALID_CATEGORIES.has(lower)) return lower;
  // Try snake_case conversion
  const snaked = lower.replace(/\s+/g, "_");
  if (VALID_CATEGORIES.has(snaked)) return snaked;
  return "other";
}

interface SyncStats {
  protocolsDiscovered: number;
  protocolsCreated: number;
  protocolsUpdated: number;
  tokensCreated: number;
  tokensLinked: number;
  duration: number;
}

/**
 * Sync the full protocol universe from DefiLlama + CoinGecko.
 *
 * Strategy:
 * 1. Fetch ALL protocols from DefiLlama /protocols (6000+ with metadata)
 * 2. Fetch fee overview from DefiLlama /overview/fees (protocols with fee data + 24h/7d/30d)
 * 3. Merge: every protocol from fees overview is high-priority; others get imported too
 * 4. Fetch CoinGecko /coins/list for token ↔ protocol cross-reference
 * 5. Bulk upsert protocols and tokens into the database
 */
export async function syncProtocolUniverse(): Promise<SyncStats> {
  const start = Date.now();
  const runId = `sync-universe-${Date.now()}`;
  console.log(`[SYNC] Starting protocol universe sync: ${runId}`);

  await query(
    `INSERT INTO ingestion_run (id, provider, job_type, status)
    VALUES ($1, 'defillama', 'sync_universe', 'running')`,
    [runId]
  );

  const stats: SyncStats = {
    protocolsDiscovered: 0,
    protocolsCreated: 0,
    protocolsUpdated: 0,
    tokensCreated: 0,
    tokensLinked: 0,
    duration: 0,
  };

  try {
    // ── Step 1: Fetch DefiLlama universe ──────────────────────────────
    console.log("[SYNC] Fetching DefiLlama protocol list...");
    const [allProtocols, feesOverview, revenueOverview, holdersRevOverview] = await Promise.all([
      defillama.getAllProtocols(),
      defillama.getFeesOverview(),
      defillama.getRevenueOverview().catch(() => [] as any[]),
      defillama.getHoldersRevenueOverview().catch(() => [] as any[]),
    ]);

    console.log(`[SYNC] DefiLlama: ${allProtocols.length} protocols, ${feesOverview.length} with fee data`);

    // Build lookup maps
    const feesBySlug = new Map(feesOverview.map((f) => [normalizeSlug(f.name), f]));
    const feesByName = new Map(feesOverview.map((f) => [f.name.toLowerCase(), f]));
    const revenueBySlug = new Map((revenueOverview || []).map((r: any) => [normalizeSlug(r.name), r]));
    const holdersRevBySlug = new Map((holdersRevOverview || []).map((r: any) => [normalizeSlug(r.name), r]));

    // ── Step 2: Fetch CoinGecko coin list for token mapping ──────────
    console.log("[SYNC] Fetching CoinGecko coins list...");
    let cgCoins: Array<{ id: string; symbol: string; name: string }> = [];
    try {
      cgCoins = await coingecko.getCoinsList(false);
      console.log(`[SYNC] CoinGecko: ${cgCoins.length} coins available`);
    } catch (err) {
      console.warn("[SYNC] CoinGecko coins list fetch failed, will use existing mappings:", (err as Error).message);
    }

    // Build CoinGecko lookup: by name (lowercase) and by symbol (lowercase)
    // name → id is more reliable than symbol since symbols can collide
    const cgByName = new Map<string, string>();
    const cgBySymbol = new Map<string, string[]>();
    for (const coin of cgCoins) {
      cgByName.set(coin.name.toLowerCase(), coin.id);
      const sym = coin.symbol.toLowerCase();
      if (!cgBySymbol.has(sym)) cgBySymbol.set(sym, []);
      cgBySymbol.get(sym)!.push(coin.id);
    }

    // ── Step 3: Merge into unified protocol list ─────────────────────
    // We want ALL protocols from DefiLlama that have fee data,
    // plus the ones from /protocols that have tokens (geckoId).
    interface UnifiedProtocol {
      name: string;
      slug: string;
      defillamaId: string;
      category: string;
      chains: string[];
      description?: string;
      url?: string;
      logo?: string;
      symbol?: string;
      geckoId?: string | null;
      parentProtocol?: string;
      hasFeeData: boolean;
      fees24h?: number | null;
      fees7d?: number | null;
      fees30d?: number | null;
      revenue24h?: number | null;
      holdersRevenue24h?: number | null;
    }

    const protocolMap = new Map<string, UnifiedProtocol>();

    // First: process all /protocols entries (metadata-rich)
    for (const p of allProtocols) {
      const slug = normalizeSlug(p.name);
      protocolMap.set(slug, {
        name: p.name,
        slug,
        defillamaId: p.slug || slug,
        category: p.category || "other",
        chains: p.chains || [],
        description: p.description,
        url: p.url,
        logo: p.logo,
        symbol: p.symbol,
        geckoId: p.geckoId,
        parentProtocol: p.parentProtocol,
        hasFeeData: false,
      });
    }

    // Then: overlay fee data from /overview/fees
    for (const f of feesOverview) {
      const slug = normalizeSlug(f.name);
      const existing = protocolMap.get(slug);
      const rev = revenueBySlug.get(slug);
      const hr = holdersRevBySlug.get(slug);

      if (existing) {
        existing.hasFeeData = true;
        existing.fees24h = f.total24h;
        existing.fees7d = f.total7d;
        existing.fees30d = f.total30d;
        existing.revenue24h = rev?.total24h ?? null;
        existing.holdersRevenue24h = hr?.total24h ?? null;
        if (f.category) existing.category = f.category;
        if (f.chains?.length) existing.chains = f.chains;
      } else {
        // Fee protocol not in /protocols list - still import
        protocolMap.set(slug, {
          name: f.name,
          slug,
          defillamaId: slug,
          category: f.category || "other",
          chains: f.chains || [],
          hasFeeData: true,
          fees24h: f.total24h,
          fees7d: f.total7d,
          fees30d: f.total30d,
          revenue24h: rev?.total24h ?? null,
          holdersRevenue24h: hr?.total24h ?? null,
        });
      }
    }

    stats.protocolsDiscovered = protocolMap.size;
    console.log(`[SYNC] Unified universe: ${stats.protocolsDiscovered} protocols (${feesOverview.length} with fee data)`);

    // ── Step 4: Prioritize and batch-upsert ──────────────────────────
    // Priority: protocols with fee data first, then by 24h fees descending
    const sorted = [...protocolMap.values()].sort((a, b) => {
      if (a.hasFeeData !== b.hasFeeData) return a.hasFeeData ? -1 : 1;
      return (b.fees24h || 0) - (a.fees24h || 0);
    });

    // Process in batches of 100 for transaction efficiency
    const BATCH_SIZE = 100;
    for (let i = 0; i < sorted.length; i += BATCH_SIZE) {
      const batch = sorted.slice(i, i + BATCH_SIZE);

      await transaction(async (client) => {
        for (const p of batch) {
          const category = mapCategory(p.category);

          // Try to resolve CoinGecko ID
          let coingeckoId = p.geckoId || null;
          if (!coingeckoId && p.symbol) {
            // Try name match first (more reliable)
            coingeckoId = cgByName.get(p.name.toLowerCase()) || null;
            // Fall back to symbol match (only if unambiguous)
            if (!coingeckoId) {
              const symbolMatches = cgBySymbol.get(p.symbol.toLowerCase());
              if (symbolMatches?.length === 1) {
                coingeckoId = symbolMatches[0];
              }
            }
          }

          // Upsert protocol
          const result = await client.query(
            `INSERT INTO protocol (id, name, slug, defillama_id, coingecko_id, description, website_url, logo_url, primary_category, tokenization_type, is_parent, has_fee_data, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active')
            ON CONFLICT (slug) DO UPDATE SET
              defillama_id = COALESCE(EXCLUDED.defillama_id, protocol.defillama_id),
              coingecko_id = COALESCE(EXCLUDED.coingecko_id, protocol.coingecko_id),
              description = COALESCE(EXCLUDED.description, protocol.description),
              website_url = COALESCE(EXCLUDED.website_url, protocol.website_url),
              logo_url = COALESCE(EXCLUDED.logo_url, protocol.logo_url),
              primary_category = EXCLUDED.primary_category,
              has_fee_data = EXCLUDED.has_fee_data OR protocol.has_fee_data,
              updated_at = NOW()
            RETURNING id, (xmax = 0) AS is_new`,
            [
              uuid(),
              p.name,
              p.slug,
              p.defillamaId,
              coingeckoId,
              p.description?.slice(0, 2000) || null,
              p.url || null,
              p.logo || null,
              category,
              p.symbol ? "tokenized" : "non_tokenized",
              !!p.parentProtocol,
              p.hasFeeData,
            ]
          );

          const row = result.rows[0];
          if (row.is_new) {
            stats.protocolsCreated++;
          } else {
            stats.protocolsUpdated++;
          }

          // Auto-create token if protocol has a symbol and CoinGecko ID
          if (p.symbol && coingeckoId) {
            const tokenResult = await client.query(
              `INSERT INTO token (id, symbol, name, protocol_id, coingecko_id, has_revenue_rights, revenue_mechanism_status)
              VALUES ($1, $2, $3, $4, $5, $6, 'none')
              ON CONFLICT DO NOTHING
              RETURNING id`,
              [
                uuid(),
                p.symbol.toUpperCase().slice(0, 20),
                p.name,
                row.id,
                coingeckoId,
                p.holdersRevenue24h ? (p.holdersRevenue24h > 0) : false,
              ]
            );
            if (tokenResult.rowCount && tokenResult.rowCount > 0) {
              stats.tokensCreated++;
            }
          }

          // Auto-create chain deployments
          if (p.chains?.length > 0) {
            for (const chain of p.chains.slice(0, 20)) {
              await client.query(
                `INSERT INTO chain_deployment (id, protocol_id, chain_id, chain_name, is_active)
                VALUES ($1, $2, $3, $4, true)
                ON CONFLICT DO NOTHING`,
                [uuid(), row.id, hashChainId(chain), chain]
              ).catch(() => {}); // ignore duplicates
            }
          }
        }
      });

      const pct = Math.min(100, Math.round(((i + batch.length) / sorted.length) * 100));
      console.log(`[SYNC] Progress: ${i + batch.length}/${sorted.length} protocols (${pct}%)`);
    }

    // ── Step 5: Link orphan tokens to protocols ──────────────────────
    // Some tokens may exist from CoinGecko market data but aren't linked to a protocol
    const orphanTokens = await query(
      `SELECT t.id, t.coingecko_id, t.name
      FROM token t
      WHERE t.protocol_id IS NULL AND t.coingecko_id IS NOT NULL`
    );

    if (orphanTokens.rows.length > 0) {
      console.log(`[SYNC] Linking ${orphanTokens.rows.length} orphan tokens to protocols...`);
      for (const token of orphanTokens.rows) {
        const result = await query(
          `UPDATE token SET protocol_id = (
            SELECT id FROM protocol WHERE coingecko_id = $1 LIMIT 1
          ) WHERE id = $2 AND protocol_id IS NULL`,
          [token.coingecko_id, token.id]
        );
        if (result.rowCount && result.rowCount > 0) stats.tokensLinked++;
      }
    }

    stats.duration = Math.round((Date.now() - start) / 1000);

    await query(
      `UPDATE ingestion_run SET status = 'completed', completed_at = NOW(),
        records_processed = $2, records_failed = 0
      WHERE id = $1`,
      [runId, stats.protocolsCreated + stats.protocolsUpdated]
    );

    console.log(`[SYNC] Universe sync complete in ${stats.duration}s:`);
    console.log(`  Discovered: ${stats.protocolsDiscovered}`);
    console.log(`  Created:    ${stats.protocolsCreated}`);
    console.log(`  Updated:    ${stats.protocolsUpdated}`);
    console.log(`  Tokens:     ${stats.tokensCreated} new, ${stats.tokensLinked} linked`);

    return stats;
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

/**
 * Sync ONLY protocols that have fee/revenue data (the most useful subset).
 * Faster than full universe sync — good for daily runs.
 */
export async function syncFeeProtocols(): Promise<SyncStats> {
  const start = Date.now();
  const runId = `sync-fees-${Date.now()}`;
  console.log(`[SYNC] Starting fee-protocol sync: ${runId}`);

  await query(
    `INSERT INTO ingestion_run (id, provider, job_type, status)
    VALUES ($1, 'defillama', 'sync_fee_protocols', 'running')`,
    [runId]
  );

  const stats: SyncStats = {
    protocolsDiscovered: 0,
    protocolsCreated: 0,
    protocolsUpdated: 0,
    tokensCreated: 0,
    tokensLinked: 0,
    duration: 0,
  };

  try {
    const [feesOverview, revenueOverview, holdersRevOverview] = await Promise.all([
      defillama.getFeesOverview(),
      defillama.getRevenueOverview().catch(() => [] as any[]),
      defillama.getHoldersRevenueOverview().catch(() => [] as any[]),
    ]);

    console.log(`[SYNC] Fee protocols: ${feesOverview.length}`);
    stats.protocolsDiscovered = feesOverview.length;

    const revenueMap = new Map((revenueOverview || []).map((r: any) => [r.name?.toLowerCase(), r]));
    const holdersMap = new Map((holdersRevOverview || []).map((r: any) => [r.name?.toLowerCase(), r]));

    // Get existing CoinGecko mappings from the protocol table
    let cgCoins: Array<{ id: string; symbol: string; name: string }> = [];
    try {
      cgCoins = await coingecko.getCoinsList(false);
    } catch { /* noop */ }
    const cgByName = new Map(cgCoins.map((c) => [c.name.toLowerCase(), c.id]));

    const BATCH_SIZE = 100;
    const protocols = feesOverview.sort((a, b) => (b.total24h || 0) - (a.total24h || 0));

    for (let i = 0; i < protocols.length; i += BATCH_SIZE) {
      const batch = protocols.slice(i, i + BATCH_SIZE);

      await transaction(async (client) => {
        for (const f of batch) {
          const slug = normalizeSlug(f.name);
          const category = mapCategory(f.category);
          const rev = revenueMap.get(f.name?.toLowerCase());
          const hr = holdersMap.get(f.name?.toLowerCase());
          const coingeckoId = cgByName.get(f.name.toLowerCase()) || null;

          const result = await client.query(
            `INSERT INTO protocol (id, name, slug, defillama_id, coingecko_id, primary_category, tokenization_type, has_fee_data, status)
            VALUES ($1, $2, $3, $4, $5, $6, 'non_tokenized', true, 'active')
            ON CONFLICT (slug) DO UPDATE SET
              defillama_id = COALESCE(EXCLUDED.defillama_id, protocol.defillama_id),
              coingecko_id = COALESCE(EXCLUDED.coingecko_id, protocol.coingecko_id),
              primary_category = EXCLUDED.primary_category,
              has_fee_data = true,
              updated_at = NOW()
            RETURNING id, (xmax = 0) AS is_new`,
            [uuid(), f.name, slug, slug, coingeckoId, category]
          );

          const row = result.rows[0];
          if (row.is_new) stats.protocolsCreated++;
          else stats.protocolsUpdated++;

          // Auto-create token from CoinGecko mapping
          if (coingeckoId) {
            const tokenResult = await client.query(
              `INSERT INTO token (id, symbol, name, protocol_id, coingecko_id, has_revenue_rights, revenue_mechanism_status)
              VALUES ($1, $2, $3, $4, $5, $6, 'none')
              ON CONFLICT DO NOTHING
              RETURNING id`,
              [
                uuid(),
                f.name.slice(0, 20).toUpperCase(),
                f.name,
                row.id,
                coingeckoId,
                (hr?.total24h || 0) > 0,
              ]
            );
            if (tokenResult.rowCount && tokenResult.rowCount > 0) {
              stats.tokensCreated++;
            }
          }

          // Store chain deployments
          if (f.chains?.length > 0) {
            for (const chain of f.chains.slice(0, 20)) {
              await client.query(
                `INSERT INTO chain_deployment (id, protocol_id, chain_id, chain_name, is_active)
                VALUES ($1, $2, $3, $4, true)
                ON CONFLICT DO NOTHING`,
                [uuid(), row.id, hashChainId(chain), chain]
              ).catch(() => {});
            }
          }
        }
      });

      const pct = Math.min(100, Math.round(((i + batch.length) / protocols.length) * 100));
      console.log(`[SYNC] Progress: ${i + batch.length}/${protocols.length} (${pct}%)`);
    }

    stats.duration = Math.round((Date.now() - start) / 1000);

    await query(
      `UPDATE ingestion_run SET status = 'completed', completed_at = NOW(),
        records_processed = $2
      WHERE id = $1`,
      [runId, stats.protocolsCreated + stats.protocolsUpdated]
    );

    console.log(`[SYNC] Fee-protocol sync complete in ${stats.duration}s: ${stats.protocolsCreated} new, ${stats.protocolsUpdated} updated`);
    return stats;
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

/**
 * Sync the CoinGecko token universe: creates token records for the top N coins
 * by market cap that aren't already in our database.
 */
export async function syncTokenUniverse(maxPages = 20): Promise<{ created: number; linked: number }> {
  console.log(`[SYNC] Syncing CoinGecko token universe (top ${maxPages * 250} by market cap)...`);
  let created = 0;
  let linked = 0;

  // Get all existing CoinGecko IDs
  const existing = await query(`SELECT coingecko_id FROM token WHERE coingecko_id IS NOT NULL`);
  const existingIds = new Set(existing.rows.map((r: any) => r.coingecko_id));

  // Fetch markets page by page to get price + market data alongside
  for (let page = 1; page <= maxPages; page++) {
    const markets = await coingecko.getMarkets(page, 250, false);
    if (markets.length === 0) break;

    await transaction(async (client) => {
      for (const coin of markets) {
        if (existingIds.has(coin.id)) continue;

        // Check if a protocol exists for this token
        const protocolResult = await client.query(
          `SELECT id FROM protocol WHERE coingecko_id = $1 LIMIT 1`,
          [coin.id]
        );
        const protocolId = protocolResult.rows[0]?.id || null;

        await client.query(
          `INSERT INTO token (id, symbol, name, protocol_id, coingecko_id, has_revenue_rights, revenue_mechanism_status)
          VALUES ($1, $2, $3, $4, $5, false, 'none')
          ON CONFLICT DO NOTHING`,
          [
            uuid(),
            coin.symbol.toUpperCase().slice(0, 20),
            coin.name.slice(0, 255),
            protocolId,
            coin.id,
          ]
        );
        created++;
        if (protocolId) linked++;
        existingIds.add(coin.id);
      }
    });

    console.log(`  Page ${page}: ${markets.length} markets, ${created} new tokens`);
    if (markets.length < 250) break;
  }

  console.log(`[SYNC] Token universe sync: ${created} created, ${linked} linked to protocols`);
  return { created, linked };
}

// ── Helpers ────────────────────────────────────────────────────────────

function normalizeSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function hashChainId(chainName: string): number {
  let hash = 0;
  for (let i = 0; i < chainName.length; i++) {
    hash = ((hash << 5) - hash + chainName.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}
