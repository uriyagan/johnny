-- =============================================================================
-- Johnny SaaS — Milestone 1: Initial schema
-- Autonomous AI (Gemini) Meta campaign-management platform for Israeli SMBs.
--
-- Conventions:
--   * All tenant data is row-level-secured to the owning user (auth.uid()).
--   * Admins (profiles.role = 'admin') bypass tenant scoping via is_admin().
--   * Money is stored as numeric(12,2) in ILS unless a currency column says otherwise.
--   * Secrets (Meta access tokens) are NEVER stored in plaintext columns — only a
--     reference to a Supabase Vault secret is kept (ad_accounts.access_token_secret_id).
--   * updated_at is maintained by the moddatetime trigger on every mutable table.
-- =============================================================================

create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "moddatetime"; -- auto updated_at triggers

-- =============================================================================
-- ENUM TYPES
-- =============================================================================
create type user_role            as enum ('client', 'admin');
create type subscription_tier    as enum ('tier_1', 'tier_2', 'tier_3', 'tier_4');
create type subscription_status  as enum (
  'trialing', 'active', 'past_due', 'canceled',
  'incomplete', 'incomplete_expired', 'unpaid'
);
create type ad_provider          as enum ('meta');               -- extensible: 'google' later
create type ad_account_status    as enum ('pending', 'connected', 'disconnected', 'error');
create type campaign_status      as enum ('draft', 'active', 'paused', 'archived', 'in_review', 'rejected');
create type message_role         as enum ('user', 'assistant', 'system');
create type asset_kind           as enum ('image', 'video', 'document');
create type asset_status         as enum ('uploaded', 'analyzing', 'ready', 'error');
create type notification_type    as enum (
  'budget_warning', 'budget_paused', 'policy_rejected',
  'recap_daily', 'recap_weekly', 'crm_checkin', 'system'
);
create type notification_channel as enum ('in_app', 'email');
create type webhook_source       as enum ('stripe', 'meta');
create type webhook_status       as enum ('pending', 'processed', 'failed', 'skipped');
create type health_provider      as enum ('meta', 'stripe', 'gemini', 'resend', 'supabase');
create type health_status        as enum ('healthy', 'degraded', 'down');
create type killswitch_scope     as enum ('global', 'user');
create type killswitch_type      as enum ('api_execution', 'spending');

-- =============================================================================
-- HELPER: max ad accounts allowed for a tier (NULL = unlimited)
-- =============================================================================
create or replace function tier_account_limit(t subscription_tier)
returns integer
language sql
immutable
as $$
  select case t
    when 'tier_1' then 1
    when 'tier_2' then 3
    when 'tier_3' then 10
    when 'tier_4' then null   -- unlimited
  end;
$$;

-- =============================================================================
-- PROFILES (1:1 with auth.users)
-- =============================================================================
create table profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  role          user_role   not null default 'client',
  full_name     text,
  business_name text,
  phone         text,
  locale        text        not null default 'he',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, business_name)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'business_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- is_admin(): used by RLS policies to grant admins full visibility.
create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- =============================================================================
-- SUBSCRIPTIONS (synced from Stripe webhooks)
-- =============================================================================
create table subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references profiles (id) on delete cascade,
  stripe_customer_id     text,
  stripe_subscription_id text unique,
  tier                   subscription_tier   not null default 'tier_1',
  status                 subscription_status not null default 'incomplete',
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  unique (user_id)  -- one active subscription record per tenant
);
create index on subscriptions (stripe_customer_id);

-- =============================================================================
-- AD ACCOUNTS (Meta only in v1)
-- =============================================================================
create table ad_accounts (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references profiles (id) on delete cascade,
  provider               ad_provider       not null default 'meta',
  external_account_id    text              not null,
  name                   text,
  status                 ad_account_status not null default 'pending',
  -- Reference to the Vault secret holding the OAuth token. NEVER store the token here.
  access_token_secret_id uuid,
  token_expires_at       timestamptz,
  metadata               jsonb             not null default '{}'::jsonb,
  connected_at           timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  unique (provider, external_account_id)
);
create index on ad_accounts (user_id);

-- =============================================================================
-- CAMPAIGNS
-- =============================================================================
create table campaigns (
  id                   uuid primary key default gen_random_uuid(),
  ad_account_id        uuid not null references ad_accounts (id) on delete cascade,
  external_campaign_id text,
  name                 text not null,
  status               campaign_status not null default 'draft',
  objective            text,
  daily_budget         numeric(12,2),
  lifetime_budget      numeric(12,2),
  spend_to_date        numeric(12,2) not null default 0,
  currency             text not null default 'ILS',
  rejection_reason     text,             -- raw Meta reason (Pillar 3)
  rejection_reason_he  text,             -- Gemini-translated Hebrew reason
  last_synced_at       timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (ad_account_id, external_campaign_id)
);
create index on campaigns (ad_account_id);
create index on campaigns (status);

