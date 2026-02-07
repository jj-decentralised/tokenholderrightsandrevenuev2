import { SourceBadge } from "@/components/ui/SourceBadge";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";

const MOCK_RIGHTS = [
  { protocol: "dYdX", token: "DYDX", type: "fee_sharing", mechanism: "100% trading fees to stakers", pct: 100, status: "active", since: "2023-10-26", confidence: 0.98 },
  { protocol: "Curve", token: "CRV", type: "ve_model", mechanism: "50% admin fees to veCRV holders", pct: 50, status: "active", since: "2020-09-01", confidence: 0.95 },
  { protocol: "GMX", token: "GMX", type: "fee_sharing", mechanism: "30% fees as ETH/AVAX to stakers", pct: 30, status: "active", since: "2021-09-06", confidence: 0.95 },
  { protocol: "Synthetix", token: "SNX", type: "fee_sharing", mechanism: "sUSD fees from all frontend integrators", pct: 60, status: "active", since: "2020-03-01", confidence: 0.90 },
  { protocol: "Pendle", token: "PENDLE", type: "ve_model", mechanism: "80% swap fees to vePENDLE", pct: 80, status: "active", since: "2023-05-01", confidence: 0.92 },
  { protocol: "MakerDAO", token: "MKR", type: "buyback_burn", mechanism: "Surplus revenue used for MKR burn", pct: 35, status: "active", since: "2020-01-01", confidence: 0.93 },
  { protocol: "Jupiter", token: "JUP", type: "buyback_burn", mechanism: "50% protocol rev for buyback-and-lock", pct: 12.5, status: "active", since: "2024-06-01", confidence: 0.88 },
  { protocol: "Hyperliquid", token: "HYPE", type: "buyback_burn", mechanism: "Revenue-funded buyback via assistance fund", pct: 50, status: "active", since: "2024-11-29", confidence: 0.85 },
  { protocol: "Aave", token: "AAVE", type: "buyback_burn", mechanism: "$1M/week buyback since Apr 2025", pct: 7, status: "active", since: "2025-04-01", confidence: 0.90 },
  { protocol: "Uniswap", token: "UNI", type: "buyback_burn", mechanism: "Fee switch burn via Firepit contract", pct: 2, status: "active", since: "2025-12-01", confidence: 0.88 },
  { protocol: "Ethena", token: "ENA", type: "fee_sharing", mechanism: "Fee switch approved, pending activation", pct: 0, status: "proposed", since: null, confidence: 0.60 },
  { protocol: "Lido", token: "LDO", type: "governance_voting", mechanism: "Governance only, no revenue rights", pct: 0, status: "none", since: null, confidence: 0.95 },
];

export default function RightsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Rights Registry</h1>
          <p className="text-sm text-[#8b949e] mt-1">
            Token holder rights classification, realization status, and evidence tracking
          </p>
        </div>
        <SourceBadge sources={["Manual Research", "On-Chain"]} />
      </div>

      <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr className="border-b border-[#30363d]">
                <th className="px-3 py-2 text-xs font-medium text-[#8b949e] text-left">Protocol</th>
                <th className="px-3 py-2 text-xs font-medium text-[#8b949e] text-left">Token</th>
                <th className="px-3 py-2 text-xs font-medium text-[#8b949e] text-left">Right Type</th>
                <th className="px-3 py-2 text-xs font-medium text-[#8b949e] text-left">Mechanism</th>
                <th className="px-3 py-2 text-xs font-medium text-[#8b949e] text-right">Holder %</th>
                <th className="px-3 py-2 text-xs font-medium text-[#8b949e] text-center">Status</th>
                <th className="px-3 py-2 text-xs font-medium text-[#8b949e] text-center">Since</th>
                <th className="px-3 py-2 text-xs font-medium text-[#8b949e] text-center">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_RIGHTS.map((r) => (
                <tr key={r.token} className="border-b border-[#21262d] hover:bg-[#0d1117] transition-colors">
                  <td className="px-3 py-2.5 text-sm font-medium">{r.protocol}</td>
                  <td className="px-3 py-2.5 text-sm text-[#8b949e]">{r.token}</td>
                  <td className="px-3 py-2.5">
                    <span className="text-xs bg-[#21262d] px-1.5 py-0.5 rounded capitalize">
                      {r.type.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-sm text-[#8b949e] max-w-xs truncate">{r.mechanism}</td>
                  <td className="px-3 py-2.5 text-sm text-right tabular-nums">
                    <span className={r.pct > 0 ? "text-[#3fb950]" : "text-[#8b949e]"}>
                      {r.pct > 0 ? `${r.pct}%` : "\u2014"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`text-xs px-1.5 py-0.5 rounded border ${
                      r.status === "active"
                        ? "text-[#3fb950] border-[#3fb950]/30 bg-[#3fb950]/10"
                        : r.status === "proposed"
                        ? "text-[#d29922] border-[#d29922]/30 bg-[#d29922]/10"
                        : "text-[#8b949e] border-[#8b949e]/30 bg-[#8b949e]/10"
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-center text-[#8b949e]">
                    {r.since || "\u2014"}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <ConfidenceBadge score={r.confidence} />
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
