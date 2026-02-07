import { v4 as uuid } from "uuid";
import { query, transaction } from "../connection.js";

interface ProtocolSeed {
  name: string;
  slug: string;
  defillama_id: string;
  coingecko_id: string | null;
  category: string;
  tokenization_type: string;
  token?: {
    symbol: string;
    name: string;
    coingecko_id: string;
    has_revenue_rights: boolean;
    mechanism_status: string;
    rights?: Array<{
      type: string;
      description: string;
      percentage: number;
      since: string;
    }>;
  };
  sub_products?: Array<{
    name: string;
    slug: string;
    category: string;
  }>;
}

const PROTOCOLS: ProtocolSeed[] = [
  {
    name: "dYdX",
    slug: "dydx",
    defillama_id: "dydx",
    coingecko_id: "dydx-chain",
    category: "derivatives",
    tokenization_type: "tokenized",
    token: {
      symbol: "DYDX",
      name: "dYdX",
      coingecko_id: "dydx-chain",
      has_revenue_rights: true,
      mechanism_status: "active",
      rights: [
        { type: "fee_sharing", description: "100% of trading fees distributed to DYDX stakers", percentage: 100, since: "2023-10-26" },
      ],
    },
  },
  {
    name: "Hyperliquid",
    slug: "hyperliquid",
    defillama_id: "hyperliquid",
    coingecko_id: "hyperliquid",
    category: "derivatives",
    tokenization_type: "tokenized",
    token: {
      symbol: "HYPE",
      name: "Hyperliquid",
      coingecko_id: "hyperliquid",
      has_revenue_rights: true,
      mechanism_status: "active",
      rights: [
        { type: "buyback_burn", description: "Revenue-funded buyback via assistance fund", percentage: 50, since: "2024-11-29" },
      ],
    },
    sub_products: [
      { name: "Hyperliquid Perps", slug: "hyperliquid", category: "derivatives" },
      { name: "Hyperliquid Spot", slug: "hyperliquid-spot-orderbook", category: "dex" },
    ],
  },
  {
    name: "GMX",
    slug: "gmx",
    defillama_id: "gmx",
    coingecko_id: "gmx",
    category: "derivatives",
    tokenization_type: "tokenized",
    token: {
      symbol: "GMX",
      name: "GMX",
      coingecko_id: "gmx",
      has_revenue_rights: true,
      mechanism_status: "active",
      rights: [
        { type: "fee_sharing", description: "30% of fees distributed as ETH/AVAX to GMX stakers", percentage: 30, since: "2021-09-06" },
      ],
    },
  },
  {
    name: "Curve Finance",
    slug: "curve",
    defillama_id: "curve-finance",
    coingecko_id: "curve-dao-token",
    category: "dex",
    tokenization_type: "tokenized",
    token: {
      symbol: "CRV",
      name: "Curve DAO Token",
      coingecko_id: "curve-dao-token",
      has_revenue_rights: true,
      mechanism_status: "active",
      rights: [
        { type: "ve_model", description: "50% admin fees to veCRV holders", percentage: 50, since: "2020-09-01" },
      ],
    },
    sub_products: [
      { name: "Curve DEX", slug: "curve-finance", category: "dex" },
      { name: "crvUSD", slug: "crvusd", category: "cdp" },
    ],
  },
  {
    name: "Synthetix",
    slug: "synthetix",
    defillama_id: "synthetix",
    coingecko_id: "havven",
    category: "derivatives",
    tokenization_type: "tokenized",
    token: {
      symbol: "SNX",
      name: "Synthetix Network Token",
      coingecko_id: "havven",
      has_revenue_rights: true,
      mechanism_status: "active",
      rights: [
        { type: "fee_sharing", description: "sUSD fees from all frontend integrators to SNX stakers", percentage: 60, since: "2020-03-01" },
      ],
    },
  },
  {
    name: "Aave",
    slug: "aave",
    defillama_id: "aave",
    coingecko_id: "aave",
    category: "lending",
    tokenization_type: "tokenized",
    token: {
      symbol: "AAVE",
      name: "Aave",
      coingecko_id: "aave",
      has_revenue_rights: true,
      mechanism_status: "active",
      rights: [
        { type: "buyback_burn", description: "$1M/week buyback since April 2025", percentage: 7, since: "2025-04-01" },
      ],
    },
    sub_products: [
      { name: "Aave V2", slug: "aave-v2", category: "lending" },
      { name: "Aave V3", slug: "aave-v3", category: "lending" },
      { name: "GHO", slug: "gho", category: "stablecoin_issuer" },
    ],
  },
  {
    name: "Pendle",
    slug: "pendle",
    defillama_id: "pendle",
    coingecko_id: "pendle",
    category: "yield",
    tokenization_type: "tokenized",
    token: {
      symbol: "PENDLE",
      name: "Pendle",
      coingecko_id: "pendle",
      has_revenue_rights: true,
      mechanism_status: "active",
      rights: [
        { type: "ve_model", description: "80% of swap fees to vePENDLE holders", percentage: 80, since: "2023-05-01" },
      ],
    },
  },
  {
    name: "MakerDAO",
    slug: "makerdao",
    defillama_id: "makerdao",
    coingecko_id: "maker",
    category: "cdp",
    tokenization_type: "tokenized",
    token: {
      symbol: "MKR",
      name: "Maker",
      coingecko_id: "maker",
      has_revenue_rights: true,
      mechanism_status: "active",
      rights: [
        { type: "buyback_burn", description: "Surplus revenue used for MKR burn", percentage: 35, since: "2020-01-01" },
      ],
    },
    sub_products: [
      { name: "Maker Vaults", slug: "makerdao", category: "cdp" },
      { name: "Spark Protocol", slug: "spark", category: "lending" },
    ],
  },
  {
    name: "Jupiter",
    slug: "jupiter",
    defillama_id: "jupiter",
    coingecko_id: "jupiter-exchange-solana",
    category: "dex",
    tokenization_type: "tokenized",
    token: {
      symbol: "JUP",
      name: "Jupiter",
      coingecko_id: "jupiter-exchange-solana",
      has_revenue_rights: true,
      mechanism_status: "active",
      rights: [
        { type: "buyback_burn", description: "50% of protocol revenue for buyback-and-lock", percentage: 12.5, since: "2024-06-01" },
      ],
    },
    sub_products: [
      { name: "Jupiter Spot", slug: "jupiter", category: "dex" },
      { name: "Jupiter Perps", slug: "jupiter-perpetual", category: "derivatives" },
      { name: "Jupiter DCA", slug: "jupiter-dca", category: "dex" },
      { name: "Jupiter Lending", slug: "jupiter-lending", category: "lending" },
    ],
  },
  {
    name: "Raydium",
    slug: "raydium",
    defillama_id: "raydium",
    coingecko_id: "raydium",
    category: "dex",
    tokenization_type: "tokenized",
    token: {
      symbol: "RAY",
      name: "Raydium",
      coingecko_id: "raydium",
      has_revenue_rights: true,
      mechanism_status: "active",
      rights: [
        { type: "buyback_burn", description: "Longest running buyback-and-burn on Solana", percentage: 12, since: "2021-03-01" },
      ],
    },
  },
  {
    name: "Uniswap",
    slug: "uniswap",
    defillama_id: "uniswap",
    coingecko_id: "uniswap",
    category: "dex",
    tokenization_type: "tokenized",
    token: {
      symbol: "UNI",
      name: "Uniswap",
      coingecko_id: "uniswap",
      has_revenue_rights: true,
      mechanism_status: "active",
      rights: [
        { type: "buyback_burn", description: "Fee switch burn via Firepit contract (activated Dec 2025)", percentage: 2, since: "2025-12-01" },
      ],
    },
    sub_products: [
      { name: "Uniswap V2", slug: "uniswap-v2", category: "dex" },
      { name: "Uniswap V3", slug: "uniswap-v3", category: "dex" },
      { name: "Uniswap V4", slug: "uniswap-v4", category: "dex" },
    ],
  },
  {
    name: "Lido",
    slug: "lido",
    defillama_id: "lido",
    coingecko_id: "lido-dao",
    category: "liquid_staking",
    tokenization_type: "tokenized",
    token: {
      symbol: "LDO",
      name: "Lido DAO",
      coingecko_id: "lido-dao",
      has_revenue_rights: false,
      mechanism_status: "none",
    },
  },
  {
    name: "Ethena",
    slug: "ethena",
    defillama_id: "ethena",
    coingecko_id: "ethena",
    category: "synthetics",
    tokenization_type: "tokenized",
    token: {
      symbol: "ENA",
      name: "Ethena",
      coingecko_id: "ethena",
      has_revenue_rights: false,
      mechanism_status: "proposed",
    },
  },
  {
    name: "Frax Finance",
    slug: "frax",
    defillama_id: "frax-finance",
    coingecko_id: "frax-share",
    category: "stablecoin_issuer",
    tokenization_type: "tokenized",
    token: {
      symbol: "FXS",
      name: "Frax Share",
      coingecko_id: "frax-share",
      has_revenue_rights: true,
      mechanism_status: "active",
      rights: [
        { type: "ve_model", description: "veFXS fee sharing from protocol products", percentage: 17, since: "2021-09-01" },
      ],
    },
    sub_products: [
      { name: "FRAX Stablecoin", slug: "frax-finance", category: "stablecoin_issuer" },
      { name: "frxETH", slug: "frax-ether", category: "liquid_staking" },
      { name: "Fraxlend", slug: "fraxlend", category: "lending" },
    ],
  },
  {
    name: "Jito",
    slug: "jito",
    defillama_id: "jito",
    coingecko_id: "jito-governance-token",
    category: "liquid_staking",
    tokenization_type: "tokenized",
    token: {
      symbol: "JTO",
      name: "Jito",
      coingecko_id: "jito-governance-token",
      has_revenue_rights: true,
      mechanism_status: "active",
      rights: [
        { type: "buyback_burn", description: "First $1M buyback executed Sept 2025", percentage: 4, since: "2025-09-01" },
      ],
    },
  },
];

