-- =============================================================
-- User Roles, Account Requests & Invitations
-- =============================================================

-- -----------------------------------------------
-- 1. user_profiles
-- Links auth.users to an app role
-- -----------------------------------------------
CREATE TYPE app_role AS ENUM ('ths_user', 'mma_analytics', 'mma_regional');

CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'mma_regional',
  display_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "own_profile_read" ON user_profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- THS users can read all profiles (for admin panel)
CREATE POLICY "ths_read_all" ON user_profiles
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'ths_user'
  );

-- mma_analytics can read all profiles (for invite panel)
CREATE POLICY "analytics_read_all" ON user_profiles
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'mma_analytics'
  );

-- Only service role can insert/update (done via Edge Functions)
CREATE POLICY "service_role_write" ON user_profiles
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- -----------------------------------------------
-- 2. account_requests
-- Public-facing: someone requests an account
-- -----------------------------------------------
CREATE TABLE account_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  display_name text NOT NULL,
  requested_role app_role NOT NULL DEFAULT 'mma_regional',
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  approval_token uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by text
);

ALTER TABLE account_requests ENABLE ROW LEVEL SECURITY;

-- No direct client access; all operations via Edge Functions (service role)
CREATE POLICY "service_only" ON account_requests
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- THS users can view requests via the admin panel
CREATE POLICY "ths_read_requests" ON account_requests
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'ths_user'
  );

-- -----------------------------------------------
-- 3. invitations
-- In-app invitations sent by authorized users
-- -----------------------------------------------
CREATE TABLE invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invited_email text NOT NULL,
  invited_role app_role NOT NULL,
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz
);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Authenticated users can see invitations they sent
CREATE POLICY "own_invitations_read" ON invitations
  FOR SELECT TO authenticated
  USING (invited_by = auth.uid());

-- THS users can see all invitations
CREATE POLICY "ths_read_all_invitations" ON invitations
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'ths_user'
  );

-- Authenticated users can insert invitations (role cap enforced in Edge Function)
CREATE POLICY "authenticated_insert" ON invitations
  FOR INSERT TO authenticated
  WITH CHECK (invited_by = auth.uid());

-- Service role full access
CREATE POLICY "service_role_invitations" ON invitations
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);
