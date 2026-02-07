import { config } from "../../lib/config.js";
import { getLimiter, withRetry } from "../../lib/rate-limiter.js";

const limiter = getLimiter("codex", config.providers.codex.rateLimit);

interface CodexHolder {
  address: string;
  shiftedBalance: number;
  balanceUsd: number;
  firstHeldTimestamp: number | null;
}

interface CodexHoldersResponse {
  count: number;
  top10HoldersPercent: number;
  items: CodexHolder[];
}

interface CodexTokenStats {
  holders: number;
  sniperCount: number;
  sniperHeldPercentage: number;
  bundlerCount: number;
  insiderCount: number;
  insiderHeldPercentage: number;
  devHeldPercentage: number;
  walletAgeAvg: number;
  walletAgeStd: number;
}

async function graphqlQuery<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const response = await fetch(config.providers.codex.baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: config.providers.codex.apiKey,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Codex API error ${response.status}: ${await response.text()}`);
  }

  const result = (await response.json()) as { data: T; errors?: Array<{ message: string }> };
  if (result.errors?.length) {
    throw new Error(`Codex GraphQL error: ${result.errors[0].message}`);
  }
  return result.data;
}

export async function getHolders(
  tokenId: string,
  limit = 200
): Promise<CodexHoldersResponse> {
  return limiter.schedule(() =>
    withRetry(() =>
      graphqlQuery<{ holders: CodexHoldersResponse }>(
        `query GetHolders($input: HoldersInput!) {
          holders(input: $input) {
            count
            top10HoldersPercent
            items {
              address
              shiftedBalance
              balanceUsd
              firstHeldTimestamp
            }
          }
        }`,
        { input: { tokenId, limit } }
      ).then((r) => r.holders)
    )
  );
}

export async function getHolderCount(
  tokenId: string
): Promise<{ count: number; top10HoldersPercent: number }> {
  return limiter.schedule(() =>
    withRetry(() =>
      graphqlQuery<{ holders: { count: number; top10HoldersPercent: number } }>(
        `query GetHolderCount($input: HoldersInput!) {
          holders(input: $input) {
            count
            top10HoldersPercent
          }
        }`,
        { input: { tokenId, limit: 1 } }
      ).then((r) => r.holders)
    )
  );
}

export async function getTokenStats(
  tokenId: string
): Promise<CodexTokenStats> {
  return limiter.schedule(() =>
    withRetry(() =>
      graphqlQuery<{ filterTokens: { results: CodexTokenStats[] } }>(
        `query GetTokenStats($tokens: [String!]!) {
          filterTokens(tokens: $tokens) {
            results {
              holders
              sniperCount
              sniperHeldPercentage
              bundlerCount
              insiderCount
              insiderHeldPercentage
              devHeldPercentage
              walletAgeAvg
              walletAgeStd
            }
          }
        }`,
        { tokens: [tokenId] }
      ).then((r) => r.filterTokens.results[0])
    )
  );
}

export async function getTopTraders(
  tokenId: string,
  limit = 50
): Promise<Array<{ address: string; pnl: number; totalBought: number; totalSold: number }>> {
  return limiter.schedule(() =>
    withRetry(() =>
      graphqlQuery<{ tokenTopTraders: { items: Array<{ address: string; pnl: number; totalBought: number; totalSold: number }> } }>(
        `query GetTopTraders($input: TokenTopTradersInput!) {
          tokenTopTraders(input: $input) {
            items {
              address
              pnl
              totalBought
              totalSold
            }
          }
        }`,
        { input: { tokenId, limit } }
      ).then((r) => r.tokenTopTraders.items)
    )
  );
}

export const codex = {
  getHolders,
  getHolderCount,
  getTokenStats,
  getTopTraders,
};
