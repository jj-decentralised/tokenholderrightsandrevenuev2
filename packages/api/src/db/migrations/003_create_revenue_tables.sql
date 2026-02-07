-- Migration 003: Revenue attribution tables
-- Up
CREATE TABLE token_rights (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id        UUID NOT NULL REFERENCES token(id) ON DELETE CASCADE,
  right_type      VARCHAR(50) NOT NULL,
  mechanism_description TEXT,
  percentage_allocation NUMERIC(5,2),
  activation_date DATE,
  end_date        DATE,
  is_active       BOOLEAN DEFAULT true,
  conditions      JSONB,
  source_url      VARCHAR(512),
  confidence_score NUMERIC(3,2) NOT NULL DEFAULT 1.0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE revenue_source (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id     UUID NOT NULL REFERENCES protocol(id) ON DELETE CASCADE,
  sub_product_id  UUID REFERENCES sub_product(id),
  source_type     VARCHAR(50) NOT NULL,
  description     TEXT,
  fee_structure   JSONB,
  is_onchain_verifiable BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE revenue_attribution (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenue_source_id UUID NOT NULL REFERENCES revenue_source(id) ON DELETE CASCADE,
  recipient_type  VARCHAR(50) NOT NULL,
  percentage_share NUMERIC(5,2) NOT NULL,
  effective_date  DATE NOT NULL,
  end_date        DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_token_rights_token ON token_rights(token_id);
CREATE INDEX idx_revenue_source_protocol ON revenue_source(protocol_id);
CREATE INDEX idx_revenue_attribution_source ON revenue_attribution(revenue_source_id);

-- Down
DROP TABLE IF EXISTS revenue_attribution CASCADE;
DROP TABLE IF EXISTS revenue_source CASCADE;
DROP TABLE IF EXISTS token_rights CASCADE;
