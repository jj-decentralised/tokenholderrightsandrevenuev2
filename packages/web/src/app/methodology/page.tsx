import { SourceBadge } from "@/components/ui/SourceBadge";

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
    description: "Revenue minus the cost of token incentives. Shows whether the protocol is profitable after accounting for emission costs. Only ~3 of 7 major Ethereum protocols are positive on this metric.",
    sources: ["DefiLlama (dailyEarnings)"],
    caveats: ["Incentive values based on token price at time of emission"],
  },
  {
    name: "Productive Token Score",
    formula: "Revenue Score + Maturity Score + Growth Score + Concentration Score (each 0-2.5)",
    description: "Composite 0-10 score answering 'how effectively does this token capture and distribute protocol revenue?' Components: Revenue-to-Holders Ratio (what % of fees flows to holders), Mechanism Maturity (how long has the mechanism been active), Holder Growth Trajectory (is holder count growing), Concentration Health (how distributed are holdings).",
    sources: ["DefiLlama", "CoinGecko", "Codex"],
    caveats: ["Subjective component weighting", "Score relative to current universe", "Updated daily"],
  },
  {
    name: "Holder Concentration (Top 10%)",
    formula: "Sum of top 10 holder balances / circulating supply x 100",
    description: "Percentage of token supply held by the top 10 wallets. Lower concentration generally suggests healthier distribution, though exchange wallets may aggregate many underlying holders.",
    sources: ["Codex (holder data)"],
    caveats: ["Exchange wallets represent many users", "Smart contract wallets (staking, governance) skew metrics", "Codex only captures wallets that performed swaps"],
  },
];

export default function MethodologyPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold">Methodology</h1>
        <p className="text-sm text-[#8f9a9e] mt-1">
          Precise metric definitions, data sources, formulas, and caveats for all displayed analytics
        </p>
      </div>

      {/* Data Sources */}
      <section className="bg-white border border-[#e5e5e3] rounded-lg p-5">
        <h2 className="text-base font-medium mb-4">Data Sources</h2>
        <div className="space-y-4">
          {[
            { name: "DefiLlama", role: "Revenue, fees, TVL, treasury, emissions", tier: "Pro API ($300/mo)", freshness: "Daily (revenue), Hourly (TVL)" },
            { name: "CoinGecko", role: "Price, market cap, FDV, supply, developer metrics", tier: "Analyst ($129/mo)", freshness: "5-minute (price), Daily (metrics)" },
            { name: "Codex (Defined.fi)", role: "Holder counts, concentration, wallet classification, DEX trades", tier: "Growth ($350/mo)", freshness: "Daily snapshots, real-time via WebSocket" },
          ].map((source) => (
            <div key={source.name} className="flex items-start gap-4 p-3 bg-[#f7f7f5] rounded">
              <div className="flex-1">
                <div className="text-sm font-medium">{source.name}</div>
                <div className="text-xs text-[#8f9a9e] mt-0.5">{source.role}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[#8f9a9e]">{source.tier}</div>
                <div className="text-xs text-[#8f9a9e]">{source.freshness}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Metric Definitions */}
      <section>
        <h2 className="text-base font-medium mb-4">Metric Definitions</h2>
        <div className="space-y-4">
          {METRICS.map((metric) => (
            <div key={metric.name} className="bg-white border border-[#e5e5e3] rounded-lg p-5">
              <h3 className="text-sm font-semibold mb-2">{metric.name}</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-[#8f9a9e] uppercase">Formula</span>
                  <div className="font-mono text-sm text-[#32b88d] mt-0.5 bg-[#f7f7f5] px-3 py-1.5 rounded">
                    {metric.formula}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-[#8f9a9e] uppercase">Description</span>
                  <p className="text-sm text-[#133c3b] mt-0.5 leading-relaxed">{metric.description}</p>
                </div>
                <div>
                  <span className="text-xs text-[#8f9a9e] uppercase">Sources</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {metric.sources.map((s) => (
                      <span key={s} className="text-xs bg-[#f7f7f5] px-1.5 py-0.5 rounded text-[#8f9a9e]">{s}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-[#8f9a9e] uppercase">Caveats</span>
                  <ul className="mt-1 space-y-0.5">
                    {metric.caveats.map((c, i) => (
                      <li key={i} className="text-xs text-[#8f9a9e] flex items-start gap-1.5">
                        <span className="text-[#a84b2f] mt-0.5">*</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Restatement Policy */}
      <section className="bg-white border border-[#e5e5e3] rounded-lg p-5">
        <h2 className="text-base font-medium mb-3">Restatement Policy</h2>
        <div className="text-sm text-[#8f9a9e] space-y-2 leading-relaxed">
          <p>
            Historical metrics may be revised when data providers update their adapters or correct previously reported values.
            All restatements are logged with timestamps, affected fields, old/new values, and reasons.
          </p>
          <p>
            The restatement log is available via the API at <code className="text-xs bg-[#f7f7f5] px-1 py-0.5 rounded">GET /api/v1/methodology/restatements</code>.
            Material restatements affecting more than 5% of a protocol's reported revenue are flagged in the protocol detail view.
          </p>
        </div>
      </section>
    </div>
  );
}
