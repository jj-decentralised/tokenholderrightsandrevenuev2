-- Migration 001: Create enums
-- Up
CREATE TYPE category_enum AS ENUM (
  'dex', 'lending', 'cdp', 'derivatives', 'liquid_staking',
  'liquid_restaking', 'yield', 'yield_aggregator', 'bridge',
  'dex_aggregator', 'options', 'insurance', 'synthetics',
  'rwa', 'prediction_market', 'launchpad', 'stablecoin_issuer',
  'chain', 'nft_marketplace', 'payments', 'services', 'other'
);

CREATE TYPE tokenization_type_enum AS ENUM (
  'tokenized', 'non_tokenized', 'hybrid'
);

CREATE TYPE revenue_mechanism_status_enum AS ENUM (
  'none', 'proposed', 'approved_pending', 'active', 'deprecated'
);

-- Down
DROP TYPE IF EXISTS revenue_mechanism_status_enum;
DROP TYPE IF EXISTS tokenization_type_enum;
DROP TYPE IF EXISTS category_enum;