-- =============================================================================
-- BUDGET CAPS (Pillar 1 — Anti-Overspending Engine)
-- =============================================================================
create table budget_caps (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references profiles (id) on delete cascade,
  ad_account_id       uuid references ad_accounts (id) on delete cascade, -- null = applies to all accounts
  monthly_cap_ils     numeric(12,2) not null,
  spend_current_period numeric(12,2) not null default 0,
  threshold_pct       integer not null default 90 check (threshold_pct between 1 and 100),
  hard_pause_enabled  boolean not null default true,
  period_start        date not null,
  period_end          date not null,
  triggered_at        timestamptz,      -- set when the cap forced a pause
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index on budget_caps (user_id);

-- =============================================================================
-- CHAT (chat-first interface + Gemini intent parsing)
-- =============================================================================
create table chat_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles (id) on delete cascade,
  title      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on chat_sessions (user_id);

create table chat_messages (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references chat_sessions (id) on delete cascade,
  role       message_role not null,
  content    text not null,
  intent     jsonb,            -- structured intent JSON parsed by Gemini (assistant/user turns)
  model      text,             -- which Gemini model produced this (assistant turns)
  created_at timestamptz not null default now()
);
create index on chat_messages (session_id, created_at);

-- =============================================================================
-- ASSETS (Pillar 4 — Creative Asset Hub, stored in Supabase Storage buckets)
-- =============================================================================
create table assets (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references profiles (id) on delete cascade,
  storage_path      text not null,   -- path within the 'assets' storage bucket
  original_filename text,
  mime_type         text,
  kind              asset_kind not null default 'image',
  status            asset_status not null default 'uploaded',
  ai_analysis       jsonb,           -- Gemini-extracted visual attributes
  generated_copy    jsonb,           -- Gemini Hebrew copy variants
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index on assets (user_id);

-- =============================================================================
-- CRM FEEDBACK LOOP (Pillar 5)
-- =============================================================================
create table crm_feedback (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references profiles (id) on delete cascade,
  session_id          uuid references chat_sessions (id) on delete set null,
  question            text,
  response_text       text,
  gemini_analysis     jsonb,         -- lead-quality interpretation
  applied_adjustments jsonb,         -- targeting changes pushed to Meta
  scheduled_for       timestamptz,
  completed_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index on crm_feedback (user_id);

-- =============================================================================
-- NOTIFICATIONS (in-app + Resend email mirror)
-- =============================================================================
create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles (id) on delete cascade,
  type       notification_type not null,
  channel    notification_channel not null default 'in_app',
  title      text not null,
  body       text,
  metadata   jsonb not null default '{}'::jsonb,
  read_at    timestamptz,
  sent_at    timestamptz,
  created_at timestamptz not null default now()
);
create index on notifications (user_id, created_at);

-- =============================================================================
-- WEBHOOK EVENTS (idempotency log for Stripe + Meta)
-- =============================================================================
create table webhook_events (
  id                uuid primary key default gen_random_uuid(),
  source            webhook_source not null,
  event_type        text not null,
  external_event_id text not null,            -- Stripe event id / Meta delivery id
  payload           jsonb not null,
  status            webhook_status not null default 'pending',
  error             text,
  processed_at      timestamptz,
  created_at        timestamptz not null default now(),
  unique (source, external_event_id)          -- guarantees exactly-once processing
);
create index on webhook_events (status);

-- =============================================================================
-- ADMIN: audit log, API health, kill switches (Super Admin panel — §6)
-- =============================================================================
create table admin_audit_log (
  id             uuid primary key default gen_random_uuid(),
  admin_id       uuid not null references profiles (id) on delete set null,
  action         text not null,           -- e.g. 'impersonate', 'toggle_killswitch'
  target_user_id uuid references profiles (id) on delete set null,
  details        jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);
create index on admin_audit_log (admin_id, created_at);

create table api_health (
  id         uuid primary key default gen_random_uuid(),
  provider   health_provider not null,
  status     health_status not null,
  latency_ms integer,
  details    jsonb not null default '{}'::jsonb,
  checked_at timestamptz not null default now()
);
create index on api_health (provider, checked_at desc);

create table kill_switches (
  id             uuid primary key default gen_random_uuid(),
  scope          killswitch_scope not null,
  type           killswitch_type  not null,
  target_user_id uuid references profiles (id) on delete cascade, -- null when scope = 'global'
  enabled        boolean not null default false,
  reason         text,
  set_by         uuid references profiles (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- exactly one global switch per type; per-user switches unique per (user, type)
  unique (scope, type, target_user_id)
);

-- =============================================================================
-- updated_at TRIGGERS (moddatetime)
-- =============================================================================
create trigger t_profiles_updated     before update on profiles      for each row execute procedure moddatetime (updated_at);
create trigger t_subscriptions_updated before update on subscriptions for each row execute procedure moddatetime (updated_at);
create trigger t_ad_accounts_updated   before update on ad_accounts   for each row execute procedure moddatetime (updated_at);
create trigger t_campaigns_updated     before update on campaigns     for each row execute procedure moddatetime (updated_at);
create trigger t_budget_caps_updated   before update on budget_caps   for each row execute procedure moddatetime (updated_at);
create trigger t_chat_sessions_updated before update on chat_sessions for each row execute procedure moddatetime (updated_at);
create trigger t_assets_updated        before update on assets        for each row execute procedure moddatetime (updated_at);
create trigger t_crm_feedback_updated  before update on crm_feedback  for each row execute procedure moddatetime (updated_at);
create trigger t_kill_switches_updated before update on kill_switches for each row execute procedure moddatetime (updated_at);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
alter table profiles        enable row level security;
alter table subscriptions   enable row level security;
alter table ad_accounts     enable row level security;
alter table campaigns       enable row level security;
alter table budget_caps     enable row level security;
alter table chat_sessions   enable row level security;
alter table chat_messages   enable row level security;
alter table assets          enable row level security;
alter table crm_feedback    enable row level security;
alter table notifications   enable row level security;
alter table webhook_events  enable row level security;
alter table admin_audit_log enable row level security;
alter table api_health      enable row level security;
alter table kill_switches   enable row level security;

-- ---- profiles -------------------------------------------------------------
create policy "profiles: self or admin can read"
  on profiles for select using (id = auth.uid() or is_admin());
create policy "profiles: self can update"
  on profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles: admin can update any"
  on profiles for update using (is_admin()) with check (is_admin());

-- ---- generic owner policy for tenant tables keyed by user_id --------------
-- (one block per table; admins always pass via is_admin())

create policy "subscriptions: owner or admin read"
  on subscriptions for select using (user_id = auth.uid() or is_admin());
-- writes to subscriptions happen only via service role (Stripe webhook) → no client policy

create policy "ad_accounts: owner all"
  on ad_accounts for all using (user_id = auth.uid() or is_admin())
  with check (user_id = auth.uid() or is_admin());

create policy "campaigns: owner all"
  on campaigns for all
  using (
    is_admin() or exists (
      select 1 from ad_accounts a
      where a.id = campaigns.ad_account_id and a.user_id = auth.uid()
    )
  )
  with check (
    is_admin() or exists (
      select 1 from ad_accounts a
      where a.id = campaigns.ad_account_id and a.user_id = auth.uid()
    )
  );

create policy "budget_caps: owner all"
  on budget_caps for all using (user_id = auth.uid() or is_admin())
  with check (user_id = auth.uid() or is_admin());

create policy "chat_sessions: owner all"
  on chat_sessions for all using (user_id = auth.uid() or is_admin())
  with check (user_id = auth.uid() or is_admin());

create policy "chat_messages: owner all"
  on chat_messages for all
  using (
    is_admin() or exists (
      select 1 from chat_sessions s
      where s.id = chat_messages.session_id and s.user_id = auth.uid()
    )
  )
  with check (
    is_admin() or exists (
      select 1 from chat_sessions s
      where s.id = chat_messages.session_id and s.user_id = auth.uid()
    )
  );

create policy "assets: owner all"
  on assets for all using (user_id = auth.uid() or is_admin())
  with check (user_id = auth.uid() or is_admin());

create policy "crm_feedback: owner read"
  on crm_feedback for select using (user_id = auth.uid() or is_admin());
create policy "crm_feedback: owner write responses"
  on crm_feedback for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "notifications: owner read"
  on notifications for select using (user_id = auth.uid() or is_admin());
create policy "notifications: owner mark read"
  on notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---- admin-only / service-role-only tables --------------------------------
-- webhook_events, api_health: no client access at all (service role bypasses RLS).
create policy "webhook_events: admin read"  on webhook_events  for select using (is_admin());
create policy "api_health: admin read"      on api_health      for select using (is_admin());

create policy "admin_audit_log: admin read" on admin_audit_log for select using (is_admin());
create policy "admin_audit_log: admin write" on admin_audit_log for insert with check (is_admin());

create policy "kill_switches: admin all"    on kill_switches   for all using (is_admin()) with check (is_admin());

-- Note: budget_caps, chat, etc. are also written server-side by the cron/worker
-- using the Supabase service-role key, which bypasses RLS by design.
