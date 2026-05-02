# AGENTS.md — How to work in The Vault

This file tells coding assistants (Claude, Cursor, etc.) how to work in this repo on the user's behalf.

**The user is not a developer.** They speak in plain English. Your job is to translate.

---

## Who the user is

The Vault is an ADHD-friendly task manager. It replaces a 14-tab Google Sheet + Python pipeline with a single Next.js app. The user runs multiple businesses, has ADHD, and wants to keep customizing this app over time without learning developer vocabulary, running commands, or reading build errors.

When the user says something to you, **assume they're describing the goal in plain English** and you do the technical work. Confirm in plain English when you're done. Do not show command output unless they ask.

---

## How to interpret what they say

| If the user says… | Do this |
|---|---|
| "Try this locally" / "Show me before I commit" / "Let me see it" / "Test this" | Run `npm run dev`. Tell them: *"Local preview running at http://localhost:3000."* If port 3000 is in use, pick another and tell them. |
| "Show me on my phone" / "Try it on my phone first" | Push to a feature branch named `try/<short-description>`. Vercel builds a preview URL automatically. Tell them the URL when the build finishes. Don't push to `main`. |
| "Ship it" / "Make it live" / "Push this" / "Push this live" | `git add -A && git commit -m '<short summary>' && git push origin main`. Vercel auto-deploys (~60 sec). Tell them when it's live. |
| "Save my work" | Commit but do **not** push. *"Saved as a checkpoint, not live yet."* |
| "Undo my last change" | Uncommitted: `git restore <files>`. Committed but not pushed: `git reset --soft HEAD~1`. Pushed and live: open Vercel rollback (or `git revert`). Tell them in plain English what you did. |
| "What did I change?" | `git diff` — but **summarize in plain English**, don't paste the diff. |
| "Stop the preview" | Kill the running dev server. |
| "Make it look more like X" | Find the styling layer (Tailwind classes, CSS vars in `app/globals.css`) and adjust. Show them with a local preview before committing unless they said "ship it." |
| "Why is it doing X?" | Investigate, then explain in plain English. **Don't paste stack traces.** |
| "Add a new box" | The user adds boxes themselves in **Settings → Boxes**. If they're asking for code support, point them there. Boxes are user-configured data, never hardcoded. |
| "Add a new category" / "It's missing X on the menu" | Same — they edit it in **Settings → Boxes**. The ATM page categories are box keys; Settings is the source of truth. |
| "Resync from my sheet" / "Pull in everything fresh" | Run `npm run migrate:sheet <userId>`. The script wipes and re-imports — no duplicates. Captures and day-level settings are preserved. |
| "I want to add to my sheet without overwriting" | Run with the additive flag: `npx tsx scripts/migrate-from-sheet.ts <userId> --no-clean`. |
| "Add to today" (about an item) | Sets `today_order` on the item. The Counter page and the wizard's Step 5 review have a `+ TODAY` toggle for this. |
| "Pick this for today" (about an ATM item) | Same — the ATM page calls it "Withdraw"; same `today_order` mechanic. |
| "Move this to 3pm" / "Pin this at X" | Set `pinned: true` and `scheduledStart` to that time. Schedule auto-flows around pinned blocks. |
| "Done" / "Cross it off" | Mark `state: 'done'`. The schedule block toasts "Done. Still safe in your vault." — the item stays in its box. |
| "Skip this" / "Not doing this today" | Mark `state: 'skipped'`. The block stays visible but dimmed; remaining schedule shifts. |
| "Close the vault" / "Seal it" | Transition to the Sealed state (`/sealed`). Hides daily surfaces; deposit slot stays active. Doesn't change data. |
| "Open the vault" / "Unseal it" | Exit Sealed, return to Today. |
| "Deposit X" / "Drop in vault" | Create an item with `box: 'DROP'`, `title: 'X'`. The user can dictate this from Siri, the bookmarklet, the mail slot (⌘K), or the deposit page. |
| "Move X to Y" | Update the item's `box` field. Triage from Drop sets destination + box at the same time. |

---

## Things the user never has to know

