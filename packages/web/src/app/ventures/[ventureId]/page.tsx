import { MetricCard } from "@/components/ui/MetricCard";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { ProductiveScore } from "@/components/ui/ProductiveScore";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { fetchApi, formatUSD, formatNumber, formatRatio } from "@/lib/api";

interface VentureSummary {
  protocol: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    website_url: string | null;
    logo_url: string | null;
    primary_category: string;
    tokenization_type: string;
  };
  token: {
    symbol: string;
    coingecko_id: string | null;
    has_revenue_rights: boolean;
    revenue_mechanism_status: string;
  } | null;
  revenue: {
    total_fees: number;
    total_revenue: number;
    total_holder_revenue: number;
    total_supply_side: number;
    total_earnings: number;
  };
  market: {
    price_usd: number | null;
    market_cap_usd: number | null;
    fdv_usd: number | null;
  } | null;
  metrics: {
    real_pe_ratio: number | null;
    revenue_yield_pct: number | null;
    productive_token_score: number | null;
    holder_count: number | null;
    holder_growth_30d: number | null;
    revenue_per_holder: number | null;
  } | null;
  rights: Array<{
    right_type: string;
    mechanism_description: string;
    percentage_allocation: number;
    activation_date: string;
    is_active: boolean;
  }>;
  chains: string[];
}

interface RevenueHistory {
  date: string;
  daily_fees_usd: number;
  daily_revenue_usd: number;
  daily_holders_revenue_usd: number;
}

