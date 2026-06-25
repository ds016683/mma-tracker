-- Migration: add mrf_failure_reason column to hospital_directory
-- Date: 2026-06-25
-- Reason: New field in hospital directory CSV (2026_04v9 data drop from Tanner Johnson)
--         Surfaces in Hospital Coverage page as "MRF Usage Barrier" column

ALTER TABLE hospital_directory
  ADD COLUMN IF NOT EXISTS mrf_failure_reason text;

-- Populate from any existing CSV import where applicable
-- NOTE: After applying this migration, re-import hospital_directory_2026_04v9.csv
-- to populate mrf_failure_reason values. See public/data/ in mma-tracker repo.
