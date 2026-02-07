import { SourceBadge } from "@/components/ui/SourceBadge";
import { ProductiveScore } from "@/components/ui/ProductiveScore";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { RevenueLineSeries } from "@/components/charts/RevenueLineSeries";
import { fetchApi, formatUSD, formatNumber, formatRatio } from "@/lib/api";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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
  revenue_summary: {
    total_fees: number;
    total_revenue: number;
    total_holder_revenue: number;
    total_supply_side: number;
    total_earnings: number;
  };
  latest_market: {
    price_usd: number | null;
    market_cap_usd: number | null;
    fdv_usd: number | null;
  } | null;
  latest_metrics: {
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

/* ------------------------------------------------------------------ */
/*  Mock fallback data                                                 */
/* ------------------------------------------------------------------ */

const MOCK_SUMMARY: VentureSummary = {
  protocol: {
    id: "mock-dydx",
    name: "dYdX",
    slug: "dydx",
    description:
      "Decentralized perpetual exchange built on a custom Cosmos appchain. All trading fees accrue to DYDX stakers, making it the purest revenue-sharing model in DeFi.",
    website_url: "https://dydx.exchange",
    logo_url: null,
    primary_category: "derivatives",
    tokenization_type: "governance_and_revenue",
  },
  token: {
    symbol: "DYDX",
    coingecko_id: "dydx",
    has_revenue_rights: true,
    revenue_mechanism_status: "active",
  },
  revenue_summary: {
    total_fees: 26_700_000,
    total_revenue: 26_700_000,
    total_holder_revenue: 26_700_000,
    total_supply_side: 0,
    total_earnings: 25_500_000,
  },
  latest_market: {
    price_usd: 2.45,
    market_cap_usd: 1_200_000_000,
    fdv_usd: 2_450_000_000,
  },
  latest_metrics: {
    real_pe_ratio: 3.7,
    revenue_yield_pct: 27.1,
    productive_token_score: 9.1,
    holder_count: 32_000,
    holder_growth_30d: 12.4,
    revenue_per_holder: 834,
  },
  rights: [
    {
      right_type: "fee_sharing",
      mechanism_description:
        "100% of trading fees distributed to DYDX stakers on the dYdX Chain",
      percentage_allocation: 100,
      activation_date: "2023-10-26",
      is_active: true,
    },
  ],
  chains: ["dYdX Chain"],
};

const MOCK_HISTORY: RevenueHistory[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  const base = 800_000 + Math.random() * 400_000;
  return {
    date: d.toISOString().slice(0, 10),
    daily_fees_usd: base,
    daily_revenue_usd: base,
    daily_holders_revenue_usd: base * 0.95,
  };
});

/* ------------------------------------------------------------------ */
/*  Data fetching                                                      */
/* ------------------------------------------------------------------ */

