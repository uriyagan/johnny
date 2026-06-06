# Johnny — Supabase (Milestone 1)

The data layer. Defined entirely in versioned SQL migrations so it's reproducible and CI-friendly.

## Files
- `migrations/0001_init.sql` — enums, tables, RLS, triggers, `is_admin()`, auto-profile-on-signup.
- `migrations/0002_storage.sql` — private `assets` bucket + owner-scoped storage policies (Pillar 4).
- `seed.sql` — minimal local-only seed (promote a user to admin). Rich mock data lives in `src/mocks` (Milestone 3).

## Schema at a glance
| Table | Purpose |
|-------|---------|
| `profiles` | 1:1 with `auth.users`; holds role (client/admin), business name, locale. |
| `subscriptions` | Stripe-synced tier + status (1 row/tenant). Tier→account limit via `tier_account_limit()`. |
| `ad_accounts` | Connected Meta accounts. **Tokens go to Vault**, only a reference id is stored. |
| `campaigns` | Per-account campaigns; holds raw + Hebrew-translated rejection reasons (Pillar 3). |
| `budget_caps` | Monthly hard cap + threshold + pause flag (Pillar 1). |
| `chat_sessions` / `chat_messages` | Chat-first interface; `intent` jsonb holds Gemini-parsed intent. |
| `assets` | Creative Asset Hub metadata; files live in the `assets` storage bucket (Pillar 4). |
| `crm_feedback` | Proactive lead-quality loop (Pillar 5). |
| `notifications` | In-app + Resend email mirror. |
| `webhook_events` | Idempotency log for Stripe/Meta (unique `source + external_event_id`). |
| `admin_audit_log`, `api_health`, `kill_switches` | Super Admin panel (§6). |

## Security model
- RLS on every table. Tenants see only rows where `user_id = auth.uid()`.
- `is_admin()` grants admins full read/override.
- `webhook_events` / `api_health`: no client access — written by the **service-role** key (bypasses RLS) from server/cron only.
- Subscription rows are read-only to clients; only Stripe webhooks (service role) write them.

## Apply locally
```bash
supabase init           # once, if not already initialized
supabase start          # boots local Postgres + Studio
supabase db reset        # applies all migrations + seed.sql
```

## Generate TypeScript types (next step of M1)
```bash
supabase gen types typescript --local > src/types/database.ts
```
This produces the typed client used everywhere in the app. It runs only after the schema is approved, so we don't regenerate against a moving target.
