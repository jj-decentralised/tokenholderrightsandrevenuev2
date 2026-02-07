-- Migration 004: Time-series fact tables
-- Up
CREATE TABLE revenue_daily (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id     UUID NOT NULL REFERENCES protocol(id),
  date            DATE NOT NULL,
  daily_fees_usd          NUMERIC,
  daily_user_fees_usd     NUMERIC,
  daily_revenue_usd       NUMERIC,
  daily_protocol_revenue_usd NUMERIC,
  daily_holders_revenue_usd  NUMERIC,
  daily_supply_side_usd   NUMERIC,
  daily_earnings_usd      NUMERIC,
  daily_incentives_usd    NUMERIC,
  chain_breakdown         JSONB,
  product_breakdown       JSONB,
  source_provider         VARCHAR(50) NOT NULL DEFAULT 'defillama',
  source_as_of            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ingestion_run_id        VARCHAR(100),
  quality_flag            VARCHAR(20) NOT NULL DEFAULT 'ok',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(protocol_id, date)
);

CREATE TABLE token_market_daily (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id        UUID NOT NULL REFERENCES token(id),
  date            DATE NOT NULL,
  price_usd       NUMERIC,
  market_cap_usd  NUMERIC,
  fdv_usd         NUMERIC,
  circulating_supply NUMERIC,
  total_volume_usd NUMERIC,
  price_change_pct_24h NUMERIC,
  ath_usd         NUMERIC,
  source_provider VARCHAR(50) NOT NULL DEFAULT 'coingecko',
  source_as_of    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ingestion_run_id VARCHAR(100),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(token_id, date)
);

CREATE TABLE holder_snapshot (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_contract_id UUID NOT NULL REFERENCES token_contract(id),
  token_id        UUID NOT NULL REFERENCES token(id),
  snapshot_date   DATE NOT NULL,
  total_holders   INTEGER,
  top10_pct       NUMERIC(5,2),
  top50_pct       NUMERIC(5,2),
  top100_pct      NUMERIC(5,2),
  gini_coefficient NUMERIC(6,4),
  new_holders_24h INTEGER,
  source_provider VARCHAR(50) NOT NULL DEFAULT 'codex',
  source_as_of    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ingestion_run_id VARCHAR(100),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(token_contract_id, snapshot_date)
);

CREATE TABLE holder_detail (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  holder_snapshot_id  UUID NOT NULL REFERENCES holder_snapshot(id) ON DELETE CASCADE,
  wallet_address      VARCHAR(255) NOT NULL,
  balance             NUMERIC NOT NULL,
  balance_usd         NUMERIC,
  pct_of_supply       NUMERIC(8,4),
  first_held_date     TIMESTAMPTZ,
  wallet_label        VARCHAR(50),
  rank                INTEGER,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE buyback_event (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id     UUID NOT NULL REFERENCES protocol(id),
  token_id        UUID NOT NULL REFERENCES token(id),
  event_date      DATE NOT NULL,
  amount_spent_usd NUMERIC,
  tokens_acquired NUMERIC,
  avg_price_usd   NUMERIC,
  mechanism       VARCHAR(30),
  disposition     VARCHAR(30),
  lock_period_days INTEGER,
  tx_hash         VARCHAR(255),
  source_url      VARCHAR(512),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_revenue_daily_date ON revenue_daily(date);
CREATE INDEX idx_revenue_daily_protocol_date ON revenue_daily(protocol_id, date);
CREATE INDEX idx_token_market_daily_date ON token_market_daily(date);
CREATE INDEX idx_token_market_daily_token_date ON token_market_daily(token_id, date);
CREATE INDEX idx_holder_snapshot_date ON holder_snapshot(snapshot_date);
CREATE INDEX idx_holder_snapshot_token ON holder_snapshot(token_id, snapshot_date);
CREATE INDEX idx_holder_detail_snapshot ON holder_detail(holder_snapshot_id);
CREATE INDEX idx_holder_detail_address ON holder_detail(wallet_address);
CREATE INDEX idx_buyback_event_protocol ON buyback_event(protocol_id, event_date);

-- Down
DROP TABLE IF EXISTS buyback_event CASCADE;
DROP TABLE IF EXISTS holder_detail CASCADE;
DROP TABLE IF EXISTS holder_snapshot CASCADE;
DROP TABLE IF EXISTS token_market_daily CASCADE;
DROP TABLE IF EXISTS revenue_daily CASCADE;
