-- Feature 1: admin_users allowlist table + RLS
-- Run in Supabase SQL Editor (Dashboard → SQL → New query)

CREATE TABLE admin_users (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text UNIQUE NOT NULL,
  name        text NOT NULL,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

-- Normalize emails to lowercase on insert/update
CREATE OR REPLACE FUNCTION normalize_admin_user_email()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email := lower(trim(NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER admin_users_normalize_email
  BEFORE INSERT OR UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION normalize_admin_user_email();

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own admin row"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (email = lower(auth.jwt() ->> 'email'));
