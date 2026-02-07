import { MetricCard } from "@/components/ui/MetricCard";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { formatUSD } from "@/lib/api";

const MOCK_REVENUE_DATA = [
  { name: "Hyperliquid", category: "derivatives", chains: ["Hyperliquid L1"], fees: 43800000, revenue: 21900000, holder_revenue: 11310000, pct: 51.6 },
  { name: "Uniswap", category: "dex", chains: ["Ethereum", "Arbitrum", "Base", "+33"], fees: 38500000, revenue: 1925000, holder_revenue: 770000, pct: 2.0 },
  { name: "Aave", category: "lending", chains: ["Ethereum", "Polygon", "Arbitrum"], fees: 33000000, revenue: 13200000, holder_revenue: 1980000, pct: 6.0 },
  { name: "Lido", category: "liquid_staking", chains: ["Ethereum"], fees: 28000000, revenue: 2800000, holder_revenue: 0, pct: 0 },
  { name: "MakerDAO", category: "cdp", chains: ["Ethereum"], fees: 24600000, revenue: 9840000, holder_revenue: 7872000, pct: 32.0 },
  { name: "dYdX", category: "derivatives", chains: ["dYdX Chain"], fees: 26700000, revenue: 26700000, holder_revenue: 26700000, pct: 100 },
  { name: "GMX", category: "derivatives", chains: ["Arbitrum", "Avalanche"], fees: 22500000, revenue: 6750000, holder_revenue: 6750000, pct: 30.0 },
  { name: "Jupiter", category: "dex", chains: ["Solana"], fees: 28500000, revenue: 7125000, holder_revenue: 3562500, pct: 12.5 },
];

export default function RevenueAtlasPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Revenue Atlas</h1>
          <p className="text-sm text-[#8b949e] mt-1">
            Protocol revenue breakdown by category, chain, and holder allocation
          </p>
        </div>
        <SourceBadge sources={["DefiLlama"]} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          title="Total Fees (30D)"
          value={formatUSD(245600000, true)}
          source="DefiLlama"
        />
        <MetricCard
          title="Total Revenue (30D)"
          value={formatUSD(90240000, true)}
          subtitle="36.7% of fees"
        />
        <MetricCard
          title="Holder Revenue (30D)"
          value={formatUSD(58944000, true)}
          subtitle="24.0% of fees"
        />
        <MetricCard
          title="Protocols Tracked"
          value="200+"
        />
      </div>

      {/* Revenue Table */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[#30363d] flex items-center justify-between">
          <h2 className="text-sm font-medium">Revenue by Protocol (30D)</h2>
          <div className="flex items-center gap-2">
            <select className="text-xs bg-[#0d1117] border border-[#30363d] rounded px-2 py-1 text-[#8b949e]">
              <option value="">All Categories</option>
              <option value="dex">DEX</option>
              <option value="lending">Lending</option>
              <option value="derivatives">Derivatives</option>
            </select>
            <button className="text-xs text-[#8b949e] bg-[#21262d] border border-[#30363d] rounded px-2 py-1 hover:text-[#e6edf3]">
              Export CSV
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr className="border-b border-[#30363d]">
                <th className="px-3 py-2 text-xs font-medium text-[#8b949e] text-left">Protocol</th>
                <th className="px-3 py-2 text-xs font-medium text-[#8b949e] text-left">Category</th>
                <th className="px-3 py-2 text-xs font-medium text-[#8b949e] text-left">Chains</th>
                <th className="px-3 py-2 text-xs font-medium text-[#8b949e] text-right">Total Fees</th>
                <th className="px-3 py-2 text-xs font-medium text-[#8b949e] text-right">Protocol Revenue</th>
                <th className="px-3 py-2 text-xs font-medium text-[#8b949e] text-right">Holder Revenue</th>
                <th className="px-3 py-2 text-xs font-medium text-[#8b949e] text-right">Holder %</th>
                <th className="px-3 py-2 text-xs font-medium text-[#8b949e] text-left w-32">Distribution</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_REVENUE_DATA.map((p) => (
                <tr key={p.name} className="border-b border-[#21262d] hover:bg-[#0d1117] transition-colors">
                  <td className="px-3 py-2.5 text-sm font-medium">{p.name}</td>
                  <td className="px-3 py-2.5">
                    <span className="text-xs text-[#8b949e] bg-[#21262d] px-1.5 py-0.5 rounded capitalize">
                      {p.category.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-[#8b949e]">{p.chains.join(", ")}</td>
                  <td className="px-3 py-2.5 text-sm text-right tabular-nums">{formatUSD(p.fees, true)}</td>
                  <td className="px-3 py-2.5 text-sm text-right tabular-nums text-[#58a6ff]">{formatUSD(p.revenue, true)}</td>
                  <td className="px-3 py-2.5 text-sm text-right tabular-nums text-[#3fb950]">{formatUSD(p.holder_revenue, true)}</td>
                  <td className="px-3 py-2.5 text-sm text-right tabular-nums">
                    <span className={p.pct > 0 ? "text-[#3fb950]" : "text-[#8b949e]"}>
                      {p.pct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex h-2 rounded-full overflow-hidden bg-[#21262d]">
                      <div className="bg-[#8b949e]" style={{ width: `${((p.fees - p.revenue) / p.fees) * 100}%` }} />
                      <div className="bg-[#58a6ff]" style={{ width: `${((p.revenue - p.holder_revenue) / p.fees) * 100}%` }} />
                      <div className="bg-[#3fb950]" style={{ width: `${(p.holder_revenue / p.fees) * 100}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
