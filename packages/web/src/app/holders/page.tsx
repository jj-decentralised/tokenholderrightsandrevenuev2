import { SourceBadge } from "@/components/ui/SourceBadge";
import { formatNumber, formatPercent } from "@/lib/api";

const MOCK_HOLDER_DATA = [
  { name: "Jupiter", token: "JUP", holders: 195000, growth_7d: 3.2, growth_30d: 14.5, top10: 42.1, gini: 0.82, exchange_pct: 28 },
  { name: "Aave", token: "AAVE", holders: 120000, growth_7d: 0.8, growth_30d: 4.2, top10: 38.5, gini: 0.78, exchange_pct: 35 },
  { name: "Curve", token: "CRV", holders: 85000, growth_7d: -0.3, growth_30d: 1.1, top10: 45.2, gini: 0.85, exchange_pct: 22 },
  { name: "Raydium", token: "RAY", holders: 67000, growth_7d: 5.1, growth_30d: 22.3, top10: 51.3, gini: 0.88, exchange_pct: 18 },
  { name: "MakerDAO", token: "MKR", holders: 52000, growth_7d: 0.2, growth_30d: 2.8, top10: 55.7, gini: 0.91, exchange_pct: 31 },
  { name: "Hyperliquid", token: "HYPE", holders: 45000, growth_7d: 8.3, growth_30d: 18.7, top10: 62.4, gini: 0.89, exchange_pct: 12 },
  { name: "Pendle", token: "PENDLE", holders: 42000, growth_7d: 2.7, growth_30d: 11.8, top10: 48.9, gini: 0.84, exchange_pct: 25 },
  { name: "dYdX", token: "DYDX", holders: 32000, growth_7d: 4.1, growth_30d: 12.4, top10: 44.3, gini: 0.83, exchange_pct: 40 },
  { name: "GMX", token: "GMX", holders: 28000, growth_7d: 1.5, growth_30d: 5.2, top10: 39.8, gini: 0.79, exchange_pct: 20 },
  { name: "Synthetix", token: "SNX", holders: 18000, growth_7d: -1.2, growth_30d: -3.4, top10: 52.1, gini: 0.87, exchange_pct: 33 },
];

export default function HoldersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Holder Intelligence Lab</h1>
          <p className="text-sm text-[#8f9a9e] mt-1">
            Token holder distribution, concentration, and behavior analytics
          </p>
        </div>
        <SourceBadge sources={["Codex", "Santiment"]} />
      </div>

      <div className="bg-white border border-[#e5e5e3] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[#e5e5e3] flex items-center justify-between">
          <h2 className="text-sm font-medium">Holder Distribution Overview</h2>
          <button className="text-xs text-[#8f9a9e] bg-[#f7f7f5] border border-[#e5e5e3] rounded px-2 py-1 hover:text-[#133c3b]">
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr className="border-b border-[#e5e5e3]">
                <th className="px-3 py-2 text-xs font-medium text-[#8f9a9e] text-left">Token</th>
                <th className="px-3 py-2 text-xs font-medium text-[#8f9a9e] text-right">Holders</th>
                <th className="px-3 py-2 text-xs font-medium text-[#8f9a9e] text-right">Growth 7D</th>
                <th className="px-3 py-2 text-xs font-medium text-[#8f9a9e] text-right">Growth 30D</th>
                <th className="px-3 py-2 text-xs font-medium text-[#8f9a9e] text-right">Top 10 %</th>
                <th className="px-3 py-2 text-xs font-medium text-[#8f9a9e] text-right">Gini</th>
                <th className="px-3 py-2 text-xs font-medium text-[#8f9a9e] text-right">Exchange %</th>
                <th className="px-3 py-2 text-xs font-medium text-[#8f9a9e] text-left w-32">Concentration</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_HOLDER_DATA.map((h) => (
                <tr key={h.token} className="border-b border-[#eeeeec] hover:bg-[#f7f7f5] cursor-pointer transition-colors">
                  <td className="px-3 py-2.5">
                    <a href={`/holders/${h.token.toLowerCase()}`} className="flex items-center gap-2">
                      <span className="text-sm font-medium hover:text-[#32b88d]">{h.name}</span>
                      <span className="text-xs text-[#8f9a9e]">{h.token}</span>
                    </a>
                  </td>
                  <td className="px-3 py-2.5 text-sm text-right tabular-nums">{formatNumber(h.holders, true)}</td>
                  <td className="px-3 py-2.5 text-sm text-right tabular-nums">
                    <span className={h.growth_7d >= 0 ? "text-[#32b88d]" : "text-[#c0152f]"}>
                      {formatPercent(h.growth_7d)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-sm text-right tabular-nums">
                    <span className={h.growth_30d >= 0 ? "text-[#32b88d]" : "text-[#c0152f]"}>
                      {formatPercent(h.growth_30d)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-sm text-right tabular-nums">{h.top10.toFixed(1)}%</td>
                  <td className="px-3 py-2.5 text-sm text-right tabular-nums">{h.gini.toFixed(2)}</td>
                  <td className="px-3 py-2.5 text-sm text-right tabular-nums">{h.exchange_pct}%</td>
                  <td className="px-3 py-2.5">
                    <div className="flex h-2 rounded-full overflow-hidden bg-[#f7f7f5]">
                      <div className="bg-[#c0152f]" style={{ width: `${h.top10}%` }} title="Top 10" />
                      <div className="bg-[#a84b2f]" style={{ width: `${Math.max(0, 30 - h.top10 * 0.3)}%` }} title="Top 11-50" />
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