Don't make them think about:
- `git`, `npm`, `vercel`, branches, commits, hashes, rebases, merges
- Environment variables (already set up — never ask them)
- Stack traces, error codes, build logs
- TypeScript errors (you fix them silently)
- Linting (auto-fix on save — fix any remaining yourself)
- Database migrations (you run them — describe the change in plain English)

If a step requires technical knowledge, **you do it**. If something is genuinely a decision (e.g. "I see two ways — A or B?"), ask in plain English with no jargon.

---

## How to talk to the user

- One plain sentence at a time. No bullet lists unless they asked.
- Use their words back to them ("the heading" not "h1 element").
- Confirm before destructive actions: *"This will delete the row from your live vault — okay?"*
- After a deploy: *"Live now. Want me to open it?"*
- After local: *"Running on your computer at localhost:3000."*
- **Never** describe a problem with the cause if you can describe it with the symptom and a fix. ("The deploy didn't work — let me try again" is better than "TypeScript error in app/page.tsx line 47.")

---

## Repo conventions

- **Stack:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript strict · Tailwind 4 · Supabase · Vercel.
- **Files match URLs.** `app/drop/page.tsx` is `/drop`. Don't create routing config.
- **One file per concept.** A `TodayToggle` component lives in `components/today-toggle.tsx`. Don't bundle.
- **Server Actions** for mutations (in `lib/actions.ts`). Co-locate where it makes sense.
- **`/api/capture`** is the only REST route — the iPhone Shortcut and bookmarklet hit it with bearer auth.
- **Naming:** plain English. `daily-plan.ts` not `DPSchema.ts`.
- **Comments:** describe WHY, not what. Names make the what obvious.
- **No new abstractions** unless you can name three concrete uses. When in doubt, repeat code.
- **No new dependencies** unless the user asked for the feature they unlock. Adding a library is a decision, not a default.

---

## Repo layout

```
app/
  page.tsx                Today (the Docket — daily schedule)
  drop/                   Triage inbox
  atm/                    Energy-matched optional pulls
  counter/                Obligations
  vault/, vault/[box]/    Long-term storage
  records/[slug]/         Markdown records (Notes, Measurements, etc.)
  build/                  Morning wizard
  sealed/                 Closing-of-the-vault ceremonial state
  settings/               Settings hub
    boxes/                User-configured box list
    records/              User-configured record list
    energies/             User-configured energy list
    members/              Vault membership (invite / role / remove)
    connect/              iPhone + Mac setup walkthrough
  api/capture/            Bearer-auth POST endpoint for shortcuts
  deposit/                /deposit?t=… mail-slot landing for the bookmarklet
components/               UI (one file per concept)
lib/
  actions.ts              Every Server Action
  data.ts                 Read-side helpers
  daily-plan.ts           classify + buildSchedule (THE schedule logic)
  categories.ts           getBoxes / getRecords / getEnergies + types
  shortcuts.tsx           Keyboard shortcut hook + cheat-sheet registry
  types.ts                Domain types
scripts/
  migrate-from-sheet.ts   Sheet → Supabase resync (clean by default)
  apple-shortcut.md       Action Button setup recipe
supabase/migrations/      SQL schema (run in order)
docs/
  SPEC.md                 Original app spec (historical)
```

---

## Invariants — DO NOT BREAK these

1. **Settings is the source of truth for labels.**
   - Pages must look up labels in `settings.boxes` / `settings.records` / `settings.energies`. If the lookup misses, render "Uncategorized" or a not-found page. **Do not** prettify keys on the page side to fabricate a label.
   - All the "what's a category" lists come from settings — none hardcoded anywhere in the app.

2. **Reserved counter-station keys never appear in user-configurable lists.**
   - `DROP`, `ATM`, `COUNTER`, `DOCKET` are top-level pages, not categories. `RESERVED_BOX_KEYS` in `lib/categories.ts` filters them defensively at multiple gates.

3. **Counter items opt IN to today.**
   - `today_order` is the universal "on today's plan" flag. Default is `null` (not on today). The wizard's Step 5 review and the Counter page have a `+ TODAY` toggle. Don't reintroduce opt-out — at 35–40 admin items it's unworkable.

4. **The schedule starts at `dayStart` and clamps to `now`.**
   - `dayStart = endOfDay − hoursAvailable`. If "now" is later than dayStart on the same day, schedule starts at "now" (no past blocks). Don't reintroduce the old end-of-day-anchor mode.

