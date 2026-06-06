-- =============================================================================
-- Johnny SaaS — local seed data (development only; never run in production)
-- Run after migrations against a LOCAL supabase via `supabase db reset`.
--
-- These rows assume two auth users already exist (create them in the local
-- Studio or via the CLI, then paste their UUIDs below). We keep seed minimal
-- here; the rich mock data lives in the app's src/mocks layer (Milestone 3).
-- =============================================================================

-- Promote a known local user to admin (replace the UUID with your local admin user id):
-- update public.profiles set role = 'admin', full_name = 'מנהל מערכת'
--   where id = '00000000-0000-0000-0000-000000000000';

-- Example tier reference check (no-op select, documents the tier→limit mapping):
-- select tier_account_limit('tier_1') as t1,  -- 1
--        tier_account_limit('tier_4') as t4;  -- null (unlimited)
