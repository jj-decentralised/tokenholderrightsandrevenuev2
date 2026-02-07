import { config } from "../../lib/config.js";
import { getLimiter, withRetry } from "../../lib/rate-limiter.js";

const limiter = getLimiter("defillama", config.providers.defillama.rateLimit);

interface DefiLlamaFeeResponse {
  id: string;
  name: string;
  displayName: string;
  total24h: number | null;
  total7d: number | null;
  total30d: number | null;
  totalAllTime: number | null;
  totalDataChart: Array<[number, number]>;
  totalDataChartBreakdown: Record<string, Record<string, number>>[];
  linkedProtocols: string[];
  category: string;
  chains: string[];
  methodologyURL: string;
  methodology: Record<string, string>;
}

interface DefiLlamaProtocol {
  id: string;
  name: string;
  slug: string;
  category: string;
  chains: string[];
  logo: string;
  url: string;
  description: string;
  parentProtocol?: string;
}

type DataType =
  | "dailyFees"
  | "dailyRevenue"
  | "dailyHoldersRevenue"
  | "dailyProtocolRevenue"
  | "dailySupplySideRevenue"
  | "dailyUserFees"
  | "dailyEarnings";

async function fetchJSON<T>(url: string): Promise<T> {
  const headers: Record<string, string> = {};
  if (config.providers.defillama.apiKey) {
    headers["x-api-key"] = config.providers.defillama.apiKey;
  }
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`DefiLlama API error ${response.status}: ${await response.text()}`);
  }
  return response.json() as Promise<T>;
}

export async function getFeesOverview(
  dataType: DataType = "dailyFees"
): Promise<DefiLlamaFeeResponse[]> {
  return limiter.schedule(() =>
    withRetry(() =>
      fetchJSON<{ protocols: DefiLlamaFeeResponse[] }>(
        `${config.providers.defillama.baseUrl}/overview/fees?dataType=${dataType}`
      ).then((r) => r.protocols)
    )
  );
}

export async function getProtocolFees(
  slug: string,
  dataType: DataType = "dailyFees"
): Promise<DefiLlamaFeeResponse> {
  return limiter.schedule(() =>
    withRetry(() =>
      fetchJSON<DefiLlamaFeeResponse>(
        `${config.providers.defillama.baseUrl}/summary/fees/${slug}?dataType=${dataType}`
      )
    )
  );
}

export async function getProtocolFeesChart(
  slug: string
): Promise<{ chart: Array<[number, number]>; chainBreakdown?: Record<string, Record<string, number>>[] }> {
  const baseUrl = config.providers.defillama.apiKey
    ? config.providers.defillama.proBaseUrl
    : config.providers.defillama.baseUrl;
  return limiter.schedule(() =>
    withRetry(() =>
      fetchJSON(`${baseUrl}/fees/chart/${slug}`)
    )
  );
}

export async function getAllProtocols(): Promise<DefiLlamaProtocol[]> {
  return limiter.schedule(() =>
    withRetry(() =>
      fetchJSON<DefiLlamaProtocol[]>(
        `${config.providers.defillama.baseUrl}/protocols`
      )
    )
  );
}

export async function getEmissions(slug: string): Promise<unknown> {
  return limiter.schedule(() =>
    withRetry(() =>
      fetchJSON(
        `${config.providers.defillama.baseUrl}/emission/${slug}`
      )
    )
  );
}

export async function getTreasury(slug: string): Promise<unknown> {
  return limiter.schedule(() =>
    withRetry(() =>
      fetchJSON(
        `${config.providers.defillama.baseUrl}/treasury/${slug}`
      )
    )
  );
}

export const defillama = {
  getFeesOverview,
  getProtocolFees,
  getProtocolFeesChart,
  getAllProtocols,
  getEmissions,
  getTreasury,
};
