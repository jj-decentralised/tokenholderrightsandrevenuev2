import { MetricCard } from "@/components/ui/MetricCard";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { fetchApi, formatUSD } from "@/lib/api";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Mock data (fallback when API is unavailable)                       */
/* ------------------------------------------------------------------ */

const MOCK_REVENUE_DATA = [
  { name: "Hyperliquid", slug: "hyperliquid", primary_category: "Derivatives", chains: ["Hyperliquid L1"], period_fees: 43_800_000, period_revenue: 21_900_000, period_holder_revenue: 11_310_000, holder_pct: 51.6 },
  { name: "Uniswap", slug: "uniswap", primary_category: "DEX", chains: ["Ethereum", "Arbitrum", "Base", "Polygon"], period_fees: 38_500_000, period_revenue: 1_925_000, period_holder_revenue: 770_000, holder_pct: 2.0 },
  { name: "Aave", slug: "aave", primary_category: "Lending", chains: ["Ethereum", "Polygon", "Arbitrum"], period_fees: 33_000_000, period_revenue: 13_200_000, period_holder_revenue: 1_980_000, holder_pct: 6.0 },
  { name: "Lido", slug: "lido", primary_category: "Liquid Staking", chains: ["Ethereum"], period_fees: 28_000_000, period_revenue: 2_800_000, period_holder_revenue: 0, holder_pct: 0 },
  { name: "MakerDAO", slug: "makerdao", primary_category: "CDP", chains: ["Ethereum"], period_fees: 24_600_000, period_revenue: 9_840_000, period_holder_revenue: 7_872_000, holder_pct: 32.0 },
  { name: "dYdX", slug: "dydx", primary_category: "Derivatives", chains: ["dYdX Chain"], period_fees: 26_700_000, period_revenue: 26_700_000, period_holder_revenue: 26_700_000, holder_pct: 100 },
  { name: "GMX", slug: "gmx", primary_category: "Derivatives", chains: ["Arbitrum", "Avalanche"], period_fees: 22_500_000, period_revenue: 6_750_000, period_holder_revenue: 6_750_000, holder_pct: 30.0 },
  { name: "Jupiter", slug: "jupiter", primary_category: "DEX", chains: ["Solana"], period_fees: 28_500_000, period_revenue: 7_125_000, period_holder_revenue: 3_562_500, holder_pct: 12.5 },
];

const MOCK_OVERVIEW = {
  total_fees: 245_600_000,
  total_revenue: 90_240_000,
  total_holder_revenue: 58_944_500,
  protocol_count: 200,
};

/* ------------------------------------------------------------------ */
/*  Data fetcher                                                       */
/* ------------------------------------------------------------------ */

