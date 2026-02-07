import { MetricCard } from "@/components/ui/MetricCard";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { ProductiveScore } from "@/components/ui/ProductiveScore";
import { fetchApi, formatUSD, formatPercent, formatNumber, formatRatio } from "@/lib/api";

interface DashboardData {
  overview: {
    total_fees: number;
    total_revenue: number;
    total_holder_revenue: number;
    protocols_with_fee_sharing: number;
    avg_holder_revenue_yield: number;
  };
  protocols: Array<{
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    primary_category: string;
    tokenization_type: string;
    token_symbol: string | null;
    period_fees: number;
    period_revenue: number;
    period_holder_revenue: number;
    price_usd: number | null;
    market_cap_usd: number | null;
    fdv_usd: number | null;
    real_pe_ratio: number | null;
    revenue_yield_pct: number | null;
    productive_token_score: number | null;
    holder_count: number | null;
    holder_growth_30d: number | null;
  }>;
  top_movers: {
    highest_yield: Array<{ name: string; slug: string; token_symbol: string; revenue_yield_pct: number }>;
    fastest_growth: Array<{ name: string; slug: string; token_symbol: string; holder_growth_30d: number }>;
  };
}

// Fallback mock data for when API is unavailable
const MOCK_OVERVIEW = {
  total_fees: 12450000,
  total_revenue: 4230000,
  total_holder_revenue: 1890000,
  protocols_with_fee_sharing: 47,
  avg_holder_revenue_yield: 3.2,
};

const MOCK_PROTOCOLS = [
  { id: "1", name: "Hyperliquid", slug: "hyperliquid", logo_url: null, primary_category: "derivatives", tokenization_type: "tokenized", token_symbol: "HYPE", period_fees: 1200000, period_revenue: 600000, period_holder_revenue: 310000, price_usd: null, market_cap_usd: 4500000000, fdv_usd: null, real_pe_ratio: 14.5, revenue_yield_pct: 6.8, productive_token_score: 8.2, holder_count: 45000, holder_growth_30d: 12.4 },
  { id: "2", name: "dYdX", slug: "dydx", logo_url: null, primary_category: "derivatives", tokenization_type: "tokenized", token_symbol: "DYDX", period_fees: 890000, period_revenue: 890000, period_holder_revenue: 890000, price_usd: null, market_cap_usd: 1200000000, fdv_usd: null, real_pe_ratio: 3.7, revenue_yield_pct: 27.1, productive_token_score: 9.1, holder_count: 32000, holder_growth_30d: 8.2 },
  { id: "3", name: "GMX", slug: "gmx", logo_url: null, primary_category: "derivatives", tokenization_type: "tokenized", token_symbol: "GMX", period_fees: 750000, period_revenue: 225000, period_holder_revenue: 225000, price_usd: null, market_cap_usd: 800000000, fdv_usd: null, real_pe_ratio: 9.7, revenue_yield_pct: 10.3, productive_token_score: 7.8, holder_count: 28000, holder_growth_30d: 5.1 },
  { id: "4", name: "Curve", slug: "curve", logo_url: null, primary_category: "dex", tokenization_type: "tokenized", token_symbol: "CRV", period_fees: 620000, period_revenue: 310000, period_holder_revenue: 155000, price_usd: null, market_cap_usd: 600000000, fdv_usd: null, real_pe_ratio: 10.6, revenue_yield_pct: 9.4, productive_token_score: 7.2, holder_count: 85000, holder_growth_30d: 2.1 },
  { id: "5", name: "Synthetix", slug: "synthetix", logo_url: null, primary_category: "derivatives", tokenization_type: "tokenized", token_symbol: "SNX", period_fees: 540000, period_revenue: 378000, period_holder_revenue: 324000, price_usd: null, market_cap_usd: 450000000, fdv_usd: null, real_pe_ratio: 3.8, revenue_yield_pct: 26.3, productive_token_score: 8.5, holder_count: 18000, holder_growth_30d: 3.4 },
  { id: "6", name: "Aave", slug: "aave", logo_url: null, primary_category: "lending", tokenization_type: "tokenized", token_symbol: "AAVE", period_fees: 1100000, period_revenue: 440000, period_holder_revenue: 66000, price_usd: null, market_cap_usd: 3200000000, fdv_usd: null, real_pe_ratio: 133, revenue_yield_pct: 0.75, productive_token_score: 5.4, holder_count: 120000, holder_growth_30d: 4.2 },
  { id: "7", name: "Pendle", slug: "pendle", logo_url: null, primary_category: "yield", tokenization_type: "tokenized", token_symbol: "PENDLE", period_fees: 480000, period_revenue: 192000, period_holder_revenue: 153600, price_usd: null, market_cap_usd: 700000000, fdv_usd: null, real_pe_ratio: 12.5, revenue_yield_pct: 8.0, productive_token_score: 7.6, holder_count: 42000, holder_growth_30d: 15.2 },
  { id: "8", name: "Jupiter", slug: "jupiter", logo_url: null, primary_category: "dex", tokenization_type: "tokenized", token_symbol: "JUP", period_fees: 950000, period_revenue: 237500, period_holder_revenue: 118750, price_usd: null, market_cap_usd: 2100000000, fdv_usd: null, real_pe_ratio: 48.4, revenue_yield_pct: 2.1, productive_token_score: 6.1, holder_count: 195000, holder_growth_30d: 22.1 },
  { id: "9", name: "Raydium", slug: "raydium", logo_url: null, primary_category: "dex", tokenization_type: "tokenized", token_symbol: "RAY", period_fees: 680000, period_revenue: 204000, period_holder_revenue: 81600, price_usd: null, market_cap_usd: 450000000, fdv_usd: null, real_pe_ratio: 15.1, revenue_yield_pct: 6.6, productive_token_score: 6.8, holder_count: 67000, holder_growth_30d: 9.7 },
  { id: "10", name: "MakerDAO", slug: "makerdao", logo_url: null, primary_category: "cdp", tokenization_type: "tokenized", token_symbol: "MKR", period_fees: 820000, period_revenue: 328000, period_holder_revenue: 262400, price_usd: null, market_cap_usd: 1800000000, fdv_usd: null, real_pe_ratio: 18.8, revenue_yield_pct: 5.3, productive_token_score: 7.4, holder_count: 52000, holder_growth_30d: 1.2 },
];

