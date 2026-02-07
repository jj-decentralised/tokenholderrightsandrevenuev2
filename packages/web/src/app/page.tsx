import { MetricCard } from "@/components/ui/MetricCard";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { ProductiveScore } from "@/components/ui/ProductiveScore";
import { SyncStatusBar } from "@/components/ui/SyncStatusBar";
import { ValuationScatter } from "@/components/charts/ValuationScatter";
import { fetchApi, formatUSD, formatNumber, formatRatio } from "@/lib/api";

export const dynamic = "force-dynamic";

interface DashboardData {
  overview: {
    total_fees: number;
    total_revenue: number;
    total_holder_revenue: number;
    protocols_with_fee_sharing: number;
    avg_holder_revenue_yield: number;
  };
  protocols: Array<ProtocolRow>;
  top_movers: {
    highest_yield: Array<{ name: string; slug: string; token_symbol: string; revenue_yield_pct: number }>;
    fastest_growth: Array<{ name: string; slug: string; token_symbol: string; holder_growth_30d: number }>;
  };
}

interface ProtocolRow {
  id: string; name: string; slug: string; logo_url: string | null;
  primary_category: string; tokenization_type: string; token_symbol: string | null;
  period_fees: number; period_revenue: number; period_holder_revenue: number;
  price_usd: number | null; market_cap_usd: number | null; fdv_usd: number | null;
  real_pe_ratio: number | null; revenue_yield_pct: number | null;
  productive_token_score: number | null; holder_count: number | null; holder_growth_30d: number | null;
}

const MOCK_OVERVIEW = {
  total_fees: 12450000, total_revenue: 4230000, total_holder_revenue: 1890000,
  protocols_with_fee_sharing: 47, avg_holder_revenue_yield: 3.2,
};

const MOCK_PROTOCOLS: ProtocolRow[] = [
  { id: "1", name: "Hyperliquid", slug: "hyperliquid", logo_url: null, primary_category: "derivatives", tokenization_type: "tokenized", token_symbol: "HYPE", period_fees: 1200000, period_revenue: 600000, period_holder_revenue: 310000, price_usd: null, market_cap_usd: 4500000000, fdv_usd: null, real_pe_ratio: 14.5, revenue_yield_pct: 6.8, productive_token_score: 8.2, holder_count: 45000, holder_growth_30d: 12.4 },
  { id: "2", name: "dYdX", slug: "dydx", logo_url: null, primary_category: "derivatives", tokenization_type: "tokenized", token_symbol: "DYDX", period_fees: 890000, period_revenue: 890000, period_holder_revenue: 890000, price_usd: null, market_cap_usd: 1200000000, fdv_usd: null, real_pe_ratio: 3.7, revenue_yield_pct: 27.1, productive_token_score: 9.1, holder_count: 32000, holder_growth_30d: 8.2 },
  { id: "3", name: "GMX", slug: "gmx", logo_url: null, primary_category: "derivatives", tokenization_type: "tokenized", token_symbol: "GMX", period_fees: 750000, period_revenue: 225000, period_holder_revenue: 225000, price_usd: null, market_cap_usd: 800000000, fdv_usd: null, real_pe_ratio: 9.7, revenue_yield_pct: 10.3, productive_token_score: 7.8, holder_count: 28000, holder_growth_30d: 5.1 },
  { id: "4", name: "Curve", slug: "curve", logo_url: null, primary_category: "dex", tokenization_type: "tokenized", token_symbol: "CRV", period_fees: 620000, period_revenue: 310000, period_holder_revenue: 155000, price_usd: null, market_cap_usd: 600000000, fdv_usd: null, real_pe_ratio: 10.6, revenue_yield_pct: 9.4, productive_token_score: 7.2, holder_count: 85000, holder_growth_30d: 2.1 },
  { id: "5", name: "Aave", slug: "aave", logo_url: null, primary_category: "lending", tokenization_type: "tokenized", token_symbol: "AAVE", period_fees: 1100000, period_revenue: 440000, period_holder_revenue: 66000, price_usd: null, market_cap_usd: 3200000000, fdv_usd: null, real_pe_ratio: 133, revenue_yield_pct: 0.75, productive_token_score: 5.4, holder_count: 120000, holder_growth_30d: 4.2 },
  { id: "6", name: "Pendle", slug: "pendle", logo_url: null, primary_category: "yield", tokenization_type: "tokenized", token_symbol: "PENDLE", period_fees: 480000, period_revenue: 192000, period_holder_revenue: 153600, price_usd: null, market_cap_usd: 700000000, fdv_usd: null, real_pe_ratio: 12.5, revenue_yield_pct: 8.0, productive_token_score: 7.6, holder_count: 42000, holder_growth_30d: 15.2 },
  { id: "7", name: "Jupiter", slug: "jupiter", logo_url: null, primary_category: "dex", tokenization_type: "tokenized", token_symbol: "JUP", period_fees: 950000, period_revenue: 237500, period_holder_revenue: 118750, price_usd: null, market_cap_usd: 2100000000, fdv_usd: null, real_pe_ratio: 48.4, revenue_yield_pct: 2.1, productive_token_score: 6.1, holder_count: 195000, holder_growth_30d: 22.1 },
  { id: "8", name: "MakerDAO", slug: "makerdao", logo_url: null, primary_category: "cdp", tokenization_type: "tokenized", token_symbol: "MKR", period_fees: 820000, period_revenue: 328000, period_holder_revenue: 262400, price_usd: null, market_cap_usd: 1800000000, fdv_usd: null, real_pe_ratio: 18.8, revenue_yield_pct: 5.3, productive_token_score: 7.4, holder_count: 52000, holder_growth_30d: 1.2 },
];

