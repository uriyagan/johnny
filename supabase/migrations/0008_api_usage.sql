-- =============================================================================
-- Johnny SaaS — API usage & cost tracking (admin cost monitoring)
-- Records each external API call (mainly Gemini) with tokens + estimated cost.
-- Written by the service role; admins read.
-- =============================================================================

create type usage_provider as enum ('gemini', 'meta', 'resend', 'stripe');

create table api_usage (
  id         uuid primary key default gen_random_uuid(),
  provider   usage_provider not null,
  operation  text not null,
  user_id    uuid references profiles (id) on delete set null,
  tokens_in  integer not null default 0,
  tokens_out integer not null default 0,
  cost_usd   numeric(12, 6) not null default 0,
  metadata   jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index on api_usage (created_at desc);
create index on api_usage (provider, created_at desc);

alter table api_usage enable row level security;

create policy "api_usage: admin read"
  on api_usage for select using (is_admin());