interface ProtocolRow {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_category: string;
  tokenization_type: string;
  token_symbol: string | null;
  period_fees: number;
  period_revenue: number;
  period_holder_revenue: number;
  price_usd: number | null;
  market_cap_usd: number | null;
  fdv_usd: number | null;
  real_pe_ratio: number | null;
  revenue_yield_pct: number | null;
  productive_token_score: number | null;
  holder_count: number | null;
  holder_growth_30d: number | null;
  rank?: number;
}

async function getDashboard(): Promise<{ overview: typeof MOCK_OVERVIEW; protocols: ProtocolRow[]; topYield: ProtocolRow[]; topScore: ProtocolRow[] }> {
  try {
    const data = await fetchApi<DashboardData>("/dashboard/overview", { range: "1d" });
    const protocols = data.protocols.map((p, i) => ({
      ...p,
      rank: i + 1,
    }));
    return {
      overview: data.overview,
      protocols,
      topYield: [...protocols].sort((a, b) => (b.revenue_yield_pct || 0) - (a.revenue_yield_pct || 0)).slice(0, 5),
      topScore: [...protocols].sort((a, b) => (b.productive_token_score || 0) - (a.productive_token_score || 0)).slice(0, 5),
    };
  } catch {
    // Fallback to mock data when API is unavailable
    const protocols = MOCK_PROTOCOLS.map((p, i) => ({ ...p, rank: i + 1 }));
    return {
      overview: MOCK_OVERVIEW,
      protocols,
      topYield: [...protocols].sort((a, b) => (b.revenue_yield_pct || 0) - (a.revenue_yield_pct || 0)).slice(0, 5),
      topScore: [...protocols].sort((a, b) => (b.productive_token_score || 0) - (a.productive_token_score || 0)).slice(0, 5),
    };
  }
}

