-- Migration: Create msa_carrier_coverage table
-- Replaces static /public/data/carrier-coverage-comparison.csv
-- Applied: 2026-07-10

CREATE TABLE IF NOT EXISTS msa_carrier_coverage (
  id          bigserial PRIMARY KEY,
  msa_id      integer,
  msa_name    text,
  carrier     text,
  bucket      text,
  state       text,
  seg_pop     integer,
  total_pop   integer,
  ooa         integer,
  gy9         numeric,
  gy8         numeric,
  gyd         numeric,
  cb9         numeric,
  cb8         numeric,
  cbd         numeric,
  rate9       bigint,
  rank9       integer
);

-- Enable RLS
ALTER TABLE msa_carrier_coverage ENABLE ROW LEVEL SECURITY;

-- Allow anon read (dashboard uses anon key)
CREATE POLICY "anon read" ON msa_carrier_coverage
  FOR SELECT USING (true);
