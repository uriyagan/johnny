# Johnny

Autonomous AI campaign-management SaaS for Israeli SMBs. Chat-first, 100% Hebrew, RTL.

## Stack
- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** + `tailwindcss-rtl`
- **Supabase** (Postgres, Auth, Storage)
- **Gemini** (text + image) — behind a provider interface
- **Stripe** (fully embedded billing, no redirects)
- **Resend** (transactional email) · **Cloudflare Workers** (cron)

> Meta Ads only in v1. The marketing website is out of scope.

## Getting started
```bash
npm install
cp .env.example .env.local   # fill in your keys
npm run dev
```

## Scripts
| Command | Purpose |
|---------|---------|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript check |
| `npm run db:types` | Regenerate `src/types/database.ts` from Supabase |

## Project layout
```
src/
  app/          # routes (client app, admin, auth, api) — RTL root layout
  lib/          # supabase clients, env validation, provider interfaces
  components/   # UI
  mocks/        # mock Meta/Stripe/Gemini layers (toggle via NEXT_PUBLIC_USE_MOCKS)
  types/        # generated DB types
supabase/
  migrations/   # versioned SQL schema (source of truth)
```

## Roadmap
M0 Scaffold ✅ · M1 Schema ✅ · M2 RTL shell + auth ✅ · M3 Mock layer ✅ · M4 Chat + Gemini ✅ ·
M5 Meta onboarding · M6 Embedded billing · M7 The 5 pillars · M8 Super Admin · M9 Go-live.
