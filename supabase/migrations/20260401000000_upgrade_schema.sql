-- =====================================================================
-- Migration: Schema Upgrade for v2 Features
-- Run this in Supabase SQL Editor (or via supabase db push)
-- =====================================================================

-- -----------------------------------------------------------------
-- 1. Add start_date / end_date to projects (for Gantt)
-- -----------------------------------------------------------------
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS start_date text,
  ADD COLUMN IF NOT EXISTS end_date   text;

-- -----------------------------------------------------------------
-- 2. Add structured columns to project_tasks
-- -----------------------------------------------------------------
ALTER TABLE project_tasks
  ADD COLUMN IF NOT EXISTS task_name   text,
  ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS assigned_to text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS due_date    text,
  ADD COLUMN IF NOT EXISTS start_date  text;

-- Back-fill task_name from text (existing records)
UPDATE project_tasks SET task_name = text WHERE task_name IS NULL;

-- -----------------------------------------------------------------
-- 3. Create project_activity table (Activity Feed)
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_activity (
  id          text PRIMARY KEY,
  project_id  text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id     text NOT NULL DEFAULT '',
  event_type  text NOT NULL DEFAULT 'generic',
  description text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_activity_project_id
  ON project_activity(project_id);

CREATE INDEX IF NOT EXISTS idx_project_activity_created_at
  ON project_activity(created_at DESC);

-- -----------------------------------------------------------------
-- 4. RLS for project_activity
-- -----------------------------------------------------------------
ALTER TABLE project_activity ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'project_activity' AND policyname = 'auth_all'
  ) THEN
    CREATE POLICY "auth_all" ON project_activity
      FOR ALL TO authenticated
      USING (true) WITH CHECK (true);
  END IF;
END
$$;

-- -----------------------------------------------------------------
-- 5. Realtime for new table
-- -----------------------------------------------------------------
DO $$
BEGIN
  -- Only add if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'project_activity'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE project_activity;
  END IF;
END
$$;

ALTER TABLE project_activity REPLICA IDENTITY FULL;
