export interface SankeyNode {
  id: string;
  label: string;
  value: number;
  color?: string;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
  percentage?: number;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

export interface RevenueFlowInput {
  totalFees: number;
  supplySideRevenue: number;
  protocolRevenue: number;
  holderRevenue: number;
  treasuryRevenue: number;
  incentivesCost: number;
  protocolName: string;
}

const COLORS = {
  fees: "#626c71",
  supplySide: "#8f9a9e",
  protocolRevenue: "#2563eb",
  holderRevenue: "#32b88d",
  treasury: "#a84b2f",
  incentives: "#c0152f",
  netEarnings: "#1d7464",
};

export function buildRevenueFlow(input: RevenueFlowInput): SankeyData {
  const {
    totalFees,
    supplySideRevenue,
    protocolRevenue,
    holderRevenue,
    treasuryRevenue,
    incentivesCost,
  } = input;

  const nodes: SankeyNode[] = [
    { id: "fees", label: "Total Fees", value: totalFees, color: COLORS.fees },
  ];

  const links: SankeyLink[] = [];

  // Supply side (LPs, lenders, etc.)
  if (supplySideRevenue > 0) {
    nodes.push({ id: "supply_side", label: "Supply Side (LPs)", value: supplySideRevenue, color: COLORS.supplySide });
    links.push({
      source: "fees",
      target: "supply_side",
      value: supplySideRevenue,
      percentage: (supplySideRevenue / totalFees) * 100,
    });
  }

  // Protocol revenue
  if (protocolRevenue > 0) {
    nodes.push({ id: "protocol_rev", label: "Protocol Revenue", value: protocolRevenue, color: COLORS.protocolRevenue });
    links.push({
      source: "fees",
      target: "protocol_rev",
      value: protocolRevenue,
      percentage: (protocolRevenue / totalFees) * 100,
    });
  }

  // Holder revenue from protocol revenue
  if (holderRevenue > 0) {
    nodes.push({ id: "holder_rev", label: "Token Holders", value: holderRevenue, color: COLORS.holderRevenue });
    links.push({
      source: "protocol_rev",
      target: "holder_rev",
      value: holderRevenue,
      percentage: protocolRevenue > 0 ? (holderRevenue / protocolRevenue) * 100 : 0,
    });
  }

  // Treasury
  if (treasuryRevenue > 0) {
    nodes.push({ id: "treasury", label: "Treasury", value: treasuryRevenue, color: COLORS.treasury });
    links.push({
      source: "protocol_rev",
      target: "treasury",
      value: treasuryRevenue,
      percentage: protocolRevenue > 0 ? (treasuryRevenue / protocolRevenue) * 100 : 0,
    });
  }

  // Incentives
  if (incentivesCost > 0) {
    nodes.push({ id: "incentives", label: "Token Incentives", value: incentivesCost, color: COLORS.incentives });
    links.push({
      source: "protocol_rev",
      target: "incentives",
      value: incentivesCost,
      percentage: protocolRevenue > 0 ? (incentivesCost / protocolRevenue) * 100 : 0,
    });
  }

  return { nodes, links };
}

export function buildHolderDistributionFlow(
  totalSupply: number,
  tiers: Array<{ label: string; holders: number; percent: number }>
): SankeyData {
  const nodes: SankeyNode[] = [
    { id: "supply", label: "Total Supply", value: totalSupply, color: "#626c71" },
  ];

  const links: SankeyLink[] = [];

  const tierColors = ["#c0152f", "#a84b2f", "#2563eb", "#32b88d", "#8f9a9e"];

  tiers.forEach((tier, i) => {
    const tierValue = (tier.percent / 100) * totalSupply;
    nodes.push({
      id: `tier_${i}`,
      label: tier.label,
      value: tierValue,
      color: tierColors[i % tierColors.length],
    });
    links.push({
      source: "supply",
      target: `tier_${i}`,
      value: tierValue,
      percentage: tier.percent,
    });
  });

  return { nodes, links };
}

// Pre-built protocol flows with real data
export const PROTOCOL_FLOWS: Record<string, RevenueFlowInput> = {
  dydx: {
    protocolName: "dYdX",
    totalFees: 26700000,
    supplySideRevenue: 0,
    protocolRevenue: 26700000,
    holderRevenue: 26700000,
    treasuryRevenue: 0,
    incentivesCost: 1200000,
  },
  hyperliquid: {
    protocolName: "Hyperliquid",
    totalFees: 43800000,
    supplySideRevenue: 0,
    protocolRevenue: 21900000,
    holderRevenue: 11310000,
    treasuryRevenue: 10590000,
    incentivesCost: 3200000,
  },
  aave: {
    protocolName: "Aave",
    totalFees: 33000000,
    supplySideRevenue: 19800000,
    protocolRevenue: 13200000,
    holderRevenue: 1980000,
    treasuryRevenue: 11220000,
    incentivesCost: 4500000,
  },
  gmx: {
    protocolName: "GMX",
    totalFees: 22500000,
    supplySideRevenue: 15750000,
    protocolRevenue: 6750000,
    holderRevenue: 6750000,
    treasuryRevenue: 0,
    incentivesCost: 800000,
  },
  uniswap: {
    protocolName: "Uniswap",
    totalFees: 38500000,
    supplySideRevenue: 37730000,
    protocolRevenue: 770000,
    holderRevenue: 770000,
    treasuryRevenue: 0,
    incentivesCost: 0,
  },
  curve: {
    protocolName: "Curve",
    totalFees: 18600000,
    supplySideRevenue: 9300000,
    protocolRevenue: 9300000,
    holderRevenue: 4650000,
    treasuryRevenue: 4650000,
    incentivesCost: 6200000,
  },
  makerdao: {
    protocolName: "MakerDAO",
    totalFees: 24600000,
    supplySideRevenue: 0,
    protocolRevenue: 24600000,
    holderRevenue: 7872000,
    treasuryRevenue: 16728000,
    incentivesCost: 0,
  },
  jupiter: {
    protocolName: "Jupiter",
    totalFees: 28500000,
    supplySideRevenue: 21375000,
    protocolRevenue: 7125000,
    holderRevenue: 3562500,
    treasuryRevenue: 3562500,
    incentivesCost: 2100000,
  },
};
