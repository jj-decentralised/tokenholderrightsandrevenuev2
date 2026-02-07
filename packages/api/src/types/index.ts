// ---- Enums ----

export type Category =
  | "dex" | "lending" | "cdp" | "derivatives" | "liquid_staking"
  | "liquid_restaking" | "yield" | "yield_aggregator" | "bridge"
  | "dex_aggregator" | "options" | "insurance" | "synthetics"
  | "rwa" | "prediction_market" | "launchpad" | "stablecoin_issuer"
  | "chain" | "nft_marketplace" | "payments" | "services" | "other";

export type TokenizationType = "tokenized" | "non_tokenized" | "hybrid";

export type RevenueMechanismStatus =
  | "none" | "proposed" | "approved_pending" | "active" | "deprecated";

export type RightType =
  | "governance_voting" | "fee_sharing" | "buyback_burn"
  | "buyback_redistribute" | "ve_model" | "staking_security"
  | "parameter_control" | "treasury_mgmt" | "utility_discount";

export type RevenueSourceType =
  | "trading_fees" | "borrow_interest" | "flash_loan_fees"
  | "liquidation_fees" | "stability_fees" | "staking_commission"
  | "mev_tips" | "minting_fees" | "rwa_yield" | "funding_rates"
  | "bridge_fees" | "token_taxes";

export type RecipientType =
  | "supply_side" | "protocol_treasury" | "token_holders_direct"
  | "token_buyback_burn" | "token_buyback_lock" | "ve_model_fees"
  | "insurance_fund" | "dev_team";

export type TimeRange = "1d" | "7d" | "30d" | "90d" | "1y" | "all";

// ---- Entity Interfaces ----

