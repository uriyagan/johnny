-- =============================================================================
-- Johnny SaaS — Meta OAuth connection store (live integration)
-- Holds the encrypted long-lived user access token per tenant. Written and read
-- only by the service role (OAuth callback + live Ads provider); no client RLS.
-- =============================================================================

create table meta_connections (
  user_id           uuid primary key references profiles (id) on delete cascade,
  access_token_enc  text not null,            -- AES-256-GCM, app-encrypted
  token_expires_at  timestamptz,
  scopes            text,
  meta_user_id      text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger t_meta_connections_updated
  before update on meta_connections
  for each row execute procedure moddatetime (updated_at);

alter table meta_connections enable row level security;

-- Admins may read; all writes/reads for the flow go through the service role.
create policy "meta_connections: admin read"
  on meta_connections for select using (is_admin());
