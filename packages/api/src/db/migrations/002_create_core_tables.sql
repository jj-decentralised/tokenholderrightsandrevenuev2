-- Migration 002: Core entity tables
-- Up
CREATE TABLE protocol (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(255) NOT NULL,
  slug            VARCHAR(255) UNIQUE NOT NULL,
  defillama_id    VARCHAR(255),
  coingecko_id    VARCHAR(255),
  description     TEXT,
  website_url     VARCHAR(512),
  logo_url        VARCHAR(512),
  launch_date     DATE,
  is_parent       BOOLEAN DEFAULT false,
  primary_category category_enum,
  tokenization_type tokenization_type_enum NOT NULL DEFAULT 'non_tokenized',
  status          VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sub_product (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id     UUID NOT NULL REFERENCES protocol(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  defillama_slug  VARCHAR(255),
  category        category_enum NOT NULL,
  chain           VARCHAR(100),
  version         VARCHAR(50),
  status          VARCHAR(20) DEFAULT 'active',
  launch_date     DATE,
  end_date        DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(protocol_id, defillama_slug)
);

CREATE TABLE token (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol          VARCHAR(20) NOT NULL,
  name            VARCHAR(255) NOT NULL,
  protocol_id     UUID REFERENCES protocol(id),
  coingecko_id    VARCHAR(255),
  primary_chain_id INTEGER,
  primary_address VARCHAR(255),
  total_supply    NUMERIC,
  max_supply      NUMERIC,
  token_type      VARCHAR(50),
  has_revenue_rights BOOLEAN DEFAULT false,
  revenue_mechanism_status revenue_mechanism_status_enum DEFAULT 'none',
  productive_token_score NUMERIC(3,1),
  predecessor_token_id UUID REFERENCES token(id),
  transition_date DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE token_contract (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id        UUID NOT NULL REFERENCES token(id) ON DELETE CASCADE,
  chain_id        INTEGER NOT NULL,
  chain_name      VARCHAR(100) NOT NULL,
  contract_address VARCHAR(255) NOT NULL,
  decimals        INTEGER,
  codex_token_id  VARCHAR(255),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(chain_id, contract_address)
);

CREATE TABLE chain_deployment (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id     UUID NOT NULL REFERENCES protocol(id) ON DELETE CASCADE,
  sub_product_id  UUID REFERENCES sub_product(id),
  chain_id        INTEGER NOT NULL,
  chain_name      VARCHAR(100) NOT NULL,
  deployment_date DATE,
  contract_addresses JSONB,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_protocol_slug ON protocol(slug);
CREATE INDEX idx_protocol_category ON protocol(primary_category);
CREATE INDEX idx_sub_product_protocol ON sub_product(protocol_id);
CREATE INDEX idx_token_protocol ON token(protocol_id);
CREATE INDEX idx_token_coingecko ON token(coingecko_id);
CREATE INDEX idx_token_contract_token ON token_contract(token_id);
CREATE INDEX idx_chain_deployment_protocol ON chain_deployment(protocol_id);

-- Down
DROP TABLE IF EXISTS chain_deployment CASCADE;
DROP TABLE IF EXISTS token_contract CASCADE;
DROP TABLE IF EXISTS token CASCADE;
DROP TABLE IF EXISTS sub_product CASCADE;
DROP TABLE IF EXISTS protocol CASCADE;