export interface Protocol {
  id: string;
  name: string;
  slug: string;
  defillama_id: string | null;
  coingecko_id: string | null;
  description: string | null;
  website_url: string | null;
  logo_url: string | null;
  launch_date: string | null;
  is_parent: boolean;
  primary_category: Category | null;
  tokenization_type: TokenizationType;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SubProduct {
  id: string;
  protocol_id: string;
  name: string;
  defillama_slug: string | null;
  category: Category;
  chain: string | null;
  version: string | null;
  status: string;
  launch_date: string | null;
  end_date: string | null;
}

export interface Token {
  id: string;
  symbol: string;
  name: string;
  protocol_id: string | null;
  coingecko_id: string | null;
  primary_chain_id: number | null;
  primary_address: string | null;
  total_supply: number | null;
  max_supply: number | null;
  token_type: string | null;
  has_revenue_rights: boolean;
  revenue_mechanism_status: RevenueMechanismStatus;
  productive_token_score: number | null;
  predecessor_token_id: string | null;
  transition_date: string | null;
}

export interface TokenContract {
  id: string;
  token_id: string;
  chain_id: number;
  chain_name: string;
  contract_address: string;
  decimals: number | null;
  codex_token_id: string | null;
}

export interface TokenRights {
  id: string;
  token_id: string;
  right_type: RightType;
  mechanism_description: string | null;
  percentage_allocation: number | null;
  activation_date: string | null;
  end_date: string | null;
  is_active: boolean;
  conditions: Record<string, unknown> | null;
  source_url: string | null;
  confidence_score: number;
}

// ---- Time Series Interfaces ----

export interface RevenueDaily {
  id: string;
  protocol_id: string;
  date: string;
  daily_fees_usd: number | null;
  daily_user_fees_usd: number | null;
  daily_revenue_usd: number | null;
  daily_protocol_revenue_usd: number | null;
  daily_holders_revenue_usd: number | null;
  daily_supply_side_usd: number | null;
  daily_earnings_usd: number | null;
  daily_incentives_usd: number | null;
  chain_breakdown: Record<string, number> | null;
  product_breakdown: Record<string, number> | null;
}

export interface TokenMarketDaily {
  id: string;
  token_id: string;
  date: string;
  price_usd: number | null;
  market_cap_usd: number | null;
  fdv_usd: number | null;
  circulating_supply: number | null;
  total_volume_usd: number | null;
  price_change_pct_24h: number | null;
}

export interface HolderSnapshot {
  id: string;
  token_contract_id: string;
  token_id: string;
  snapshot_date: string;
  total_holders: number | null;
  top10_pct: number | null;
  top50_pct: number | null;
  top100_pct: number | null;
  gini_coefficient: number | null;
  new_holders_24h: number | null;
}

export interface ComputedMetrics {
  id: string;
  protocol_id: string;
  token_id: string | null;
  date: string;
  ps_ratio: number | null;
  pe_ratio: number | null;
  real_pe_ratio: number | null;
  revenue_yield: number | null;
  revenue_per_holder: number | null;
  annual_revenue_per_holder: number | null;
  holder_revenue_pct: number | null;
  supply_side_pct: number | null;
  treasury_pct: number | null;
  holder_growth_7d: number | null;
  holder_growth_30d: number | null;
  revenue_to_holders_score: number | null;
  holder_growth_score: number | null;
  concentration_score: number | null;
  mechanism_maturity_score: number | null;
  productive_token_score: number | null;
}

// ---- API Response Interfaces ----

export interface DashboardOverview {
  total_fees_24h: number;
  total_revenue_24h: number;
  total_holder_revenue_24h: number;
  protocols_with_fee_sharing: number;
  avg_holder_revenue_yield: number;
  top_protocols: ProtocolSummary[];
  top_movers: {
    highest_yield: ProtocolSummary[];
    fastest_holder_growth: ProtocolSummary[];
  };
}

export interface ProtocolSummary {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_category: Category | null;
  tokenization_type: TokenizationType;
  token_symbol: string | null;
  // Revenue metrics
  fees_24h: number | null;
  fees_7d: number | null;
  fees_30d: number | null;
  revenue_24h: number | null;
  revenue_7d: number | null;
  revenue_30d: number | null;
  holder_revenue_24h: number | null;
  holder_revenue_7d: number | null;
  holder_revenue_30d: number | null;
  // Market metrics
  price_usd: number | null;
  market_cap_usd: number | null;
  fdv_usd: number | null;
  // Computed
  real_pe_ratio: number | null;
  revenue_yield: number | null;
  holder_revenue_pct: number | null;
  productive_token_score: number | null;
  // Holder metrics
  holders_count: number | null;
  holder_growth_30d: number | null;
  // Sparkline
  revenue_sparkline_7d: number[];
}

export interface ProtocolDetail extends ProtocolSummary {
  description: string | null;
  website_url: string | null;
  launch_date: string | null;
  sub_products: SubProduct[];
  token: Token | null;
  rights: TokenRights[];
  revenue_history: RevenueDaily[];
  market_history: TokenMarketDaily[];
  holder_history: HolderSnapshot[];
  computed_history: ComputedMetrics[];
}

export interface RevenueAtlasEntry {
  protocol_id: string;
  name: string;
  slug: string;
  category: Category | null;
  chains: string[];
  fees_usd: number;
  revenue_usd: number;
  holder_revenue_usd: number;
  holder_revenue_pct: number;
  revenue_change_pct: number;
}

export interface HolderIntelligence {
  token_id: string;
  symbol: string;
  protocol_name: string;
  total_holders: number;
  holder_growth_7d: number;
  holder_growth_30d: number;
  top10_concentration: number;
  gini_coefficient: number | null;
  exchange_share: number | null;
  history: HolderSnapshot[];
  top_holders: HolderDetail[];
}

export interface HolderDetail {
  wallet_address: string;
  balance: number;
  balance_usd: number | null;
  pct_of_supply: number;
  first_held_date: string | null;
  wallet_label: string | null;
  rank: number;
}

export interface MethodologyMetric {
  name: string;
  formula: string;
  description: string;
  sources: string[];
  caveats: string[];
}

export interface RestatementEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  reason: string;
  date_affected: string;
  source_provider: string | null;
  created_at: string;
}

// ---- API Query Params ----

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface DashboardQueryParams {
  range?: TimeRange;
}

export interface RevenueAtlasParams extends PaginationParams {
  range?: TimeRange;
  category?: Category;
  chain?: string;
  tokenized?: boolean;
  min_revenue?: number;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
}

export interface ProtocolQueryParams {
  range?: TimeRange;
}

export interface HolderQueryParams {
  range?: TimeRange;
}

export interface ScreenerParams extends PaginationParams {
  category?: Category[];
  chain?: string[];
  has_token?: boolean;
  has_revenue_rights?: boolean;
  min_revenue_24h?: number;
  max_revenue_24h?: number;
  min_real_pe?: number;
  max_real_pe?: number;
  min_holders?: number;
  max_holders?: number;
  min_holder_growth_30d?: number;
  max_holder_growth_30d?: number;
  min_market_cap?: number;
  max_market_cap?: number;
  min_productive_score?: number;
  max_productive_score?: number;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
}
