-- Feature 1: Seed allowlist rows (run AFTER creating auth users in Dashboard)
--
-- Prerequisites:
--   1. Migration 001_admin_users.sql has been applied
--   2. Auth users already exist with matching emails (Authentication → Users)
--
-- Replace the placeholder values below with your real test users.

-- Primary test user (should be able to log in)
INSERT INTO admin_users (email, name)
VALUES ('niranjansutharai1@gmail.com', 'Niranjan')
ON CONFLICT (email) DO NOTHING;

-- Optional: inactive user for testing access-denied when is_active = false
-- INSERT INTO admin_users (email, name, is_active)
-- VALUES ('inactive@example.com', 'Inactive User', false)
-- ON CONFLICT (email) DO NOTHING;
