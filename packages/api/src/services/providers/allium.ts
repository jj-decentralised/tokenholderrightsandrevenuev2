import { config } from "../../lib/config.js";
import { getLimiter, withRetry } from "../../lib/rate-limiter.js";

// Allium enforces 1 req/sec — configure Bottleneck accordingly
const limiter = getLimiter("allium", config.providers.allium.rateLimit);

// ---- Types ----

export interface AlliumPriceResult {
  chain: string;
  address: string;
  price: number;
  decimals: number;
  info: { name: string; symbol: string };
  attributes: {
    price_diff_1d: number;
    price_diff_pct_1d: number;
    volume_usd_1d: number;
  };
}

export interface AlliumOHLCV {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  price: number;
}

export interface AlliumPriceHistory {
  items: Array<{
    mint: string;
    chain: string;
    prices: AlliumOHLCV[];
  }>;
}

export interface AlliumTokenAddress {
  token_address: string;
  chain: string;
}

export interface AlliumWalletBalance {
  chain: string;
  address: string;
  token_address: string;
  token_name: string;
  token_symbol: string;
  balance: string;
  balance_usd: number;
  price_usd: number;
  decimals: number;
}

export interface AlliumTransaction {
  hash: string;
  block_number: number;
  timestamp: string;
  from_address: string;
  to_address: string;
  value: string;
  gas_used: number;
  gas_price: string;
  status: string;
}

export interface AlliumPnL {
  chain: string;
  address: string;
  token_address: string;
  token_symbol: string;
  realized_pnl: number;
  unrealized_pnl: number;
  total_bought_usd: number;
  total_sold_usd: number;
  current_balance_usd: number;
}

export interface AlliumQueryRun {
  run_id: string;
}

export interface AlliumQueryStatus {
  run_id: string;
  status: "created" | "queued" | "running" | "success" | "failed";
  error_message?: string;
}

export type AlliumTimeGranularity = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";

export type AlliumSupportedChains = Record<string, string[]>;

// ---- Internal request helpers ----

const BASE_URL = config.providers.allium.baseUrl;
const API_KEY = config.providers.allium.apiKey;

async function alliumGet<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "GET",
    headers: {
      "X-API-KEY": API_KEY,
    },
  });
  if (!response.ok) {
    throw new Error(`Allium GET ${path} failed ${response.status}: ${await response.text()}`);
  }
  return response.json() as Promise<T>;
}

async function alliumPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": API_KEY,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Allium POST ${path} failed ${response.status}: ${await response.text()}`);
  }
  return response.json() as Promise<T>;
}

// ---- Supported Chains (call once per session, cache result) ----

let cachedChains: AlliumSupportedChains | null = null;

export async function getSupportedChains(): Promise<AlliumSupportedChains> {
  if (cachedChains) return cachedChains;
  cachedChains = await limiter.schedule(() =>
    withRetry(() => alliumGet<AlliumSupportedChains>(
      "/api/v1/supported-chains/realtime-apis/simple"
    ))
  );
  return cachedChains;
}

// ---- Token Prices ----

export async function getCurrentPrices(
  tokens: AlliumTokenAddress[]
): Promise<AlliumPriceResult[]> {
  return limiter.schedule(() =>
    withRetry(() => alliumPost<AlliumPriceResult[]>(
      "/api/v1/developer/prices",
      tokens
    ))
  );
}

export async function getPriceHistory(
  addresses: AlliumTokenAddress[],
  startTimestamp: number,
  endTimestamp: number,
  granularity: AlliumTimeGranularity = "1d"
): Promise<AlliumPriceHistory> {
  return limiter.schedule(() =>
    withRetry(() => alliumPost<AlliumPriceHistory>(
      "/api/v1/developer/prices/history",
      {
        addresses,
        start_timestamp: startTimestamp,
        end_timestamp: endTimestamp,
        time_granularity: granularity,
      }
    ))
  );
}

export async function getPriceAtTimestamp(
  tokenAddress: string,
  chain: string,
  timestamp: number
): Promise<AlliumPriceResult> {
  return limiter.schedule(() =>
    withRetry(() => alliumPost<AlliumPriceResult>(
      "/api/v1/developer/prices/at-timestamp",
      { token_address: tokenAddress, chain, timestamp }
    ))
  );
}

export async function getPriceStats(
  tokens: AlliumTokenAddress[]
): Promise<AlliumPriceResult[]> {
  return limiter.schedule(() =>
    withRetry(() => alliumPost<AlliumPriceResult[]>(
      "/api/v1/developer/prices/stats",
      tokens
    ))
  );
}

// ---- Token Lookup ----

export async function getTokensByChainAddress(
  tokens: AlliumTokenAddress[]
): Promise<unknown[]> {
  return limiter.schedule(() =>
    withRetry(() => alliumPost<unknown[]>(
      "/api/v1/developer/tokens/chain-address",
      tokens
    ))
  );
}

export async function searchTokens(query: string): Promise<unknown[]> {
  return limiter.schedule(() =>
    withRetry(() => alliumGet<unknown[]>(
      `/api/v1/developer/tokens/search?q=${encodeURIComponent(query)}`
    ))
  );
}

// ---- Wallet Data ----

export async function getWalletBalances(
  wallets: Array<{ chain: string; address: string }>
): Promise<AlliumWalletBalance[]> {
  return limiter.schedule(() =>
    withRetry(() => alliumPost<AlliumWalletBalance[]>(
      "/api/v1/developer/wallet/balances",
      wallets
    ))
  );
}

