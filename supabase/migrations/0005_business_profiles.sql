-- =============================================================================
-- Johnny SaaS — business profile ("ג׳וני רוצה להכיר את העסק שלך")
-- The brand memory Johnny uses to generate & manage ads for each client.
-- =============================================================================

create table business_profiles (
  user_id          uuid primary key references profiles (id) on delete cascade,
  business_name    text,
  industry         text,
  description      text,
  products_services text,
  target_audience  text,
  brand_voice      text,
  brand_colors     text,
  logo_path        text,          -- path in the 'assets' storage bucket
  website          text,
  instagram_handle text,
  extra            jsonb not null default '{}'::jsonb,
  completed        boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger t_business_profiles_updated
  before update on business_profiles
  for each row execute procedure moddatetime (updated_at);

alter table business_profiles enable row level security;

create policy "business_profiles: owner all"
  on business_profiles for all
  using (user_id = auth.uid() or is_admin())
  with check (user_id = auth.uid() or is_admin());
