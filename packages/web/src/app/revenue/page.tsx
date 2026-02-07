import { MetricCard } from "@/components/ui/MetricCard";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { fetchApi, formatUSD } from "@/lib/api";

export const dynamic = "force-dynamic";

interface RevenueAtlasData {
  overview: {
    total_fees: number;
    total_revenue: number;
    total_holder_revenue: number;
    protocol_count: number;
  };
  protocols: Array<{
    name: string;
    slug: string;
    primary_category: string;
    chains: string[];
    period_fees: number;
    period_revenue: number;
    period_holder_revenue: number;
    holder_pct: number;
  }>;
}

const MOCK_REVENUE_DATA = [
  { name: "Hyperliquid", slug: "hyperliquid", primary_category: "derivatives", chains: ["Hyperliquid L1"], period_fees: 43800000, period_revenue: 21900000, period_holder_revenue: 11310000, holder_pct: 51.6 },
  { name: "Uniswap", slug: "uniswap", primary_category: "dex", chains: ["Ethereum", "Arbitrum", "Base", "+33"], period_fees: 38500000, period_revenue: 1925000, period_holder_revenue: 770000, holder_pct: 2.0 },
  { name: "Aave", slug: "aave", primary_category: "lending", chains: ["Ethereum", "Polygon", "Arbitrum"], period_fees: 33000000, period_revenue: 13200000, period_holder_revenue: 1980000, holder_pct: 6.0 },
  { name: "Lido", slug: "lido", primary_category: "liquid_staking", chains: ["Ethereum"], period_fees: 28000000, period_revenue: 2800000, period_holder_revenue: 0, holder_pct: 0 },
  { name: "MakerDAO", slug: "makerdao", primary_category: "cdp", chains: ["Ethereum"], period_fees: 24600000, period_revenue: 9840000, period_holder_revenue: 7872000, holder_pct: 32.0 },
  { name: "dYdX", slug: "dydx", primary_category: "derivatives", chains: ["dYdX Chain"], period_fees: 26700000, period_revenue: 26700000, period_holder_revenue: 26700000, holder_pct: 100 },
  { name: "GMX", slug: "gmx", primary_category: "derivatives", chains: ["Arbitrum", "Avalanche"], period_fees: 22500000, period_revenue: 6750000, period_holder_revenue: 6750000, holder_pct: 30.0 },
  { name: "Jupiter", slug: "jupiter", primary_category: "dex", chains: ["Solana"], period_fees: 28500000, period_revenue: 7125000, period_holder_revenue: 3562500, holder_pct: 12.5 },
];

const MOCK_OVERVIEW = {
  total_fees: 245600000,
  total_revenue: 90240000,
  total_holder_revenue: 58944000,
  protocol_count: 200,
};

async function getRevenueData() {
  try {
    const data = await fetchApi<RevenueAtlasData>("/revenue/atlas", { range: "30d" });
    return { overview: data.overview, protocols: data.protocols };
  } catch {
    return { overview: MOCK_OVERVIEW, protocols: MOCK_REVENUE_DATA };
  }
}

export default async function RevenueAtlasPage() {
  const { overview, protocols } = await getRevenueData();
  const feePct = overview.total_fees > 0 ? ((overview.total_revenue / overview.total_fees) * 100).toFixed(1) : "0";
  const holderPct = overview.total_fees > 0 ? ((overview.total_holder_revenue / overview.total_fees) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Revenue Atlas</h1>
          <p className="text-sm text-[#8f9a9e] mt-1">
            Protocol revenue breakdown by category, chain, and holder allocation
          </p>
        </div>
        <SourceBadge sources={["DefiLlama"]} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          title="Total Fees (30D)"
          value={formatUSD(overview.total_fees, true)}
          source="DefiLlama"
        />
        <MetricCard
          title="Total Revenue (30D)"
          value={formatUSD(overview.total_revenue, true)}
          subtitle={`${feePct}% of fees`}
        />
        <MetricCard
          title="Holder Revenue (30D)"
          value={formatUSD(overview.total_holder_revenue, true)}
          subtitle={`${holderPct}% of fees`}
        />
        <MetricCard
          title="Protocols Tracked"
          value={`${overview.protocol_count}+`}
        />
      </div>

      {/* Revenue Table */}
      <div className="bg-white border border-[#e5e5e3] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[#e5e5e3] flex items-center justify-between">
          <h2 className="text-sm font-medium">Revenue by Protocol (30D)</h2>
          <div className="flex items-center gap-2">
            <select className="text-xs bg-[#f7f7f5] border border-[#e5e5e3] rounded px-2 py-1 text-[#8f9a9e]">
              <option value="">All Categories</option>
              <option value="dex">DEX</option>
              <option value="lending">Lending</option>
              <option value="derivatives">Derivatives</option>
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
                <th className="px-3 py-2 text-xs font-medium text-[#8f9a9e] text-left">Protocol</th>
                <th className="px-3 py-2 text-xs font-medium text-[#8f9a9e] text-left">Category</th>
                <th className="px-3 py-2 text-xs font-medium text-[#8f9a9e] text-left">Chains</th>
                <th className="px-3 py-2 text-xs font-medium text-[#8f9a9e] text-right">Total Fees</th>
                <th className="px-3 py-2 text-xs font-medium text-[#8f9a9e] text-right">Protocol Revenue</th>
                <th className="px-3 py-2 text-xs font-medium text-[#8f9a9e] text-right">Holder Revenue</th>
                <th className="px-3 py-2 text-xs font-medium text-[#8f9a9e] text-right">Holder %</th>
                <th className="px-3 py-2 text-xs font-medium text-[#8f9a9e] text-left w-32">Distribution</th>
              </tr>
            </thead>
            <tbody>
              {protocols.map((p: any) => {
                const fees = p.period_fees || 1;
                const pct = p.holder_pct ?? (p.period_holder_revenue > 0 ? (p.period_holder_revenue / fees) * 100 : 0);
                return (
                  <tr key={p.name} className="border-b border-[#eeeeec] hover:bg-[#f7f7f5] transition-colors">
                    <td className="px-3 py-2.5 text-sm font-medium">
                      <a href={`/ventures/${p.slug}`} className="hover:text-[#32b88d]">{p.name}</a>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-xs text-[#8f9a9e] bg-[#f7f7f5] px-1.5 py-0.5 rounded capitalize">
                        {(p.primary_category || "").replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-[#8f9a9e]">{(p.chains || []).join(", ")}</td>
                    <td className="px-3 py-2.5 text-sm text-right tabular-nums">{formatUSD(p.period_fees, true)}</td>
                    <td className="px-3 py-2.5 text-sm text-right tabular-nums text-[#32b88d]">{formatUSD(p.period_revenue, true)}</td>
                    <td className="px-3 py-2.5 text-sm text-right tabular-nums text-[#32b88d]">{formatUSD(p.period_holder_revenue, true)}</td>
                    <td className="px-3 py-2.5 text-sm text-right tabular-nums">
                      <span className={pct > 0 ? "text-[#32b88d]" : "text-[#8f9a9e]"}>
                        {pct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex h-2 rounded-full overflow-hidden bg-[#f7f7f5]">
                        <div className="bg-[#8f9a9e]" style={{ width: `${((fees - (p.period_revenue || 0)) / fees) * 100}%` }} />
                        <div className="bg-[#32b88d]/50" style={{ width: `${(((p.period_revenue || 0) - (p.period_holder_revenue || 0)) / fees) * 100}%` }} />
                        <div className="bg-[#32b88d]" style={{ width: `${((p.period_holder_revenue || 0) / fees) * 100}%` }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
