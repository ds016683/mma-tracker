-- =============================================================
-- MMA Tracker Schema
-- 5 normalized tables + RLS + Realtime + reorder RPC
-- =============================================================

-- -----------------------------------------------
-- 1. projects (core table)
-- -----------------------------------------------
CREATE TABLE projects (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'pencils_down', 'on_hold', 'archived')),
  category text NOT NULL DEFAULT '',
  priority text NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  pinned boolean NOT NULL DEFAULT false,
  manual_rank integer,
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  target_date text,
  tags text[] NOT NULL DEFAULT '{}',
  archived_at timestamptz,
  -- MMA-specific fields
  mma_version text NOT NULL DEFAULT '',
  mma_status text NOT NULL DEFAULT 'TBD',
  mma_priority text NOT NULL DEFAULT 'Medium',
  mma_contract_ref text NOT NULL DEFAULT '',
  mma_accountable text NOT NULL DEFAULT '',
  mma_responsible text NOT NULL DEFAULT '',
  mma_contributor text NOT NULL DEFAULT '',
  mma_informed text NOT NULL DEFAULT '',
  mma_estimated_turn_time text NOT NULL DEFAULT '',
  mma_comments text NOT NULL DEFAULT '',
  mma_date text NOT NULL DEFAULT ''
);

-- -----------------------------------------------
-- 2. project_tasks
-- -----------------------------------------------
CREATE TABLE project_tasks (
  id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  text text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_tasks_project_id ON project_tasks(project_id);

-- -----------------------------------------------
-- 3. project_notes
-- -----------------------------------------------
CREATE TABLE project_notes (
  id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_notes_project_id ON project_notes(project_id);

-- -----------------------------------------------
-- 4. project_links
-- -----------------------------------------------
CREATE TABLE project_links (
  id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  url text NOT NULL,
  label text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_links_project_id ON project_links(project_id);

-- -----------------------------------------------
-- 5. project_people
-- -----------------------------------------------
CREATE TABLE project_people (
  id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text
);

CREATE INDEX idx_project_people_project_id ON project_people(project_id);

-- -----------------------------------------------
-- Row Level Security
-- All authenticated users get full access
-- -----------------------------------------------
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_people ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all" ON projects
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "auth_all" ON project_tasks
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "auth_all" ON project_notes
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "auth_all" ON project_links
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "auth_all" ON project_people
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- -----------------------------------------------
-- Realtime publication
-- -----------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE project_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE project_notes;
ALTER PUBLICATION supabase_realtime ADD TABLE project_links;
ALTER PUBLICATION supabase_realtime ADD TABLE project_people;

-- Full replica identity so Realtime payloads include old row on UPDATE/DELETE
ALTER TABLE projects REPLICA IDENTITY FULL;
ALTER TABLE project_tasks REPLICA IDENTITY FULL;
ALTER TABLE project_notes REPLICA IDENTITY FULL;
ALTER TABLE project_links REPLICA IDENTITY FULL;
ALTER TABLE project_people REPLICA IDENTITY FULL;

-- -----------------------------------------------
-- RPC: atomic spotlight reorder
-- Accepts JSON array: [{"id": "task-01", "rank": 1}, ...]
-- -----------------------------------------------
CREATE OR REPLACE FUNCTION reorder_spotlight(rank_updates jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item jsonb;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(rank_updates)
  LOOP
    UPDATE projects
    SET manual_rank = (item->>'rank')::integer,
        last_activity_at = now()
    WHERE id = item->>'id';
  END LOOP;
END;
$$;