async function getDashboard() {
  try {
    const data = await fetchApi<DashboardData>("/dashboard/overview", { range: "1d" });
    return { overview: data.overview, protocols: data.protocols, topMovers: data.top_movers };
  } catch {
    return { overview: MOCK_OVERVIEW, protocols: MOCK_PROTOCOLS, topMovers: { highest_yield: [] as any[], fastest_growth: [] as any[] } };
  }
}

export default async function HomePage() {
  const { overview, protocols, topMovers } = await getDashboard();
  const topYield = topMovers.highest_yield?.length
    ? topMovers.highest_yield
    : [...protocols].sort((a, b) => (b.revenue_yield_pct || 0) - (a.revenue_yield_pct || 0)).slice(0, 5);
  const topScore = [...protocols].sort((a, b) => (b.productive_token_score || 0) - (a.productive_token_score || 0)).slice(0, 5);

  return (
    <div>
      <SyncStatusBar />

      {/* Headline Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-2 mb-8">
        <MetricCard title="Total Fees (24h)" value={formatUSD(overview.total_fees, true)} />
        <MetricCard title="Holder Revenue (24h)" value={formatUSD(overview.total_holder_revenue, true)} />
        <MetricCard title="Protocols Sharing Revenue" value={String(overview.protocols_with_fee_sharing)} />
        <MetricCard title="Avg Holder Yield" value={`${(overview.avg_holder_revenue_yield || 0).toFixed(1)}%`} />
      </div>

      {/* Two-column: Scatter + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2">
          <hr className="rule-heavy mb-4" />
          <ValuationScatter protocols={protocols} height={380} />
        </div>
        <div>
          <hr className="rule-heavy mb-4" />
          <h3 className="text-lg font-semibold mb-3">Highest Yield</h3>
          {topYield.map((p: any, i: number) => (
            <div key={p.slug || i} className="flex items-center justify-between py-1.5 border-b border-[#e8e8e8]">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#888] tabular-nums w-4">{i + 1}.</span>
                <a href={`/ventures/${p.slug}`} className="text-sm hover:underline">{p.name}</a>
              </div>
              <span className="text-sm tabular-nums font-semibold">{(p.revenue_yield_pct || 0).toFixed(1)}%</span>
            </div>
          ))}
          <h3 className="text-lg font-semibold mt-6 mb-3">Top Productive Score</h3>
          {topScore.map((p: any, i: number) => (
            <div key={p.slug || i} className="flex items-center justify-between py-1.5 border-b border-[#e8e8e8]">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#888] tabular-nums w-4">{i + 1}.</span>
                <a href={`/ventures/${p.slug}`} className="text-sm hover:underline">{p.name}</a>
              </div>
              <ProductiveScore score={p.productive_token_score} size="sm" />
            </div>
          ))}
        </div>
      </div>

      {/* Protocol Leaderboard */}
      <hr className="rule-heavy mb-1" />
      <div className="flex items-baseline justify-between mb-3 mt-2">
        <h2 className="text-xl font-bold">Protocol Revenue Leaderboard</h2>
        <SourceBadge sources={["DefiLlama", "CoinGecko"]} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full data-table">
          <thead>
            <tr className="border-b-2 border-[#111]">
              <Th align="left" w="w-8">#</Th>
              <Th align="left">Protocol</Th>
              <Th align="left">Category</Th>
              <Th>Fees 24h</Th>
              <Th>Revenue</Th>
              <Th>Holder Rev</Th>
              <Th>Mkt Cap</Th>
              <Th>Real P/E</Th>
              <Th>Yield</Th>
              <Th>Holders</Th>
              <Th align="center">Score</Th>
            </tr>
          </thead>
          <tbody>
            {protocols.map((p, i) => (
              <tr key={p.slug || p.id} className="border-b border-[#e8e8e8] hover:bg-[#f8f7f4]">
                <td className="px-2 py-2 text-sm tabular-nums text-[#888]">{i + 1}</td>
                <td className="px-2 py-2">
                  <a href={`/ventures/${p.slug}`} className="text-sm font-semibold hover:underline">{p.name}</a>
                  {p.token_symbol && <span className="text-xs text-[#888] ml-1.5">{p.token_symbol}</span>}
                </td>
                <td className="px-2 py-2 text-xs text-[#888] capitalize">{(p.primary_category || "").replace(/_/g, " ")}</td>
                <td className="px-2 py-2 text-sm text-right tabular-nums">{formatUSD(p.period_fees, true)}</td>
                <td className="px-2 py-2 text-sm text-right tabular-nums">{formatUSD(p.period_revenue, true)}</td>
                <td className="px-2 py-2 text-sm text-right tabular-nums font-semibold">{formatUSD(p.period_holder_revenue, true)}</td>
                <td className="px-2 py-2 text-sm text-right tabular-nums">{formatUSD(p.market_cap_usd, true)}</td>
                <td className="px-2 py-2 text-sm text-right tabular-nums">{formatRatio(p.real_pe_ratio)}</td>
                <td className="px-2 py-2 text-sm text-right tabular-nums">{p.revenue_yield_pct != null ? `${p.revenue_yield_pct.toFixed(1)}%` : "—"}</td>
                <td className="px-2 py-2 text-sm text-right tabular-nums">{formatNumber(p.holder_count, true)}</td>
                <td className="px-2 py-2 text-center"><ProductiveScore score={p.productive_token_score} size="sm" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, align = "right", w }: { children: React.ReactNode; align?: string; w?: string }) {
  return (
    <th className={`px-2 py-2 text-xs text-[#888] font-normal italic ${w || ""} text-${align}`}>
      {children}
    </th>
  );
}
