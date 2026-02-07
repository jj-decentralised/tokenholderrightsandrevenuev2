import { MetricCard } from "@/components/ui/MetricCard";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { ProductiveScore } from "@/components/ui/ProductiveScore";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { formatUSD, formatNumber, formatRatio } from "@/lib/api";

// Mock protocol detail
const MOCK_PROTOCOL = {
  name: "dYdX",
  slug: "dydx",
  category: "derivatives",
  token: "DYDX",
  description: "Decentralized perpetual exchange built on a custom Cosmos appchain.",
  website: "https://dydx.exchange",
  chains: ["dYdX Chain"],
  revenue_24h: 890000,
  revenue_7d: 6230000,
  revenue_30d: 26700000,
  holder_revenue_30d: 26700000,
  holder_pct: 100,
  price: 2.45,
  market_cap: 1200000000,
  fdv: 2450000000,
  real_pe: 3.7,
  yield: 27.1,
  holders: 32000,
  holder_growth_30d: 12.4,
  score: 9.1,
  mechanism_status: "active",
  revenue_history: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split("T")[0],
    daily_fees_usd: 800000 + Math.random() * 200000,
    daily_revenue_usd: 800000 + Math.random() * 200000,
    daily_holders_revenue_usd: 800000 + Math.random() * 200000,
  })),
  rights: [
    { type: "fee_sharing", description: "100% of trading fees distributed to DYDX stakers on the dYdX Chain", percentage: 100, status: "active", since: "2023-10-26" },
  ],
  top_holders: Array.from({ length: 10 }, (_, i) => ({
    rank: i + 1,
    address: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
    balance: 50000000 / (i + 1),
    pct: (5 / (i + 0.5)),
    label: i < 2 ? "Exchange" : i < 4 ? "Whale" : null,
  })),
  financial_statement: {
    months: ["Jan 2026", "Dec 2025", "Nov 2025"],
    rows: [
      { label: "Total Fees", values: [26700000, 24800000, 22300000] },
      { label: "Supply-Side Revenue", values: [0, 0, 0] },
      { label: "Protocol Revenue", values: [26700000, 24800000, 22300000] },
      { label: "Token Incentives", values: [1200000, 1200000, 1500000] },
      { label: "Net Earnings", values: [25500000, 23600000, 20800000] },
      { label: "Holder Revenue", values: [26700000, 24800000, 22300000] },
      { label: "Revenue per Holder", values: [834, 775, 697] },
    ],
  },
};

