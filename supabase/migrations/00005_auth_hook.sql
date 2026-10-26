-- ============================================================
-- Kasir Kopi Shop - Supabase Auth Hook
-- Sets custom JWT claims (account_id, role) on login
-- ============================================================
-- This function should be set as a Supabase Auth Hook
-- via the Supabase Dashboard > Authentication > Hooks
-- or via supabase/functions/postgres-meta endpoint.
--
-- When a user logs in, this hook reads their account_id
-- and role from the "user" table and injects them into
-- the JWT token's app_metadata, so RLS policies can
-- use auth.jwt() -> 'app_metadata' -> 'account_id'
-- ============================================================

CREATE OR REPLACE FUNCTION public.custom_access_token(event JSONB)
RETURNS JSONB AS $$
DECLARE
  claims JSONB;
  user_record RECORD;
BEGIN
  -- Read the user record from our custom user table
  SELECT u.account_id, u.role, u.is_active
  INTO user_record
  FROM "user" u
  WHERE u.id = (event -> 'user' ->> 'id')::UUID;

  -- If user not found or inactive, deny access
  IF NOT FOUND OR NOT user_record.is_active THEN
    RETURN jsonb_build_object(
      'version', event ->> 'version',
      'claims', event -> 'claims'
    );
  END IF;

  -- Merge custom claims into the JWT
  claims := event -> 'claims';
  claims := jsonb_set(claims, '{app_metadata, account_id}', to_jsonb(user_record.account_id));
  claims := jsonb_set(claims, '{app_metadata, role}', to_jsonb(user_record.role));
  claims := jsonb_set(claims, '{role}', to_jsonb(user_record.role));

  -- Return modified event
  RETURN jsonb_build_object(
    'version', event ->> 'version',
    'claims', claims
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Instructions to register the hook:
-- ============================================================
-- Option 1: Via Supabase Dashboard
--   1. Go to Authentication > Hooks
--   2. Add a "Custom Access Token" hook
--   3. Select "PostgreSQL Function" as the handler type
--   4. Enter: public.custom_access_token
--
-- Option 2: Via Supabase CLI
--   In supabase/config.toml:
--   [hooks.custom_access_token]
--   enabled = true
--   uri = "pg-functions://public/custom_access_token"
-- ============================================================