5. **`otherAdmin` (counter items with neither urgent nor must) is included in the schedule.**
   - Was being silently dropped in an earlier version. Make sure any change to `buildSchedule` keeps it in `adminPile`.

6. **Done doesn't delete.**
   - Marking a schedule block done sets `state: 'done'` and toasts "Still safe in your vault." Items stay in their box. Don't change this behavior.

7. **The migration script is a clean resync by default.**
   - `tsx scripts/migrate-from-sheet.ts <userId>` wipes and re-imports — no duplicates. `--no-clean` for the rare additive case. Captures and day-level settings (`default_hours`, `default_end_of_day`, `stressor_anchor_minutes`) are preserved.

8. **No "Tracy"-style copy or hardcoded data.**
   - The app should work for any user out of the box. Box keys, records, energies, day defaults are all configurable per-vault.

---

## The data model

```ts
// One row in the items table — anything that gets stored.
type Item = {
  id: string
  box: BoxKey                      // 'DROP' | 'ATM' | 'COUNTER' | 'DOCKET' | <user key>
  title: string

  // Counter-shape (obligations)
  area?: string | null             // box key — the category axis on counter rows
  urgent: boolean
  must: boolean

  // ATM-shape (energy-matched options)
  category?: string | null         // box key — same category axis, on ATM items
  energy?: string | null           // user-defined energy key (CREATIVE, PROB-SOLV, …)

  // Common
  minutes?: number | null
  todayOrder?: number | null       // null = not on today's plan; rank when present
  potential?: 1 | 2 | 3 | 4 | 5 | null
  person?: string | null
  tag?: string | null
  notes?: string | null

  // Records (text-first content)
  body?: string | null             // markdown when item is a Record

  // Schedule placement (set when on today's plan)
  scheduledStart?: string | null
  scheduledEnd?: string | null
  actualStart?: string | null
  actualEnd?: string | null
  state?: 'upcoming' | 'active' | 'done' | 'skipped' | 'overrun' | null
  pinned: boolean

  createdAt: string
  modifiedAt: string
  deletedAt?: string | null        // soft delete; reversible from DB
}
```

`settings` row holds `boxes`, `records`, `energies` (all jsonb arrays of `{key, label, ...}`), plus `default_hours`, `default_end_of_day`, `stressor_anchor_minutes`, `capture_token`, `sealed`.

---

## The daily plan logic (don't drift)

Defined once in `lib/daily-plan.ts`:

- Stressors = `urgent && must`
- Time-sensitive = `urgent && !must`
- Must-do = `must && !urgent`
- Other admin = neither flag (long tail)
- Stressor anchor threshold (default 91 min, configurable): when stressors hit this, admin runs first thing in the morning; otherwise ATM picks come first and admin lands after.
- Both branches start at `dayStart` (or `now` if later, same day).
- ATM picks selected by `pickAtmCandidates` based on `creative` / `probSolv` / `tieBreak` from the wizard.

Changing this logic requires a deliberate, named change. Don't tweak for cosmetic reasons.

---

## Common workflows

### Going live (first time)

1. Create Supabase project; run every migration in `supabase/migrations/` in order.
2. User signs in once at the deployed URL — captures their `auth.uid`.
3. Run `npm run migrate:sheet <their-uid>` to import their sheet (or skip; they can start fresh).
4. They review **Settings → Boxes / Records / Energies**, rename labels.
5. They set **Settings → General** (default hours, end of day).
6. They walk through **Settings → Connect** to wire iPhone Siri / Mac dock / bookmarklet.

### Re-syncing the sheet later

```bash
npm run migrate:sheet <userId>             # clean resync (no duplicates)
npm run migrate:sheet <userId> --no-clean  # additive
```

### Tests / build

```bash
npm test          # vitest — daily-plan logic
npm run build     # type-check + production build
```

If `npm test` fails, the failing case usually points at one of the invariants above.

### Pushing changes

The user almost never wants you to push without their explicit "ship it" / "push it" / "make it live." Unless they say so, commit locally and offer to preview.

---

## When in doubt

Ask the user. Use their words. Make the smallest change that achieves the goal. Don't refactor.
