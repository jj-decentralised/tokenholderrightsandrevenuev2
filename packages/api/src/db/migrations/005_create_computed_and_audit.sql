-- Migration 005: Computed metrics and audit tables
-- Up
CREATE TABLE computed_metrics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id     UUID NOT NULL REFERENCES protocol(id),
  token_id        UUID REFERENCES token(id),
  date            DATE NOT NULL,
  -- Valuation ratios
  ps_ratio        NUMERIC,
  pe_ratio        NUMERIC,
  real_pe_ratio   NUMERIC,
  revenue_yield   NUMERIC(8,4),
  -- Per-holder metrics
  revenue_per_holder NUMERIC,
  annual_revenue_per_holder NUMERIC,
  -- Revenue attribution percentages
  holder_revenue_pct NUMERIC(5,2),
  supply_side_pct    NUMERIC(5,2),
  treasury_pct       NUMERIC(5,2),
  -- Holder dynamics
  holder_growth_7d   NUMERIC(8,4),
  holder_growth_30d  NUMERIC(8,4),
  -- Productive token score components
  revenue_to_holders_score NUMERIC(3,1),
  holder_growth_score      NUMERIC(3,1),
  concentration_score      NUMERIC(3,1),
  mechanism_maturity_score NUMERIC(3,1),
  productive_token_score   NUMERIC(3,1),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(protocol_id, date)
);

CREATE TABLE restatement_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type     VARCHAR(50) NOT NULL,
  entity_id       UUID NOT NULL,
  field_name      VARCHAR(100) NOT NULL,
  old_value       TEXT,
  new_value       TEXT,
  reason          TEXT NOT NULL,
  date_affected   DATE NOT NULL,
  source_provider VARCHAR(50),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE source_lineage (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type     VARCHAR(50) NOT NULL,
  entity_id       UUID NOT NULL,
  field_name      VARCHAR(100),
  source_provider VARCHAR(50) NOT NULL,
  source_endpoint VARCHAR(255),
  source_params   JSONB,
  fetched_at      TIMESTAMPTZ NOT NULL,
  raw_payload_ref VARCHAR(512),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ingestion_run (
  id              VARCHAR(100) PRIMARY KEY,
  provider        VARCHAR(50) NOT NULL,
  job_type        VARCHAR(50) NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'running',
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  records_processed INTEGER DEFAULT 0,
  records_failed  INTEGER DEFAULT 0,
  error_message   TEXT,
  metadata        JSONB
);

CREATE TABLE backfill_checkpoint (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider        VARCHAR(50) NOT NULL,
  endpoint        VARCHAR(255) NOT NULL,
  entity_id       VARCHAR(255) NOT NULL,
  earliest_date   DATE,
  latest_date     DATE,
  status          VARCHAR(20) NOT NULL DEFAULT 'pending',
  last_chunk_end  DATE,
  total_records   INTEGER DEFAULT 0,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, endpoint, entity_id)
);

CREATE INDEX idx_computed_metrics_date ON computed_metrics(date);
CREATE INDEX idx_computed_metrics_protocol ON computed_metrics(protocol_id, date);
CREATE INDEX idx_restatement_log_entity ON restatement_log(entity_type, entity_id);
CREATE INDEX idx_source_lineage_entity ON source_lineage(entity_type, entity_id);
CREATE INDEX idx_ingestion_run_status ON ingestion_run(status, started_at);
CREATE INDEX idx_backfill_checkpoint_provider ON backfill_checkpoint(provider, endpoint);

-- Down
DROP TABLE IF EXISTS backfill_checkpoint CASCADE;
DROP TABLE IF EXISTS ingestion_run CASCADE;
DROP TABLE IF EXISTS source_lineage CASCADE;
DROP TABLE IF EXISTS restatement_log CASCADE;
DROP TABLE IF EXISTS computed_metrics CASCADE;