export default async function HomePage() {
  const { overview, protocols, topYield, topScore } = await getDashboard();

  return (
    <div className="space-y-6">
      {/* Market Overview Banner */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Protocol Revenue Leaderboard</h1>
          <SourceBadge sources={["DefiLlama", "CoinGecko", "Codex"]} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            title="Total Fees (24h)"
            value={formatUSD(overview.total_fees, true)}
            source="DefiLlama"
          />
          <MetricCard
            title="Total Holder Revenue (24h)"
            value={formatUSD(overview.total_holder_revenue, true)}
            source="DefiLlama"
          />
          <MetricCard
            title="Protocols with Fee Sharing"
            value={String(overview.protocols_with_fee_sharing)}
          />
          <MetricCard
            title="Avg Holder Revenue Yield"
            value={`${(overview.avg_holder_revenue_yield || 0).toFixed(1)}%`}
          />
        </div>
      </div>

      {/* Protocol Rankings Table */}
      <div className="bg-white border border-[#e5e5e3] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[#e5e5e3] flex items-center justify-between">
          <h2 className="text-sm font-medium">Top Protocols by Revenue ({protocols.length} tracked)</h2>
          <div className="flex items-center gap-2">
            <select className="text-xs bg-[#f7f7f5] border border-[#e5e5e3] rounded px-2 py-1 text-[#8f9a9e]">
              <option value="">All Categories</option>
              <option value="dex">DEX</option>
              <option value="lending">Lending</option>
              <option value="derivatives">Derivatives</option>
              <option value="cdp">CDP</option>
              <option value="yield">Yield</option>
            </select>
            <button className="text-xs text-[#8f9a9e] bg-[#f7f7f5] border border-[#e5e5e3] rounded px-2 py-1 hover:text-[#133c3b]">
              Export CSV
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr className="border-b border-[#e5e5e3]">
                <th className="px-3 py-2 text-xs font-medium text-[#8f9a9e] text-left w-8">#</th>
                <th className="px-3 py-2 text-xs font-medium text-[#8f9a9e] text-left">Protocol</th>
                <th className="px-3 py-2 text-xs font-medium text-[#8f9a9e] text-left">Category</th>
                <th className="px-3 py-2 text-xs font-medium text-[#8f9a9e] text-right">Fees 24h</th>
                <th className="px-3 py-2 text-xs font-medium text-[#8f9a9e] text-right">Revenue 24h</th>
                <th className="px-3 py-2 text-xs font-medium text-[#8f9a9e] text-right">Holder Rev 24h</th>
                <th className="px-3 py-2 text-xs font-medium text-[#8f9a9e] text-right">Market Cap</th>
                <th className="px-3 py-2 text-xs font-medium text-[#8f9a9e] text-right">Real P/E</th>
                <th className="px-3 py-2 text-xs font-medium text-[#8f9a9e] text-right">Holder Yield</th>
                <th className="px-3 py-2 text-xs font-medium text-[#8f9a9e] text-right">Holders</th>
                <th className="px-3 py-2 text-xs font-medium text-[#8f9a9e] text-center">Score</th>
              </tr>
            </thead>
            <tbody>
              {protocols.map((p: any, i: number) => (
                <tr
                  key={p.slug || p.id}
                  className="border-b border-[#eeeeec] hover:bg-[#f7f7f5] cursor-pointer transition-colors"
                >
                  <td className="px-3 py-2.5 text-sm text-[#8f9a9e] tabular-nums">{i + 1}</td>
                  <td className="px-3 py-2.5">
                    <a href={`/ventures/${p.slug}`} className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#133c3b] hover:text-[#32b88d]">
                        {p.name}
                      </span>
                      {p.token_symbol && (
                        <span className="text-xs text-[#8f9a9e]">{p.token_symbol}</span>
                      )}
                    </a>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-xs text-[#8f9a9e] bg-[#f7f7f5] px-1.5 py-0.5 rounded capitalize">
                      {(p.primary_category || "").replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-sm text-right tabular-nums">{formatUSD(p.period_fees, true)}</td>
                  <td className="px-3 py-2.5 text-sm text-right tabular-nums text-[#32b88d]">{formatUSD(p.period_revenue, true)}</td>
                  <td className="px-3 py-2.5 text-sm text-right tabular-nums text-[#32b88d]">{formatUSD(p.period_holder_revenue, true)}</td>
                  <td className="px-3 py-2.5 text-sm text-right tabular-nums">{formatUSD(p.market_cap_usd, true)}</td>
                  <td className="px-3 py-2.5 text-sm text-right tabular-nums">{formatRatio(p.real_pe_ratio)}</td>
                  <td className="px-3 py-2.5 text-sm text-right tabular-nums text-[#32b88d]">{p.revenue_yield_pct != null ? `${p.revenue_yield_pct.toFixed(1)}%` : "—"}</td>
                  <td className="px-3 py-2.5 text-sm text-right tabular-nums">{formatNumber(p.holder_count, true)}</td>
                  <td className="px-3 py-2.5 text-center">
                    {p.productive_token_score != null ? (
                      <ProductiveScore score={p.productive_token_score} size="sm" />
                    ) : (
                      <span className="text-xs text-[#8f9a9e]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Movers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-[#e5e5e3] rounded-lg p-4">
          <h3 className="text-sm font-medium mb-3">Highest Holder Revenue Yield</h3>
          <div className="space-y-2">
            {topYield.map((p: any, i: number) => (
              <div key={p.slug || p.id} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#8f9a9e] w-4">{i + 1}</span>
                  <a href={`/ventures/${p.slug}`} className="text-sm hover:text-[#32b88d]">{p.name}</a>
                  {p.token_symbol && <span className="text-xs text-[#8f9a9e]">{p.token_symbol}</span>}
                </div>
                <span className="text-sm text-[#32b88d] tabular-nums">{(p.revenue_yield_pct || 0).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-[#e5e5e3] rounded-lg p-4">
          <h3 className="text-sm font-medium mb-3">Highest Productive Token Score</h3>
          <div className="space-y-2">
            {topScore.map((p: any, i: number) => (
              <div key={p.slug || p.id} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#8f9a9e] w-4">{i + 1}</span>
                  <a href={`/ventures/${p.slug}`} className="text-sm hover:text-[#32b88d]">{p.name}</a>
                  {p.token_symbol && <span className="text-xs text-[#8f9a9e]">{p.token_symbol}</span>}
                </div>
                {p.productive_token_score != null ? (
                  <ProductiveScore score={p.productive_token_score} size="sm" />
                ) : (
                  <span className="text-xs text-[#8f9a9e]">—</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
