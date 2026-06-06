-- =============================================================================
-- Johnny SaaS — dismissed recommendation cards (per user)
-- Recommendations are computed dynamically; this only records what a user hid.
-- =============================================================================

create table recommendation_dismissals (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles (id) on delete cascade,
  rec_key    text not null,
  created_at timestamptz not null default now(),
  unique (user_id, rec_key)
);

alter table recommendation_dismissals enable row level security;

create policy "rec_dismissals: owner all"
  on recommendation_dismissals for all
  using (user_id = auth.uid() or is_admin())
  with check (user_id = auth.uid() or is_admin());
