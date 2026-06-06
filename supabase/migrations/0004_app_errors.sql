-- =============================================================================
-- Johnny SaaS — centralized error log (admin error monitoring)
-- Captures client + server errors from all users. Written by the service role
-- (API route / server helper); admins read. No client RLS for writes.
-- =============================================================================

create type error_source as enum ('client', 'server');
create type error_severity as enum ('warning', 'error', 'fatal');

create table app_errors (
  id         uuid primary key default gen_random_uuid(),
  source     error_source   not null default 'client',
  severity   error_severity not null default 'error',
  message    text not null,
  stack      text,
  route      text,
  user_id    uuid references profiles (id) on delete set null,
  user_agent text,
  metadata   jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index on app_errors (created_at desc);
create index on app_errors (source, created_at desc);

alter table app_errors enable row level security;

create policy "app_errors: admin read"
  on app_errors for select using (is_admin());
