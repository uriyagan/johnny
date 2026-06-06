-- =============================================================================
-- Johnny SaaS — email automations + send log (admin-managed transactional email)
-- Templates are keyed by trigger; merge-tag lists live in code (registry).
-- =============================================================================

create table email_automations (
  id          uuid primary key default gen_random_uuid(),
  trigger_key text not null unique,
  enabled     boolean not null default true,
  subject     text not null,
  body_html   text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger t_email_automations_updated
  before update on email_automations
  for each row execute procedure moddatetime (updated_at);

create table email_send_log (
  id          uuid primary key default gen_random_uuid(),
  trigger_key text not null,
  recipient   text not null,
  status      text not null,          -- sent | failed | test
  error       text,
  created_at  timestamptz not null default now()
);
create index on email_send_log (created_at desc);

alter table email_automations enable row level security;
alter table email_send_log enable row level security;

create policy "email_automations: admin read"
  on email_automations for select using (is_admin());
create policy "email_send_log: admin read"
  on email_send_log for select using (is_admin());