async function getVentureData(ventureId: string) {
  try {
    const [summary, history] = await Promise.all([
      fetchApi<VentureSummary>(`/ventures/${ventureId}/summary`, {
        range: "30d",
      }),
      fetchApi<RevenueHistory[]>(`/ventures/${ventureId}/revenue-history`, {
        range: "365d",
      }).catch(() => [] as RevenueHistory[]),
    ]);
    return { summary, history, useMock: false };
  } catch {
    return { summary: MOCK_SUMMARY, history: MOCK_HISTORY, useMock: true };
  }
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function VentureDetailPage({
  params,
}: {
  params: { ventureId: string };
}) {
  const { summary, history, useMock } = await getVentureData(params.ventureId);
  const s = summary!;

  const fees30d = s.revenue_summary.total_fees;
  const revenue30d = s.revenue_summary.total_revenue;
  const holderRevenue30d = s.revenue_summary.total_holder_revenue;
  const supplySide30d = s.revenue_summary.total_supply_side;
  const earnings30d = s.revenue_summary.total_earnings;
  const protocolRevenue = fees30d - supplySide30d;
  const incentives = Math.max(0, protocolRevenue - earnings30d);

  const category = (s.protocol.primary_category || "").replace(/_/g, " ");
  const chains = s.chains ?? [];

  return (
    <article
      className="max-w-4xl mx-auto px-6 py-10"
      style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
    >
      {/* ── HEADER ────────────────────────────────────────────── */}
      <header>
        <h1
          className="text-3xl font-bold tracking-tight"
          style={{ color: "#111" }}
        >
          {s.protocol.name}
        </h1>

        <p className="mt-1 text-sm" style={{ color: "#555" }}>
          <span className="capitalize">{category}</span>
          {chains.length > 0 && (
            <>
              {" "}
              &middot;{" "}
              <span>{chains.join(", ")}</span>
            </>
          )}
          {s.token && (
            <>
              {" "}
              &middot; <span className="font-semibold">{s.token.symbol}</span>
            </>
          )}
        </p>

        {s.protocol.description && (
          <p className="mt-3 text-base italic leading-relaxed" style={{ color: "#444", maxWidth: "640px" }}>
            {s.protocol.description}
          </p>
        )}
      </header>

      {/* ── KEY METRICS STRIP ─────────────────────────────────── */}
      <hr
        className="rule-heavy"
        style={{
          border: "none",
          borderTop: "3px double #111",
          marginTop: "1.5rem",
          marginBottom: "1rem",
        }}
      />

      <div
        className="flex flex-wrap items-baseline gap-x-4 gap-y-2 text-sm"
        style={{ fontVariantNumeric: "tabular-nums lining-nums" }}
      >
        <KeyMetric label="Total Fees (30D)" value={formatUSD(fees30d, true)} />
        <Pipe />
        <KeyMetric label="Revenue" value={formatUSD(revenue30d, true)} />
        <Pipe />
        <KeyMetric label="Holder Revenue" value={formatUSD(holderRevenue30d, true)} />
        <Pipe />
        <KeyMetric
          label="Market Cap"
          value={formatUSD(s.latest_market?.market_cap_usd, true)}
        />
        <Pipe />
        <KeyMetric
          label="Real P/E"
          value={formatRatio(s.latest_metrics?.real_pe_ratio)}
        />
        <Pipe />
        <KeyMetric
          label="Yield %"
          value={
            s.latest_metrics?.revenue_yield_pct != null
              ? `${s.latest_metrics.revenue_yield_pct.toFixed(1)}%`
              : "\u2014"
          }
        />
        <Pipe />
        <span>
          <span className="italic" style={{ color: "#888" }}>
            Productive Score{" "}
          </span>
          <ProductiveScore
            score={s.latest_metrics?.productive_token_score ?? null}
            size="sm"
          />
          <span style={{ color: "#888" }}>/10</span>
        </span>
        <Pipe />
        <KeyMetric
          label="Holders"
          value={formatNumber(s.latest_metrics?.holder_count, true)}
        />
      </div>

      <div className="mt-1">
        <SourceBadge sources={["DefiLlama", "CoinGecko", "Codex"]} />
      </div>

      {/* ── REVENUE HISTORY CHART ─────────────────────────────── */}
      <hr
        className="rule-heavy"
        style={{
          border: "none",
          borderTop: "3px double #111",
          marginTop: "2rem",
          marginBottom: "1.5rem",
        }}
      />

      <section>
        <RevenueLineSeries data={history} height={340} title="Revenue History" />
      </section>

      {/* ── REVENUE BREAKDOWN TABLE ───────────────────────────── */}
      <hr
        className="rule-heavy"
        style={{
          border: "none",
          borderTop: "3px double #111",
          marginTop: "2.5rem",
          marginBottom: "1.5rem",
        }}
      />

      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-xl font-bold" style={{ color: "#111" }}>
            Financial Statement
          </h2>
          <SourceBadge sources={["DefiLlama"]} />
        </div>

        <table className="w-full" style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #111" }}>
              <th
                className="text-left text-xs font-normal italic px-0 py-2"
                style={{ color: "#888" }}
              >
                Line Item
              </th>
              <th
                className="text-right text-xs font-normal italic px-0 py-2"
                style={{ color: "#888" }}
              >
                30-Day Total
              </th>
              <th
                className="text-right text-xs font-normal italic px-0 py-2"
                style={{ color: "#888" }}
              >
                % of Fees
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              {
                label: "Total Fees",
                value: fees30d,
                bold: true,
              },
              {
                label: "Supply-Side Revenue",
                value: supplySide30d,
                bold: false,
              },
              {
                label: "Protocol Revenue",
                value: protocolRevenue,
                bold: true,
              },
              {
                label: "Token Incentives",
                value: incentives,
                bold: false,
              },
              {
                label: "Net Earnings",
                value: earnings30d,
                bold: true,
              },
              {
                label: "Holder Revenue",
                value: holderRevenue30d,
                bold: true,
              },
            ].map((row) => {
              const pct = fees30d > 0 ? (row.value / fees30d) * 100 : 0;
              return (
                <tr
                  key={row.label}
                  className="hover:bg-[#f8f7f4]"
                  style={{ borderBottom: "1px solid #e8e8e8" }}
                >
                  <td
                    className={`text-sm px-0 py-2 ${row.bold ? "font-bold" : ""}`}
                    style={{ color: "#111" }}
                  >
                    {row.label}
                  </td>
                  <td
                    className={`text-sm text-right px-0 py-2 ${row.bold ? "font-bold" : ""}`}
                    style={{ color: "#111" }}
                  >
                    {formatUSD(row.value, true)}
                  </td>
                  <td
                    className="text-sm text-right px-0 py-2"
                    style={{ color: "#888" }}
                  >
                    {pct.toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {s.latest_metrics?.revenue_per_holder != null && (
          <p className="mt-3 text-sm" style={{ color: "#555" }}>
            <span className="italic">Revenue per holder: </span>
            <span className="font-bold" style={{ fontVariantNumeric: "tabular-nums" }}>
              {formatUSD(s.latest_metrics.revenue_per_holder)}
            </span>
            <span className="italic"> (30D, annualized)</span>
          </p>
        )}
      </section>

      {/* ── TOKEN RIGHTS ──────────────────────────────────────── */}
      {s.rights.length > 0 && (
        <>
          <hr
            className="rule-heavy"
            style={{
              border: "none",
              borderTop: "3px double #111",
              marginTop: "2.5rem",
              marginBottom: "1.5rem",
            }}
          />

          <section>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-xl font-bold" style={{ color: "#111" }}>
                Token Holder Rights
              </h2>
              <ConfidenceBadge score={0.95} />
            </div>

            <table className="w-full" style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #111" }}>
                  <th
                    className="text-left text-xs font-normal italic px-0 py-2"
                    style={{ color: "#888" }}
                  >
                    Right
                  </th>
                  <th
                    className="text-left text-xs font-normal italic px-0 py-2"
                    style={{ color: "#888" }}
                  >
                    Description
                  </th>
                  <th
                    className="text-right text-xs font-normal italic px-0 py-2"
                    style={{ color: "#888" }}
                  >
                    Allocation
                  </th>
                  <th
                    className="text-right text-xs font-normal italic px-0 py-2"
                    style={{ color: "#888" }}
                  >
                    Since
                  </th>
                  <th
                    className="text-right text-xs font-normal italic px-0 py-2"
                    style={{ color: "#888" }}
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {s.rights.map((r, i) => (
                  <tr
                    key={i}
                    className="hover:bg-[#f8f7f4]"
                    style={{ borderBottom: "1px solid #e8e8e8" }}
                  >
                    <td className="text-sm px-0 py-2 font-semibold capitalize" style={{ color: "#111" }}>
                      {r.right_type.replace(/_/g, " ")}
                    </td>
                    <td className="text-sm px-0 py-2 pr-4" style={{ color: "#333" }}>
                      {r.mechanism_description}
                    </td>
                    <td className="text-sm text-right px-0 py-2" style={{ color: "#111" }}>
                      {r.percentage_allocation > 0
                        ? `${r.percentage_allocation}%`
                        : "\u2014"}
                    </td>
                    <td className="text-sm text-right px-0 py-2" style={{ color: "#555" }}>
                      {r.activation_date || "\u2014"}
                    </td>
                    <td className="text-sm text-right px-0 py-2 italic" style={{ color: "#555" }}>
                      {r.is_active ? "active" : "inactive"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      {/* ── FOOTER RULE ───────────────────────────────────────── */}
      <hr
        style={{
          border: "none",
          borderTop: "1px solid #ccc",
          marginTop: "3rem",
          marginBottom: "1rem",
        }}
      />
      <p className="text-xs italic" style={{ color: "#888" }}>
        Data sourced from DefiLlama, CoinGecko, and Codex.
        {useMock && " Displaying sample data \u2014 live API unavailable."}
      </p>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  Inline helper components                                           */
/* ------------------------------------------------------------------ */

function KeyMetric({ label, value }: { label: string; value: string }) {
  return (
    <span>
      <span className="italic" style={{ color: "#888" }}>
        {label}{" "}
      </span>
      <span className="font-bold" style={{ color: "#111" }}>
        {value}
      </span>
    </span>
  );
}

function Pipe() {
  return (
    <span className="select-none" style={{ color: "#ccc" }}>
      |
    </span>
  );
}
