-- =============================================================================
-- Johnny SaaS — soft delete for recoverable data (ad accounts + assets)
-- =============================================================================

alter table ad_accounts add column if not exists deleted_at timestamptz;
alter table assets add column if not exists deleted_at timestamptz;

create index if not exists ad_accounts_active_idx
  on ad_accounts (user_id) where deleted_at is null;
create index if not exists assets_active_idx
  on assets (user_id) where deleted_at is null;