export async function seed(): Promise<void> {
  console.log("Seeding initial protocols...");

  for (const p of PROTOCOLS) {
    await transaction(async (client) => {
      const protocolId = uuid();

      await client.query(
        `INSERT INTO protocol (id, name, slug, defillama_id, coingecko_id, primary_category, tokenization_type, is_parent)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (slug) DO UPDATE SET
          defillama_id = EXCLUDED.defillama_id,
          coingecko_id = EXCLUDED.coingecko_id,
          primary_category = EXCLUDED.primary_category,
          tokenization_type = EXCLUDED.tokenization_type`,
        [
          protocolId, p.name, p.slug, p.defillama_id, p.coingecko_id,
          p.category, p.tokenization_type,
          (p.sub_products?.length ?? 0) > 0,
        ]
      );

      // Get actual protocol ID (in case it already existed)
      const existing = await client.query(`SELECT id FROM protocol WHERE slug = $1`, [p.slug]);
      const actualId = existing.rows[0].id;

      // Seed token
      if (p.token) {
        const tokenId = uuid();
        await client.query(
          `INSERT INTO token (id, symbol, name, protocol_id, coingecko_id, has_revenue_rights, revenue_mechanism_status)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT DO NOTHING`,
          [tokenId, p.token.symbol, p.token.name, actualId, p.token.coingecko_id, p.token.has_revenue_rights, p.token.mechanism_status]
        );

        const existingToken = await client.query(
          `SELECT id FROM token WHERE protocol_id = $1 AND symbol = $2`,
          [actualId, p.token.symbol]
        );
        const actualTokenId = existingToken.rows[0]?.id || tokenId;

        // Seed rights
        if (p.token.rights) {
          for (const r of p.token.rights) {
            await client.query(
              `INSERT INTO token_rights (id, token_id, right_type, mechanism_description, percentage_allocation, activation_date, is_active)
              VALUES ($1, $2, $3, $4, $5, $6, true)
              ON CONFLICT DO NOTHING`,
              [uuid(), actualTokenId, r.type, r.description, r.percentage, r.since]
            );
          }
        }
      }

      // Seed sub-products
      if (p.sub_products) {
        for (const sp of p.sub_products) {
          await client.query(
            `INSERT INTO sub_product (id, protocol_id, name, defillama_slug, category)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT DO NOTHING`,
            [uuid(), actualId, sp.name, sp.slug, sp.category]
          );
        }
      }

      console.log(`  Seeded: ${p.name}`);
    });
  }

  console.log(`Seeded ${PROTOCOLS.length} protocols`);
}

// Run directly
seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
