import { MetricCard } from "@/components/ui/MetricCard";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { ProductiveScore } from "@/components/ui/ProductiveScore";
import { formatUSD, formatPercent, formatNumber, formatRatio } from "@/lib/api";

// Mock data for initial render - replaced by API calls in production
const MOCK_OVERVIEW = {
  total_fees_24h: 12450000,
  total_revenue_24h: 4230000,
  total_holder_revenue_24h: 1890000,
  protocols_with_fee_sharing: 47,
  avg_holder_revenue_yield: 3.2,
};

const MOCK_PROTOCOLS = [
  { rank: 1, name: "Hyperliquid", slug: "hyperliquid", category: "derivatives", token: "HYPE", fees_24h: 1200000, revenue_24h: 600000, holder_revenue_24h: 310000, market_cap: 4500000000, real_pe: 14.5, yield: 6.8, holders: 45000, score: 8.2 },
  { rank: 2, name: "dYdX", slug: "dydx", category: "derivatives", token: "DYDX", fees_24h: 890000, revenue_24h: 890000, holder_revenue_24h: 890000, market_cap: 1200000000, real_pe: 3.7, yield: 27.1, holders: 32000, score: 9.1 },
  { rank: 3, name: "GMX", slug: "gmx", category: "derivatives", token: "GMX", fees_24h: 750000, revenue_24h: 225000, holder_revenue_24h: 225000, market_cap: 800000000, real_pe: 9.7, yield: 10.3, holders: 28000, score: 7.8 },
  { rank: 4, name: "Curve", slug: "curve", category: "dex", token: "CRV", fees_24h: 620000, revenue_24h: 310000, holder_revenue_24h: 155000, market_cap: 600000000, real_pe: 10.6, yield: 9.4, holders: 85000, score: 7.2 },
  { rank: 5, name: "Synthetix", slug: "synthetix", category: "derivatives", token: "SNX", fees_24h: 540000, revenue_24h: 378000, holder_revenue_24h: 324000, market_cap: 450000000, real_pe: 3.8, yield: 26.3, holders: 18000, score: 8.5 },
  { rank: 6, name: "Aave", slug: "aave", category: "lending", token: "AAVE", fees_24h: 1100000, revenue_24h: 440000, holder_revenue_24h: 66000, market_cap: 3200000000, real_pe: 133, yield: 0.75, holders: 120000, score: 5.4 },
  { rank: 7, name: "Pendle", slug: "pendle", category: "yield", token: "PENDLE", fees_24h: 480000, revenue_24h: 192000, holder_revenue_24h: 153600, market_cap: 700000000, real_pe: 12.5, yield: 8.0, holders: 42000, score: 7.6 },
  { rank: 8, name: "Jupiter", slug: "jupiter", category: "dex", token: "JUP", fees_24h: 950000, revenue_24h: 237500, holder_revenue_24h: 118750, market_cap: 2100000000, real_pe: 48.4, yield: 2.1, holders: 195000, score: 6.1 },
  { rank: 9, name: "Raydium", slug: "raydium", category: "dex", token: "RAY", fees_24h: 680000, revenue_24h: 204000, holder_revenue_24h: 81600, market_cap: 450000000, real_pe: 15.1, yield: 6.6, holders: 67000, score: 6.8 },
  { rank: 10, name: "MakerDAO", slug: "makerdao", category: "cdp", token: "MKR", fees_24h: 820000, revenue_24h: 328000, holder_revenue_24h: 262400, market_cap: 1800000000, real_pe: 18.8, yield: 5.3, holders: 52000, score: 7.4 },
];

export default function HomePage() {
  const overview = MOCK_OVERVIEW;

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
            value={formatUSD(overview.total_fees_24h, true)}
            source="DefiLlama"
          />
          <MetricCard
            title="Total Holder Revenue (24h)"
            value={formatUSD(overview.total_holder_revenue_24h, true)}
            source="DefiLlama"
          />
          <MetricCard
            title="Protocols with Fee Sharing"
            value={String(overview.protocols_with_fee_sharing)}
          />
          <MetricCard
            title="Avg Holder Revenue Yield"
            value={`${overview.avg_holder_revenue_yield.toFixed(1)}%`}
          />
        </div>
      </div>

      {/* Protocol Rankings Table */}
      <div className="bg-white border border-[#e5e5e3] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[#e5e5e3] flex items-center justify-between">
          <h2 className="text-sm font-medium">Top Protocols by Revenue</h2>
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
              {MOCK_PROTOCOLS.map((p) => (
                <tr
                  key={p.slug}
                  className="border-b border-[#eeeeec] hover:bg-[#f7f7f5] cursor-pointer transition-colors"
                >
                  <td className="px-3 py-2.5 text-sm text-[#8f9a9e] tabular-nums">{p.rank}</td>
                  <td className="px-3 py-2.5">
                    <a href={`/ventures/${p.slug}`} className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#133c3b] hover:text-[#32b88d]">
                        {p.name}
                      </span>
                      <span className="text-xs text-[#8f9a9e]">{p.token}</span>
                    </a>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-xs text-[#8f9a9e] bg-[#f7f7f5] px-1.5 py-0.5 rounded capitalize">
                      {p.category}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-sm text-right tabular-nums">{formatUSD(p.fees_24h, true)}</td>
                  <td className="px-3 py-2.5 text-sm text-right tabular-nums text-[#32b88d]">{formatUSD(p.revenue_24h, true)}</td>
                  <td className="px-3 py-2.5 text-sm text-right tabular-nums text-[#32b88d]">{formatUSD(p.holder_revenue_24h, true)}</td>
                  <td className="px-3 py-2.5 text-sm text-right tabular-nums">{formatUSD(p.market_cap, true)}</td>
                  <td className="px-3 py-2.5 text-sm text-right tabular-nums">{formatRatio(p.real_pe)}</td>
                  <td className="px-3 py-2.5 text-sm text-right tabular-nums text-[#32b88d]">{p.yield.toFixed(1)}%</td>
                  <td className="px-3 py-2.5 text-sm text-right tabular-nums">{formatNumber(p.holders, true)}</td>
                  <td className="px-3 py-2.5 text-center">
                    <ProductiveScore score={p.score} size="sm" />
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
            {MOCK_PROTOCOLS.sort((a, b) => b.yield - a.yield).slice(0, 5).map((p, i) => (
              <div key={p.slug} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#8f9a9e] w-4">{i + 1}</span>
                  <a href={`/ventures/${p.slug}`} className="text-sm hover:text-[#32b88d]">{p.name}</a>
                  <span className="text-xs text-[#8f9a9e]">{p.token}</span>
                </div>
                <span className="text-sm text-[#32b88d] tabular-nums">{p.yield.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-[#e5e5e3] rounded-lg p-4">
          <h3 className="text-sm font-medium mb-3">Highest Productive Token Score</h3>
          <div className="space-y-2">
            {MOCK_PROTOCOLS.sort((a, b) => b.score - a.score).slice(0, 5).map((p, i) => (
              <div key={p.slug} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#8f9a9e] w-4">{i + 1}</span>
                  <a href={`/ventures/${p.slug}`} className="text-sm hover:text-[#32b88d]">{p.name}</a>
                  <span className="text-xs text-[#8f9a9e]">{p.token}</span>
                </div>
                <ProductiveScore score={p.score} size="sm" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