async function getRevenueData() {
  try {
    const data = await fetchApi<RevenueAtlasData>("/revenue/atlas", { range: "30d" });
    return { overview: data.overview, protocols: data.protocols };
  } catch {
    return { overview: MOCK_OVERVIEW, protocols: MOCK_REVENUE_DATA };
  }
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function RevenueAtlasPage() {
  const { overview, protocols } = await getRevenueData();

  const revPctOfFees =
    overview.total_fees > 0
      ? ((overview.total_revenue / overview.total_fees) * 100).toFixed(1)
      : "0";
  const holderPctOfFees =
    overview.total_fees > 0
      ? ((overview.total_holder_revenue / overview.total_fees) * 100).toFixed(1)
      : "0";

  return (
    <div>
      {/* ---- Header ---- */}
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-bold">Revenue Atlas</h1>
          <p className="text-sm text-[#888] italic mt-0.5">
            Protocol revenue breakdown by category, chain, and holder allocation
          </p>
        </div>
        <SourceBadge sources={["DefiLlama"]} />
      </div>

      <hr className="border-t-2 border-[#111] mt-3 mb-6" />

      {/* ---- Overview metrics ---- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-2 mb-8">
        <MetricCard
          title="Total Fees (30D)"
          value={formatUSD(overview.total_fees, true)}
          source="DefiLlama"
        />
        <MetricCard
          title="Total Revenue (30D)"
          value={formatUSD(overview.total_revenue, true)}
          subtitle={`${revPctOfFees}% of fees`}
        />
        <MetricCard
          title="Holder Revenue (30D)"
          value={formatUSD(overview.total_holder_revenue, true)}
          subtitle={`${holderPctOfFees}% of fees`}
        />
        <MetricCard
          title="Protocols Tracked"
          value={`${overview.protocol_count}+`}
        />
      </div>

      {/* ---- Revenue table ---- */}
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="text-lg font-bold">Revenue by Protocol (30D)</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#111]">
              <Th align="left">Protocol</Th>
              <Th align="left">Category</Th>
              <Th align="left">Chains</Th>
              <Th align="right">Total Fees</Th>
              <Th align="right">Protocol Revenue</Th>
              <Th align="right">Holder Revenue</Th>
              <Th align="right">Holder %</Th>
              <Th align="left" w="w-36">Fee Distribution</Th>
            </tr>
          </thead>
          <tbody>
            {protocols.map((p) => {
              const fees = p.period_fees || 1;
              const protocolOnlyRev = Math.max(
                (p.period_revenue || 0) - (p.period_holder_revenue || 0),
                0,
              );
              const costShare = ((fees - (p.period_revenue || 0)) / fees) * 100;
              const protocolShare = (protocolOnlyRev / fees) * 100;
              const holderShare = ((p.period_holder_revenue || 0) / fees) * 100;

              return (
                <tr
                  key={p.slug}
                  className="border-b border-[#e8e8e8] hover:bg-[#f8f7f4] transition-colors"
                >
                  <td className="px-2 py-2.5">
                    <a
                      href={`/ventures/${p.slug}`}
                      className="text-sm font-semibold hover:underline"
                    >
                      {p.name}
                    </a>
                  </td>
                  <td className="px-2 py-2.5 text-xs text-[#888]">
                    {p.primary_category}
                  </td>
                  <td className="px-2 py-2.5 text-xs text-[#888]">
                    {(p.chains || []).join(", ")}
                  </td>
                  <td className="px-2 py-2.5 text-sm text-right tabular-nums">
                    {formatUSD(p.period_fees, true)}
                  </td>
                  <td className="px-2 py-2.5 text-sm text-right tabular-nums">
                    {formatUSD(p.period_revenue, true)}
                  </td>
                  <td className="px-2 py-2.5 text-sm text-right tabular-nums font-semibold">
                    {formatUSD(p.period_holder_revenue, true)}
                  </td>
                  <td className="px-2 py-2.5 text-sm text-right tabular-nums">
                    {p.holder_pct.toFixed(1)}%
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="flex h-[6px] overflow-hidden bg-[#f0f0ee]">
                      {/* Cost / non-revenue portion */}
                      <div
                        className="bg-[#d0d0d0]"
                        style={{ width: `${costShare}%` }}
                        title={`Cost: ${costShare.toFixed(1)}%`}
                      />
                      {/* Protocol treasury portion */}
                      <div
                        className="bg-[#888]"
                        style={{ width: `${protocolShare}%` }}
                        title={`Protocol: ${protocolShare.toFixed(1)}%`}
                      />
                      {/* Holder revenue portion */}
                      <div
                        className="bg-[#111]"
                        style={{ width: `${holderShare}%` }}
                        title={`Holders: ${holderShare.toFixed(1)}%`}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ---- Distribution legend ---- */}
      <div className="flex items-center gap-4 mt-3 text-xs text-[#888]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-[6px] bg-[#d0d0d0]" /> Cost / Supply-Side
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-[6px] bg-[#888]" /> Protocol Treasury
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-[6px] bg-[#111]" /> Holder Revenue
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Table header helper                                                */
/* ------------------------------------------------------------------ */

function Th({
  children,
  align = "right",
  w,
}: {
  children: React.ReactNode;
  align?: "left" | "right" | "center";
  w?: string;
}) {
  const alignClass =
    align === "left" ? "text-left" : align === "center" ? "text-center" : "text-right";
  return (
    <th
      className={`px-2 py-2 italic font-normal text-xs text-[#888] ${alignClass} ${w || ""}`}
    >
      {children}
    </th>
  );
}
