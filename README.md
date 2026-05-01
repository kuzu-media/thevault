# The Vault

ADHD-friendly task manager built around a banking metaphor: deposit, store, and pull from a vault. Replaces a 14-tab Google Sheet + Python pipeline with a single Next.js app.

## Quick start

```bash
npm install
cp .env.local.example .env.local        # then fill it in
npm run dev                              # http://localhost:3000
```

The UI renders against fixtures until Supabase is wired up.

## Stack

- Next.js 16 (App Router) · React 19 · Tailwind 4
- Supabase (Postgres + Auth + RLS)
- Vercel
- Apple Shortcut for Action-Button capture

## Layout

```
app/                Routes — one per surface
components/         UI primitives (top-bar, schedule-block, box-card)
lib/
  daily-plan.ts     Port of plan_day.py (classify + buildSchedule)
  fixtures.ts       Local-dev data
  supabase/         server + client helpers
  types.ts          Domain types
scripts/
  migrate-from-sheet.ts   One-shot Sheet → Supabase import
  apple-shortcut.md       Action Button setup recipe
supabase/migrations/      SQL schema
docs/
  SPEC.md           Full app spec
  AGENTS.md         How a coding assistant should work in this repo
  interview.md      Open questions for Tracy
  screens/          Paper artboard exports (design reference)
```

## Going live

1. **Supabase** — create a Tracy-owned project, run `supabase/migrations/0001_init.sql`, drop the URL / anon key / service-role key into `.env.local`.
2. **Sign Tracy in once** to seed her `auth.users` row, grab her uid.
3. **Migrate the Sheet** — `npm run migrate:sheet <userId>`.
4. **Vercel** — push to GitHub (Tracy-owned), import in Vercel, set the same env vars.
5. **iPhone** — follow [scripts/apple-shortcut.md](scripts/apple-shortcut.md).

## Tests

```bash
npm test                                 # daily-plan logic
npm run build                            # full type-check + production build
```
