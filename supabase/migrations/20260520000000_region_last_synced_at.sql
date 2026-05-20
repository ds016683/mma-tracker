-- Migration: add last_synced_at to region_data
-- Purpose: surface when the VPS Notion sync daemon last wrote to this table.
--          The VPS daemon should UPDATE last_synced_at = NOW() on each row
--          it touches during a sync. The UI reads MAX(last_synced_at) and
--          displays "Last sync: X ago" next to the Sync from Notion button.

ALTER TABLE region_data
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

COMMENT ON COLUMN region_data.last_synced_at IS
  'Timestamp of the last successful write by the VPS Notion sync daemon. '
  'Set by the daemon, read by the UI to show freshness.';
