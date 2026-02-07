import { HolderScatter } from "@/components/charts/HolderScatter";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { formatNumber, formatPercent } from "@/lib/api";

const MOCK_TOKENS = [
  { name: "Jupiter",    slug: "jupiter",    token_symbol: "JUP",    holder_count: 195000, holder_growth_30d: 14.5,  productive_token_score: 7.2, top10_pct: 42.1, gini: 0.82 },
  { name: "Aave",       slug: "aave",       token_symbol: "AAVE",   holder_count: 120000, holder_growth_30d: 4.2,   productive_token_score: 8.1, top10_pct: 38.5, gini: 0.78 },
  { name: "Curve",      slug: "curve",      token_symbol: "CRV",    holder_count: 85000,  holder_growth_30d: 1.1,   productive_token_score: 7.8, top10_pct: 45.2, gini: 0.85 },
  { name: "Raydium",    slug: "raydium",    token_symbol: "RAY",    holder_count: 67000,  holder_growth_30d: 22.3,  productive_token_score: 5.9, top10_pct: 51.3, gini: 0.88 },
  { name: "MakerDAO",   slug: "makerdao",   token_symbol: "MKR",    holder_count: 52000,  holder_growth_30d: 2.8,   productive_token_score: 8.5, top10_pct: 55.7, gini: 0.91 },
  { name: "Hyperliquid",slug: "hyperliquid",token_symbol: "HYPE",   holder_count: 45000,  holder_growth_30d: 18.7,  productive_token_score: 6.4, top10_pct: 62.4, gini: 0.89 },
  { name: "Pendle",     slug: "pendle",     token_symbol: "PENDLE", holder_count: 42000,  holder_growth_30d: 11.8,  productive_token_score: 7.5, top10_pct: 48.9, gini: 0.84 },
  { name: "dYdX",       slug: "dydx",       token_symbol: "DYDX",   holder_count: 32000,  holder_growth_30d: 12.4,  productive_token_score: 8.9, top10_pct: 44.3, gini: 0.83 },
  { name: "GMX",        slug: "gmx",        token_symbol: "GMX",    holder_count: 28000,  holder_growth_30d: 5.2,   productive_token_score: 8.3, top10_pct: 39.8, gini: 0.79 },
  { name: "Synthetix",  slug: "synthetix",  token_symbol: "SNX",    holder_count: 18000,  holder_growth_30d: -3.4,  productive_token_score: 6.1, top10_pct: 52.1, gini: 0.87 },
];

export default function HoldersPage() {
  const scatterData = MOCK_TOKENS.map((t) => ({
    name: t.name,
    slug: t.slug,
    holder_count: t.holder_count,
    holder_growth_30d: t.holder_growth_30d,
    productive_token_score: t.productive_token_score,
  }));

  return (
    <div>
      {/* Header */}
      <div className="flex items-baseline justify-between mb-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Holder Intelligence</h1>
          <p className="text-sm text-[#888] italic mt-0.5">
            Distribution, concentration, and growth analytics across productive token ecosystems
          </p>
        </div>
        <SourceBadge sources={["Codex", "Santiment"]} />
      </div>

      <hr className="rule-heavy mt-3 mb-6" />

      {/* Scatter chart */}
      <HolderScatter tokens={scatterData} height={380} />

      <hr className="rule-heavy mt-8 mb-6" />

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#111]">
              <th className="py-2 pr-4 text-left text-xs font-semibold italic text-[#444] uppercase tracking-wide">Token</th>
              <th className="py-2 px-4 text-right text-xs font-semibold italic text-[#444] uppercase tracking-wide">Holders</th>
              <th className="py-2 px-4 text-right text-xs font-semibold italic text-[#444] uppercase tracking-wide">Growth 30D</th>
              <th className="py-2 px-4 text-right text-xs font-semibold italic text-[#444] uppercase tracking-wide">Top 10 %</th>
              <th className="py-2 px-4 text-right text-xs font-semibold italic text-[#444] uppercase tracking-wide">Gini</th>
              <th className="py-2 pl-4 text-right text-xs font-semibold italic text-[#444] uppercase tracking-wide">Score</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_TOKENS.map((t) => (
              <tr key={t.token_symbol} className="border-b border-[#e8e8e8] hover:bg-[#fafaf8] transition-colors">
                <td className="py-2.5 pr-4">
                  <span className="text-sm font-bold text-[#111]">{t.name}</span>
                  <span className="text-xs text-[#888] ml-2">{t.token_symbol}</span>
                </td>
                <td className="py-2.5 px-4 text-sm text-right tabular-nums">
                  {formatNumber(t.holder_count, true)}
                </td>
                <td className="py-2.5 px-4 text-sm text-right tabular-nums">
                  <span className={t.holder_growth_30d >= 0 ? "text-positive" : "text-negative"}>
                    {formatPercent(t.holder_growth_30d)}
                  </span>
                </td>
                <td className="py-2.5 px-4 text-sm text-right tabular-nums">
                  {t.top10_pct.toFixed(1)}%
                </td>
                <td className="py-2.5 px-4 text-sm text-right tabular-nums">
                  {t.gini.toFixed(2)}
                </td>
                <td className="py-2.5 pl-4 text-sm text-right tabular-nums font-semibold">
                  {t.productive_token_score.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
