import { config } from "../../lib/config.js";
import { getLimiter, withRetry } from "../../lib/rate-limiter.js";

const limiter = getLimiter("coingecko", config.providers.coingecko.rateLimit);

interface CoinGeckoMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  fully_diluted_valuation: number | null;
  total_volume: number;
  price_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  sparkline_in_7d?: { price: number[] };
}

interface CoinGeckoMarketChart {
  prices: Array<[number, number]>;
  market_caps: Array<[number, number]>;
  total_volumes: Array<[number, number]>;
}

interface CoinGeckoCoinDetail {
  id: string;
  symbol: string;
  name: string;
  description: { en: string };
  categories: string[];
  links: Record<string, unknown>;
  image: { large: string; small: string; thumb: string };
  genesis_date: string | null;
  market_data: {
    current_price: { usd: number };
    market_cap: { usd: number };
    fully_diluted_valuation: { usd: number } | null;
    circulating_supply: number;
    total_supply: number | null;
    max_supply: number | null;
    total_volume: { usd: number };
    price_change_percentage_24h: number;
    ath: { usd: number };
  };
  developer_data: {
    forks: number;
    stars: number;
    commit_count_4_weeks: number;
    pull_requests_merged: number;
    code_additions_deletions_4_weeks: { additions: number; deletions: number };
  };
  community_data: {
    reddit_subscribers: number;
    reddit_accounts_active_48h: number;
  };
}

async function fetchJSON<T>(path: string): Promise<T> {
  const url = `${config.providers.coingecko.baseUrl}${path}`;
  const headers: Record<string, string> = {
    accept: "application/json",
  };
  if (config.providers.coingecko.apiKey) {
    headers["x-cg-pro-api-key"] = config.providers.coingecko.apiKey;
  }
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`CoinGecko API error ${response.status}: ${await response.text()}`);
  }
  return response.json() as Promise<T>;
}

export async function getMarkets(
  page = 1,
  perPage = 250,
  sparkline = false
): Promise<CoinGeckoMarket[]> {
  return limiter.schedule(() =>
    withRetry(() =>
      fetchJSON<CoinGeckoMarket[]>(
        `/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=${sparkline}`
      )
    )
  );
}

export async function getCoinDetail(id: string): Promise<CoinGeckoCoinDetail> {
  return limiter.schedule(() =>
    withRetry(() =>
      fetchJSON<CoinGeckoCoinDetail>(
        `/coins/${id}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=true`
      )
    )
  );
}

export async function getMarketChart(
  id: string,
  days: number | "max"
): Promise<CoinGeckoMarketChart> {
  return limiter.schedule(() =>
    withRetry(() =>
      fetchJSON<CoinGeckoMarketChart>(
        `/coins/${id}/market_chart?vs_currency=usd&days=${days}`
      )
    )
  );
}

export async function getMarketChartRange(
  id: string,
  from: number,
  to: number
): Promise<CoinGeckoMarketChart> {
  return limiter.schedule(() =>
    withRetry(() =>
      fetchJSON<CoinGeckoMarketChart>(
        `/coins/${id}/market_chart/range?vs_currency=usd&from=${from}&to=${to}`
      )
    )
  );
}

export async function getSimplePrice(
  ids: string[]
): Promise<Record<string, { usd: number; usd_market_cap: number; usd_24h_vol: number }>> {
  const idsStr = ids.join(",");
  return limiter.schedule(() =>
    withRetry(() =>
      fetchJSON(
        `/simple/price?ids=${idsStr}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true`
      )
    )
  );
}

export const coingecko = {
  getMarkets,
  getCoinDetail,
  getMarketChart,
  getMarketChartRange,
  getSimplePrice,
};
