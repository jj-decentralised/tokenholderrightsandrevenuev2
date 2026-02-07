-- Migration 006: Add has_fee_data flag to protocol table
-- Tracks which protocols have fee/revenue data in DefiLlama
-- Used to limit revenue ingestion to only relevant protocols
-- Up
ALTER TABLE protocol ADD COLUMN IF NOT EXISTS has_fee_data BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX idx_protocol_has_fee_data ON protocol(has_fee_data) WHERE has_fee_data = true;

-- Down
DROP INDEX IF EXISTS idx_protocol_has_fee_data;
ALTER TABLE protocol DROP COLUMN IF EXISTS has_fee_data;
