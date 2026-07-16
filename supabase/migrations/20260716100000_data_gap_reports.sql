-- ================================================
-- Data Gap Reports
-- Submitted by MMA users to flag missing data
-- ================================================

CREATE TABLE data_gap_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_type text NOT NULL CHECK (data_type IN ('hospital', 'network')),
  mma_region text NOT NULL,
  state text NOT NULL,
  msa_name text NOT NULL,
  item_name text NOT NULL,
  additional_details text NOT NULL DEFAULT '',
  submitted_by_email text NOT NULL DEFAULT '',
  submitted_by_name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'under_investigation', 'to_be_added', 'unable_to_add', 'dismissed')),
  status_note text NOT NULL DEFAULT '',
  reviewed_by text NOT NULL DEFAULT '',
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE data_gap_reports ENABLE ROW LEVEL SECURITY;

-- All authenticated users can insert
CREATE POLICY "authenticated_insert" ON data_gap_reports
  FOR INSERT TO authenticated WITH CHECK (true);

-- All authenticated users can read
CREATE POLICY "authenticated_read" ON data_gap_reports
  FOR SELECT TO authenticated USING (true);

-- Only ths_user and mma_analytics can update status (enforced in app)
CREATE POLICY "authenticated_update" ON data_gap_reports
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Service role full access
CREATE POLICY "service_role_all" ON data_gap_reports
  FOR ALL TO service_role USING (true) WITH CHECK (true);
