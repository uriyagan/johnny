-- =============================================================================
-- Johnny SaaS — admin two-factor codes (email OTP for the admin panel)
-- One active code per admin; written/read by the service role only.
-- =============================================================================

create table admin_2fa_codes (
  user_id    uuid primary key references profiles (id) on delete cascade,
  code_hash  text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table admin_2fa_codes enable row level security;
-- No policies → only the service role can read/write.