export async function getWalletBalanceHistory(
  wallets: Array<{ chain: string; address: string }>
): Promise<unknown> {
  return limiter.schedule(() =>
    withRetry(() => alliumPost<unknown>(
      "/api/v1/developer/wallet/balances/history",
      wallets
    ))
  );
}

export async function getWalletTransactions(
  wallets: Array<{ chain: string; address: string }>
): Promise<AlliumTransaction[]> {
  return limiter.schedule(() =>
    withRetry(() => alliumPost<AlliumTransaction[]>(
      "/api/v1/developer/wallet/transactions",
      wallets
    ))
  );
}

export async function getWalletPnL(
  wallets: Array<{ chain: string; address: string }>
): Promise<AlliumPnL[]> {
  return limiter.schedule(() =>
    withRetry(() => alliumPost<AlliumPnL[]>(
      "/api/v1/developer/wallet/pnl",
      wallets
    ))
  );
}

// ---- Explorer (Custom SQL) ----

export async function createQuery(
  title: string,
  sql: string = "{{ sql_query }}",
  limit: number = 10000
): Promise<{ query_id: string }> {
  return limiter.schedule(() =>
    withRetry(() => alliumPost<{ query_id: string }>(
      "/api/v1/explorer/queries",
      { title, config: { sql, limit } }
    ))
  );
}

export async function runQuery(
  queryId: string,
  sqlQuery: string
): Promise<AlliumQueryRun> {
  return limiter.schedule(() =>
    withRetry(() => alliumPost<AlliumQueryRun>(
      `/api/v1/explorer/queries/${queryId}/run-async`,
      { parameters: { sql_query: sqlQuery } }
    ))
  );
}

export async function getQueryStatus(
  runId: string
): Promise<AlliumQueryStatus> {
  return limiter.schedule(() =>
    withRetry(() => alliumGet<AlliumQueryStatus>(
      `/api/v1/explorer/query-runs/${runId}/status`
    ))
  );
}

export async function getQueryResults<T = Record<string, unknown>>(
  runId: string
): Promise<T[]> {
  return limiter.schedule(() =>
    withRetry(() => alliumGet<T[]>(
      `/api/v1/explorer/query-runs/${runId}/results?f=json`
    ))
  );
}

/**
 * Run a SQL query end-to-end: submit, poll until complete, return results.
 * Polls every 2 seconds, times out after maxWaitMs (default 120s).
 */
export async function executeSQL<T = Record<string, unknown>>(
  queryId: string,
  sql: string,
  maxWaitMs: number = 120_000
): Promise<T[]> {
  const { run_id } = await runQuery(queryId, sql);

  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    await new Promise((r) => setTimeout(r, 2000));

    const status = await getQueryStatus(run_id);
    if (status.status === "success") {
      return getQueryResults<T>(run_id);
    }
    if (status.status === "failed") {
      throw new Error(`Allium SQL query failed: ${status.error_message || "unknown error"}`);
    }
    // still running, continue polling
  }

  throw new Error(`Allium SQL query timed out after ${maxWaitMs}ms (run_id: ${run_id})`);
}

// ---- Documentation & Schema Discovery ----

export async function browseDocs(path: string = ""): Promise<unknown> {
  return limiter.schedule(() =>
    withRetry(() => alliumGet<unknown>(
      `/api/v1/docs/docs/browse?path=${encodeURIComponent(path)}`
    ))
  );
}

export async function searchDocs(query: string): Promise<unknown> {
  return limiter.schedule(() =>
    withRetry(() => alliumPost<unknown>(
      "/api/v1/docs/docs/search",
      { query }
    ))
  );
}

export async function browseSchemas(path: string = ""): Promise<unknown> {
  return limiter.schedule(() =>
    withRetry(() => alliumGet<unknown>(
      `/api/v1/docs/schemas/browse?path=${encodeURIComponent(path)}`
    ))
  );
}

export async function searchSchemas(query: string): Promise<{ ids: string[] }> {
  return limiter.schedule(() =>
    withRetry(() => alliumPost<{ ids: string[] }>(
      "/api/v1/docs/schemas/search",
      { query }
    ))
  );
}

// ---- Registration (for users without API key) ----

export async function register(
  name: string,
  email: string
): Promise<{ api_key: string; query_id: string }> {
  const response = await fetch(`${BASE_URL}/api/v1/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email }),
  });
  if (!response.ok) {
    throw new Error(`Allium registration failed: ${await response.text()}`);
  }
  return response.json() as Promise<{ api_key: string; query_id: string }>;
}

// ---- Namespace export ----

export const allium = {
  // Chain discovery
  getSupportedChains,
  // Prices
  getCurrentPrices,
  getPriceHistory,
  getPriceAtTimestamp,
  getPriceStats,
  // Token lookup
  getTokensByChainAddress,
  searchTokens,
  // Wallet
  getWalletBalances,
  getWalletBalanceHistory,
  getWalletTransactions,
  getWalletPnL,
  // SQL Explorer
  createQuery,
  runQuery,
  getQueryStatus,
  getQueryResults,
  executeSQL,
  // Docs & Schemas
  browseDocs,
  searchDocs,
  browseSchemas,
  searchSchemas,
  // Registration
  register,
};
