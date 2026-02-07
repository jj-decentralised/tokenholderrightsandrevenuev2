const METRICS = [
  {
    name: "Real P/E Ratio",
    formula: "Market Cap / Annualized Holder Revenue",
    description: "Market capitalization divided by annualized revenue flowing to token holders. Unlike traditional P/E which uses total protocol revenue, Real P/E reflects only the value token holders actually receive. A lower ratio indicates better value relative to holder distributions.",
    sources: ["CoinGecko (market cap)", "DefiLlama (dailyHoldersRevenue)"],
    caveats: ["Annualization uses trailing 30-day average x 365", "Infinite when holder revenue is zero", "Does not account for token emissions dilution"],
  },
  {
    name: "Holder Revenue Yield",
    formula: "(Annualized Holder Revenue / Market Cap) x 100",
    description: "The effective 'dividend yield' of a token. What percentage return holders receive annually from protocol revenue distributions. Analogous to dividend yield in traditional equities.",
    sources: ["CoinGecko (market cap)", "DefiLlama (dailyHoldersRevenue)"],
    caveats: ["Based on aggregate calculation, not per-token", "Actual per-holder yield depends on stake amount and lock period"],
  },
  {
    name: "Revenue Per Holder",
    formula: "Daily Holder Revenue / Total Holders",
    description: "Daily token holder revenue divided by total unique holder count. Indicates whether value accrual is meaningful per capita or diluted across a large holder base.",
    sources: ["DefiLlama (holder revenue)", "Codex (holder count)"],
    caveats: ["Assumes equal distribution", "Actual amounts depend on balance and staking status", "Codex only tracks wallets that have performed swaps"],
  },
  {
    name: "Revenue Efficiency",
    formula: "(Holder Revenue / Total Fees) x 100",
    description: "Percentage of total fees flowing through the protocol that reaches token holders. Measures the protocol's commitment to sharing value with governance token holders.",
    sources: ["DefiLlama (dailyFees, dailyHoldersRevenue)"],
    caveats: ["Does not capture indirect value like governance power"],
  },
  {
    name: "Net Earnings",
    formula: "Protocol Revenue - Token Incentive Emissions",
    description: "Revenue minus the cost of token incentives. Shows whether the protocol is profitable after accounting for emission costs.",
    sources: ["DefiLlama (dailyEarnings)"],
    caveats: ["Incentive values based on token price at time of emission"],
  },
  {
    name: "Productive Token Score",
    formula: "Revenue Score + Maturity Score + Growth Score + Concentration Score (each 0\u20132.5)",
    description: "Composite 0\u201310 score answering \u2018how effectively does this token capture and distribute protocol revenue?\u2019 Components: Revenue-to-Holders Ratio, Mechanism Maturity, Holder Growth Trajectory, Concentration Health.",
    sources: ["DefiLlama", "CoinGecko", "Codex"],
    caveats: ["Subjective component weighting", "Score relative to current universe", "Updated daily"],
  },
  {
    name: "Holder Concentration (Top 10%)",
    formula: "Sum of top 10 holder balances / circulating supply x 100",
    description: "Percentage of token supply held by the top 10 wallets. Lower concentration generally suggests healthier distribution, though exchange wallets may aggregate many underlying holders.",
    sources: ["Codex (holder data)"],
    caveats: ["Exchange wallets represent many users", "Smart contract wallets (staking, governance) skew metrics"],
  },
];

const SOURCES = [
  { name: "DefiLlama", role: "Revenue, fees, TVL, treasury, emissions", tier: "Pro API", freshness: "Daily (revenue), Hourly (TVL)" },
  { name: "CoinGecko", role: "Price, market cap, FDV, supply, developer metrics", tier: "Analyst API", freshness: "5-minute (price), Daily (metrics)" },
  { name: "Codex (Defined.fi)", role: "Holder counts, concentration, wallet classification", tier: "Growth API", freshness: "Daily snapshots" },
];

export default function MethodologyPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-1">Methodology</h1>
      <p className="text-sm text-[#888] italic mb-6">
        Metric definitions, data sources, formulas, and caveats for all displayed analytics
      </p>

      {/* Data Sources */}
      <hr className="rule-heavy mb-4" />
      <h2 className="text-lg font-semibold mb-4">Data Sources</h2>
      <table className="w-full mb-10">
        <thead>
          <tr className="border-b-2 border-[#111]">
            <th className="text-left text-xs text-[#888] font-normal italic py-2 px-2">Provider</th>
            <th className="text-left text-xs text-[#888] font-normal italic py-2 px-2">Coverage</th>
            <th className="text-left text-xs text-[#888] font-normal italic py-2 px-2">Tier</th>
            <th className="text-left text-xs text-[#888] font-normal italic py-2 px-2">Freshness</th>
          </tr>
        </thead>
        <tbody>
          {SOURCES.map((s) => (
            <tr key={s.name} className="border-b border-[#e8e8e8]">
              <td className="py-2 px-2 text-sm font-semibold">{s.name}</td>
              <td className="py-2 px-2 text-sm text-[#444]">{s.role}</td>
              <td className="py-2 px-2 text-xs text-[#888]">{s.tier}</td>
              <td className="py-2 px-2 text-xs text-[#888]">{s.freshness}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Metric Definitions */}
      <hr className="rule-heavy mb-4" />
      <h2 className="text-lg font-semibold mb-6">Metric Definitions</h2>
      <div className="space-y-8">
        {METRICS.map((metric) => (
          <article key={metric.name} className="pb-6 border-b border-[#e8e8e8]">
            <h3 className="text-base font-bold mb-2">{metric.name}</h3>
            <p className="text-sm font-mono text-[#444] bg-[#f8f7f4] px-3 py-1.5 mb-3 border-l-2 border-[#111]">
              {metric.formula}
            </p>
            <p className="text-sm leading-relaxed mb-3">{metric.description}</p>
            <div className="text-xs text-[#888] mb-2">
              <span className="italic">Sources:</span> {metric.sources.join(" \u00B7 ")}
            </div>
            <div className="text-xs text-[#888]">
              <span className="italic">Caveats:</span>
              <ul className="mt-1 ml-4 list-disc space-y-0.5">
                {metric.caveats.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>

      {/* Restatement Policy */}
      <hr className="rule-heavy mb-4 mt-10" />
      <h2 className="text-lg font-semibold mb-3">Restatement Policy</h2>
      <div className="text-sm text-[#444] space-y-3 leading-relaxed">
        <p>
          Historical metrics may be revised when data providers update their adapters or correct previously reported values.
          All restatements are logged with timestamps, affected fields, old/new values, and reasons.
        </p>
        <p>
          The restatement log is available via the API at{" "}
          <code className="text-xs font-mono bg-[#f8f7f4] px-1.5 py-0.5">GET /api/v1/methodology/restatements</code>.
          Material restatements affecting more than 5% of a protocol&apos;s reported revenue are flagged in the protocol detail view.
        </p>
      </div>
    </div>
  );
}