export default function VentureDetailPage({ params }: { params: { ventureId: string } }) {
  const p = MOCK_PROTOCOL;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{p.name}</h1>
            <span className="text-xs text-[#8f9a9e] bg-[#f7f7f5] px-2 py-0.5 rounded capitalize">{p.category}</span>
            <span className="text-xs text-[#8f9a9e] bg-[#f7f7f5] px-2 py-0.5 rounded">{p.chains.join(", ")}</span>
          </div>
          <p className="text-sm text-[#8f9a9e] max-w-2xl">{p.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <ProductiveScore score={p.score} size="lg" />
          <span className="text-xs text-[#8f9a9e]">/ 10</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <MetricCard title="Revenue (30D)" value={formatUSD(p.revenue_30d, true)} source="DefiLlama" />
        <MetricCard title="Holder Revenue (30D)" value={formatUSD(p.holder_revenue_30d, true)} />
        <MetricCard title="Market Cap" value={formatUSD(p.market_cap, true)} source="CoinGecko" />
        <MetricCard title="Real P/E" value={formatRatio(p.real_pe)} />
        <MetricCard title="Holder Yield" value={`${p.yield.toFixed(1)}%`} />
        <MetricCard title="Holders" value={formatNumber(p.holders, true)} change={p.holder_growth_30d} subtitle="30D" source="Codex" />
      </div>

      {/* Revenue Waterfall */}
      <div className="bg-white border border-[#e5e5e3] rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium">Revenue Waterfall (30D)</h2>
          <SourceBadge sources={["DefiLlama"]} />
        </div>
        <div className="grid grid-cols-5 gap-4 text-center">
          {[
            { label: "Total Fees", value: p.revenue_30d, color: "#8f9a9e", pct: 100 },
            { label: "Supply Side", value: 0, color: "#a84b2f", pct: 0 },
            { label: "Protocol Rev", value: p.revenue_30d, color: "#32b88d", pct: 100 },
            { label: "Incentives", value: 1200000, color: "#c0152f", pct: 4.5 },
            { label: "Holder Revenue", value: p.holder_revenue_30d, color: "#32b88d", pct: 100 },
          ].map((item) => (
            <div key={item.label} className="space-y-2">
              <div className="text-xs text-[#8f9a9e]">{item.label}</div>
              <div
                className="mx-auto rounded"
                style={{
                  width: "48px",
                  height: `${Math.max(20, (item.pct / 100) * 80)}px`,
                  backgroundColor: item.color,
                  opacity: 0.85,
                }}
              />
              <div className="text-sm font-medium tabular-nums">{formatUSD(item.value, true)}</div>
              <div className="text-xs text-[#8f9a9e]">{item.pct.toFixed(1)}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Rights Panel */}
      <div className="bg-white border border-[#e5e5e3] rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium">Token Holder Rights</h2>
          <ConfidenceBadge score={0.95} />
        </div>
        <div className="space-y-3">
          {p.rights.map((r, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-[#f7f7f5] rounded-lg">
              <div className="flex-shrink-0 w-2 h-2 rounded-full mt-1.5 bg-[#32b88d]" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-[#32b88d] uppercase">{r.type.replace("_", " ")}</span>
                  <span className="text-xs text-[#8f9a9e]">Since {r.since}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-[#32b88d]/5 text-[#32b88d] border border-[#32b88d]/20">
                    {r.status}
                  </span>
                </div>
                <p className="text-sm text-[#133c3b]">{r.description}</p>
                {r.percentage && (
                  <span className="text-xs text-[#8f9a9e] mt-1 inline-block">
                    Allocation: {r.percentage}% of protocol revenue
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Statements */}
      <div className="bg-white border border-[#e5e5e3] rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium">Financial Statement (Monthly)</h2>
          <SourceBadge sources={["DefiLlama", "CoinGecko"]} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e5e5e3]">
                <th className="px-3 py-2 text-xs font-medium text-[#8f9a9e] text-left">Line Item</th>
                {p.financial_statement.months.map((m) => (
                  <th key={m} className="px-3 py-2 text-xs font-medium text-[#8f9a9e] text-right">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {p.financial_statement.rows.map((row) => (
                <tr key={row.label} className={`border-b border-[#eeeeec] ${["Protocol Revenue", "Net Earnings", "Holder Revenue"].includes(row.label) ? "font-semibold" : ""}`}>
                  <td className="px-3 py-2 text-sm">{row.label}</td>
                  {row.values.map((v, i) => (
                    <td key={i} className="px-3 py-2 text-sm text-right tabular-nums">
                      {row.label === "Revenue per Holder" ? `$${v.toFixed(0)}` : formatUSD(v, true)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Holders */}
      <div className="bg-white border border-[#e5e5e3] rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium">Top Token Holders</h2>
          <SourceBadge sources={["Codex"]} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e5e5e3]">
                <th className="px-3 py-2 text-xs font-medium text-[#8f9a9e] text-left w-8">#</th>
                <th className="px-3 py-2 text-xs font-medium text-[#8f9a9e] text-left">Address</th>
                <th className="px-3 py-2 text-xs font-medium text-[#8f9a9e] text-left">Label</th>
                <th className="px-3 py-2 text-xs font-medium text-[#8f9a9e] text-right">Balance</th>
                <th className="px-3 py-2 text-xs font-medium text-[#8f9a9e] text-right">% Supply</th>
              </tr>
            </thead>
            <tbody>
              {p.top_holders.map((h) => (
                <tr key={h.rank} className="border-b border-[#eeeeec]">
                  <td className="px-3 py-2 text-xs text-[#8f9a9e]">{h.rank}</td>
                  <td className="px-3 py-2 text-sm font-mono text-[#32b88d]">{h.address}</td>
                  <td className="px-3 py-2">
                    {h.label && (
                      <span className="text-xs bg-[#f7f7f5] px-1.5 py-0.5 rounded text-[#8f9a9e]">{h.label}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-sm text-right tabular-nums">{formatNumber(h.balance, true)}</td>
                  <td className="px-3 py-2 text-sm text-right tabular-nums">{h.pct.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
