import { MetricCard } from "@/components/ui/MetricCard";
import { ProductiveScore } from "@/components/ui/ProductiveScore";
import { formatUSD, formatNumber, formatRatio } from "@/lib/api";

const COMPARE_PROTOCOLS = [
  { name: "dYdX", token: "DYDX", category: "derivatives", fees_30d: 26700000, revenue_30d: 26700000, holder_revenue_30d: 26700000, holder_pct: 100, market_cap: 1200000000, real_pe: 3.7, yield: 27.1, holders: 32000, growth_30d: 12.4, score: 9.1 },
  { name: "GMX", token: "GMX", category: "derivatives", fees_30d: 22500000, revenue_30d: 6750000, holder_revenue_30d: 6750000, holder_pct: 30, market_cap: 800000000, real_pe: 9.7, yield: 10.3, holders: 28000, growth_30d: 5.2, score: 7.8 },
  { name: "Hyperliquid", token: "HYPE", category: "derivatives", fees_30d: 43800000, revenue_30d: 21900000, holder_revenue_30d: 11310000, holder_pct: 51.6, market_cap: 4500000000, real_pe: 14.5, yield: 6.8, holders: 45000, growth_30d: 18.7, score: 8.2 },
];

export default function ComparePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Protocol Comparison</h1>
        <p className="text-sm text-[#8f9a9e] mt-1">Compare revenue, holder economics, and productive scores side by side</p>
      </div>

      {/* Protocol Selection */}
      <div className="flex items-center gap-2 flex-wrap">
        {COMPARE_PROTOCOLS.map((p) => (
          <span key={p.name} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#e5e5e3] rounded-full text-sm">
            {p.name}
            <span className="text-xs text-[#8f9a9e]">{p.token}</span>
          </span>
        ))}
        <button className="px-3 py-1.5 border border-dashed border-[#e5e5e3] rounded-full text-sm text-[#8f9a9e] hover:text-[#133c3b] hover:border-[#8f9a9e]">
          + Add Protocol
        </button>
      </div>

      {/* Comparison Table */}
      <div className="bg-white border border-[#e5e5e3] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e5e5e3]">
                <th className="px-4 py-3 text-xs font-medium text-[#8f9a9e] text-left w-48">Metric</th>
                {COMPARE_PROTOCOLS.map((p) => (
                  <th key={p.name} className="px-4 py-3 text-sm font-medium text-center min-w-[160px]">
                    <div>{p.name}</div>
                    <div className="text-xs text-[#8f9a9e] font-normal">{p.token}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Category", render: (p: typeof COMPARE_PROTOCOLS[0]) => <span className="text-xs bg-[#f7f7f5] px-1.5 py-0.5 rounded capitalize">{p.category}</span> },
                { label: "Total Fees (30D)", render: (p: typeof COMPARE_PROTOCOLS[0]) => formatUSD(p.fees_30d, true) },
                { label: "Protocol Revenue (30D)", render: (p: typeof COMPARE_PROTOCOLS[0]) => <span className="text-[#32b88d]">{formatUSD(p.revenue_30d, true)}</span> },
                { label: "Holder Revenue (30D)", render: (p: typeof COMPARE_PROTOCOLS[0]) => <span className="text-[#32b88d]">{formatUSD(p.holder_revenue_30d, true)}</span> },
                { label: "Holder Revenue %", render: (p: typeof COMPARE_PROTOCOLS[0]) => <span className={p.holder_pct > 0 ? "text-[#32b88d]" : "text-[#8f9a9e]"}>{p.holder_pct.toFixed(1)}%</span> },
                { label: "Market Cap", render: (p: typeof COMPARE_PROTOCOLS[0]) => formatUSD(p.market_cap, true) },
                { label: "Real P/E", render: (p: typeof COMPARE_PROTOCOLS[0]) => formatRatio(p.real_pe) },
                { label: "Holder Revenue Yield", render: (p: typeof COMPARE_PROTOCOLS[0]) => <span className="text-[#32b88d]">{p.yield.toFixed(1)}%</span> },
                { label: "Total Holders", render: (p: typeof COMPARE_PROTOCOLS[0]) => formatNumber(p.holders, true) },
                { label: "Holder Growth (30D)", render: (p: typeof COMPARE_PROTOCOLS[0]) => <span className={p.growth_30d > 0 ? "text-[#32b88d]" : "text-[#c0152f]"}>+{p.growth_30d.toFixed(1)}%</span> },
                { label: "Productive Score", render: (p: typeof COMPARE_PROTOCOLS[0]) => <ProductiveScore score={p.score} /> },
              ].map((row) => (
                <tr key={row.label} className="border-b border-[#eeeeec]">
                  <td className="px-4 py-2.5 text-sm text-[#8f9a9e]">{row.label}</td>
                  {COMPARE_PROTOCOLS.map((p) => (
                    <td key={p.name} className="px-4 py-2.5 text-sm text-center tabular-nums">
                      {row.render(p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
