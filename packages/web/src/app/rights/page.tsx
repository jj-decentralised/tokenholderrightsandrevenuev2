import { SourceBadge } from "@/components/ui/SourceBadge";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";

const MOCK_RIGHTS = [
  { symbol: "DYDX",   protocol: "dYdX",       right_type: "fee_sharing",      mechanism: "100% of trading fees distributed to DYDX stakers",          percentage_allocation: 100,  is_active: true,  confidence_score: 0.98 },
  { symbol: "CRV",    protocol: "Curve",       right_type: "ve_model",         mechanism: "50% of admin fees to veCRV holders, proportional to lock",  percentage_allocation: 50,   is_active: true,  confidence_score: 0.95 },
  { symbol: "PENDLE", protocol: "Pendle",      right_type: "ve_model",         mechanism: "80% of swap fees directed to vePENDLE holders",             percentage_allocation: 80,   is_active: true,  confidence_score: 0.92 },
  { symbol: "GMX",    protocol: "GMX",         right_type: "fee_sharing",      mechanism: "30% of platform fees paid as ETH/AVAX to stakers",          percentage_allocation: 30,   is_active: true,  confidence_score: 0.95 },
  { symbol: "SNX",    protocol: "Synthetix",   right_type: "staking_rewards",  mechanism: "sUSD trading fees distributed to SNX stakers weekly",       percentage_allocation: 60,   is_active: true,  confidence_score: 0.90 },
  { symbol: "MKR",    protocol: "MakerDAO",    right_type: "buyback",          mechanism: "Surplus protocol revenue funds ongoing MKR buyback-burn",   percentage_allocation: 35,   is_active: true,  confidence_score: 0.93 },
  { symbol: "HYPE",   protocol: "Hyperliquid", right_type: "buyback",          mechanism: "Revenue-funded buyback via the assistance fund",            percentage_allocation: 50,   is_active: true,  confidence_score: 0.85 },
  { symbol: "ENA",    protocol: "Ethena",      right_type: "fee_sharing",      mechanism: "Fee switch approved by governance, pending activation",     percentage_allocation: 0,    is_active: false, confidence_score: 0.60 },
];

function formatRightType(type: string): string {
  return type.replace(/_/g, " ");
}

export default function RightsPage() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-baseline justify-between mb-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Token Rights Registry</h1>
          <p className="text-sm text-[#888] italic mt-0.5">
            Tracking revenue-sharing mechanisms, buyback programs, and staking entitlements across protocols
          </p>
        </div>
        <SourceBadge sources={["Manual Research", "On-Chain"]} />
      </div>

      <hr className="rule-heavy mt-3 mb-6" />

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#111]">
              <th className="py-2 pr-4 text-left text-xs font-semibold italic text-[#444] uppercase tracking-wide">Token</th>
              <th className="py-2 px-4 text-left text-xs font-semibold italic text-[#444] uppercase tracking-wide">Protocol</th>
              <th className="py-2 px-4 text-left text-xs font-semibold italic text-[#444] uppercase tracking-wide">Right Type</th>
              <th className="py-2 px-4 text-left text-xs font-semibold italic text-[#444] uppercase tracking-wide">Mechanism</th>
              <th className="py-2 px-4 text-right text-xs font-semibold italic text-[#444] uppercase tracking-wide">Allocation %</th>
              <th className="py-2 px-4 text-center text-xs font-semibold italic text-[#444] uppercase tracking-wide">Status</th>
              <th className="py-2 pl-4 text-right text-xs font-semibold italic text-[#444] uppercase tracking-wide">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_RIGHTS.map((r) => (
              <tr key={r.symbol} className="border-b border-[#e8e8e8] hover:bg-[#fafaf8] transition-colors">
                <td className="py-2.5 pr-4 text-sm font-bold text-[#111]">
                  {r.symbol}
                </td>
                <td className="py-2.5 px-4 text-sm text-[#444]">
                  {r.protocol}
                </td>
                <td className="py-2.5 px-4 text-sm capitalize text-[#444]">
                  {formatRightType(r.right_type)}
                </td>
                <td className="py-2.5 px-4 text-sm text-[#888] max-w-md">
                  {r.mechanism}
                </td>
                <td className="py-2.5 px-4 text-sm text-right tabular-nums">
                  {r.percentage_allocation > 0 ? `${r.percentage_allocation}%` : "\u2014"}
                </td>
                <td className="py-2.5 px-4 text-sm text-center italic">
                  {r.is_active ? (
                    <span className="text-positive">Active</span>
                  ) : (
                    <span className="text-[#888]">Inactive</span>
                  )}
                </td>
                <td className="py-2.5 pl-4 text-right">
                  <ConfidenceBadge score={r.confidence_score} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