// Fallback mock data
const MOCK_PROTOCOL = {
  name: "dYdX",
  slug: "dydx",
  category: "derivatives",
  token: "DYDX",
  description: "Decentralized perpetual exchange built on a custom Cosmos appchain.",
  website: "https://dydx.exchange",
  chains: ["dYdX Chain"],
  revenue_30d: 26700000,
  holder_revenue_30d: 26700000,
  supply_side_30d: 0,
  earnings_30d: 25500000,
  price: 2.45,
  market_cap: 1200000000,
  fdv: 2450000000,
  real_pe: 3.7,
  yield: 27.1,
  holders: 32000,
  holder_growth_30d: 12.4,
  score: 9.1,
  mechanism_status: "active",
  rights: [
    { type: "fee_sharing", description: "100% of trading fees distributed to DYDX stakers on the dYdX Chain", percentage: 100, status: "active", since: "2023-10-26" },
  ],
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

async function getVentureData(ventureId: string) {
  try {
    const [summary, history] = await Promise.all([
      fetchApi<VentureSummary>(`/ventures/${ventureId}/summary`, { range: "30d" }),
      fetchApi<RevenueHistory[]>(`/ventures/${ventureId}/revenue-history`, { range: "30d" }).catch(() => []),
    ]);
    return { summary, history, useMock: false };
  } catch {
    return { summary: null, history: [], useMock: true };
  }
}

export default async function VentureDetailPage({ params }: { params: { ventureId: string } }) {
  const { summary, history, useMock } = await getVentureData(params.ventureId);

  // Use API data if available, otherwise mock
  const p = useMock ? MOCK_PROTOCOL : {
    name: summary!.protocol.name,
    slug: summary!.protocol.slug,
    category: summary!.protocol.primary_category?.replace(/_/g, " ") || "other",
    token: summary!.token?.symbol || null,
    description: summary!.protocol.description || "",
    website: summary!.protocol.website_url || "",
    chains: summary!.chains || [],
    revenue_30d: summary!.revenue.total_fees,
    holder_revenue_30d: summary!.revenue.total_holder_revenue,
    supply_side_30d: summary!.revenue.total_supply_side || 0,
    earnings_30d: summary!.revenue.total_earnings || 0,
    price: summary!.market?.price_usd || null,
    market_cap: summary!.market?.market_cap_usd || null,
    fdv: summary!.market?.fdv_usd || null,
    real_pe: summary!.metrics?.real_pe_ratio || null,
    yield: summary!.metrics?.revenue_yield_pct || null,
    holders: summary!.metrics?.holder_count || null,
    holder_growth_30d: summary!.metrics?.holder_growth_30d || null,
    score: summary!.metrics?.productive_token_score || null,
    mechanism_status: summary!.token?.revenue_mechanism_status || "none",
    rights: (summary!.rights || []).map((r) => ({
      type: r.right_type,
      description: r.mechanism_description,
      percentage: r.percentage_allocation,
      status: r.is_active ? "active" : "inactive",
      since: r.activation_date,
    })),
    financial_statement: MOCK_PROTOCOL.financial_statement, // Keep mock for now since this requires monthly aggregation
  };

  const protocolRevenue = (p.revenue_30d || 0) - (p.supply_side_30d || 0);
  const incentives = (p.revenue_30d || 0) - (p.earnings_30d || 0) - (p.supply_side_30d || 0);
  const totalFees = p.revenue_30d || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{p.name}</h1>
            <span className="text-xs text-[#8f9a9e] bg-[#f7f7f5] px-2 py-0.5 rounded capitalize">{p.category}</span>
            {p.chains.length > 0 && (
              <span className="text-xs text-[#8f9a9e] bg-[#f7f7f5] px-2 py-0.5 rounded">{p.chains.join(", ")}</span>
            )}
          </div>
          {p.description && <p className="text-sm text-[#8f9a9e] max-w-2xl">{p.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {p.score != null ? (
            <>
              <ProductiveScore score={p.score} size="lg" />
              <span className="text-xs text-[#8f9a9e]">/ 10</span>
            </>
          ) : (
            <span className="text-xs text-[#8f9a9e]">Score pending</span>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <MetricCard title="Revenue (30D)" value={formatUSD(p.revenue_30d, true)} source="DefiLlama" />
        <MetricCard title="Holder Revenue (30D)" value={formatUSD(p.holder_revenue_30d, true)} />
        <MetricCard title="Market Cap" value={formatUSD(p.market_cap, true)} source="CoinGecko" />
        <MetricCard title="Real P/E" value={formatRatio(p.real_pe)} />
        <MetricCard title="Holder Yield" value={p.yield != null ? `${p.yield.toFixed(1)}%` : "—"} />
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
            { label: "Supply Side", value: p.supply_side_30d, color: "#a84b2f", pct: ((p.supply_side_30d || 0) / totalFees) * 100 },
            { label: "Protocol Rev", value: protocolRevenue, color: "#32b88d", pct: (protocolRevenue / totalFees) * 100 },
            { label: "Incentives", value: Math.max(0, incentives), color: "#c0152f", pct: (Math.max(0, incentives) / totalFees) * 100 },
            { label: "Holder Revenue", value: p.holder_revenue_30d, color: "#32b88d", pct: ((p.holder_revenue_30d || 0) / totalFees) * 100 },
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
      {p.rights.length > 0 && (
        <div className="bg-white border border-[#e5e5e3] rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium">Token Holder Rights</h2>
            <ConfidenceBadge score={0.95} />
          </div>
          <div className="space-y-3">
            {p.rights.map((r: any, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-[#f7f7f5] rounded-lg">
                <div className="flex-shrink-0 w-2 h-2 rounded-full mt-1.5 bg-[#32b88d]" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-[#32b88d] uppercase">{(r.type || "").replace(/_/g, " ")}</span>
                    {r.since && <span className="text-xs text-[#8f9a9e]">Since {r.since}</span>}
                    <span className="text-xs px-1.5 py-0.5 rounded bg-[#32b88d]/5 text-[#32b88d] border border-[#32b88d]/20">
                      {r.status}
                    </span>
                  </div>
                  <p className="text-sm text-[#133c3b]">{r.description}</p>
                  {r.percentage > 0 && (
                    <span className="text-xs text-[#8f9a9e] mt-1 inline-block">
                      Allocation: {r.percentage}% of protocol revenue
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                {p.financial_statement.months.map((m: string) => (
                  <th key={m} className="px-3 py-2 text-xs font-medium text-[#8f9a9e] text-right">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {p.financial_statement.rows.map((row: any) => (
                <tr key={row.label} className={`border-b border-[#eeeeec] ${["Protocol Revenue", "Net Earnings", "Holder Revenue"].includes(row.label) ? "font-semibold" : ""}`}>
                  <td className="px-3 py-2 text-sm">{row.label}</td>
                  {row.values.map((v: number, i: number) => (
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
    </div>
  );
}
