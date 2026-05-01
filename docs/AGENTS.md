# AGENTS.md — Instructions for Cursor (and other coding assistants)

This file tells you (Cursor) how to work in this repo on Tracy's behalf. **Tracy is the user, not a developer.** She speaks in plain English. Your job is to translate.

---

## Who Tracy is

Tracy runs eight businesses. She has ADHD. She built the original Vault as a Google Sheet. She wants to keep customizing this app over time, but she does not want to learn developer vocabulary, run commands, or read build errors.

When Tracy says something to you, **assume she's describing the goal in plain English** and you do the technical work. Confirm in plain English when you're done. Do not show her command output unless she asks.

---

## How to interpret what she says

| If Tracy says… | Do this |
|---|---|
| "Try this locally" / "Show me before I commit" / "Let me see it" / "Test this" | Run `npm run dev`. Tell her: *"Local preview running at http://localhost:3000."* If port 3000 is in use, pick another and tell her. |
| "Show me on my phone" / "Try it on my phone first" | Push the current working changes to a feature branch named `try/<short-description>`. Vercel will build a preview URL automatically. Tell her the URL when the build finishes. Don't push to `main`. |
| "Ship it" / "Make it live" / "Push this" / "Push this live" | `git add -A && git commit -m '<short summary>' && git push origin main`. Vercel auto-deploys. Tell her when the build succeeds (~60 sec). |
| "Save my work" | Commit but do **not** push. *"Saved as a checkpoint, not live yet."* |
| "Undo my last change" | If uncommitted: `git restore <files>`. If committed but not pushed: `git reset --soft HEAD~1`. If pushed and live: open Vercel rollback (or `git revert`). Use judgment, tell her in plain English what you did. |
| "Roll back" / "Take it back" | Same as undo — pick the right level based on what's been pushed. |
| "What did I change?" | `git diff` — but **summarize in plain English**, don't paste the diff. |
| "Stop the preview" / "Stop the local thing" | Kill the running dev server. |
| "Show me how it looked yesterday" | Vercel keeps deploy history — find the URL of the previous deploy and give her a link. |
| "Add a new box" | Update Settings (data) if it's a runtime add. If it requires schema changes, edit the schema file, run a Supabase migration, and update the box-creation UI. **Confirm what you did in plain English.** |
| "Make it look more like X" / "Make this feel like X" | Find the styling layer (Tailwind classes, `vault.config.ts`, or theme tokens) and adjust. Show her with a local preview before committing unless she said "ship it." |
| "Why is it doing X?" | Investigate, then explain in plain English. **Don't paste stack traces.** |
| "I'm starting this" / "Working on this now" (about a schedule block) | Mark the block `active`, capture `actualStart = now`, drop the "now" line at this block's time. |
| "Done" / "Finished this" / "Cross it off" | Mark `done`, capture `actualEnd = now`, run schedule auto-adjust. If finished early, surface "breathing room" gap. If late, surface overflow prompt. |
| "Skip this" / "Not doing this today" | Mark `skipped`, remove from live timeline, move to "Skipped today" strip at bottom. Subsequent blocks shift earlier. |
| "Move this to 3pm" / "Pin this at X" | Set `pinned: true` and `scheduledStart` to that time. Auto-adjust flows around pinned blocks. |
| "Push the rest to tomorrow" (after overflow) | Move overflow blocks back to ADMIN/Till, clear their schedule fields. They'll show up tomorrow. |
| "Close the vault" / "Seal it" / "Lock up" / "I'm done for today" | Transition the app to the Sealed state (§4F). Hide daily surfaces; keep the deposit slot active. Don't change any data. |
| "Open the vault" / "Unseal it" / "I'm back" | Exit Sealed state, return to Today (or the last surface she was on). |
| "Deposit X" / "Add X to the vault" | Create an item in **The Drop** with `title = "X"` and a timestamp. Confirm: *"Deposited. It's in The Drop."* |
| "Move X to Y" (item to box, or box-to-Docket) | Update the item's `box` field. If moving into **The Docket**, ask whether to flag urgent/must. |
| "Send this to the Docket" / "Pull this onto the schedule" | Move an item from a Box / The Drop into The Docket. Optionally prompt for urgent/must flags. |
| "Pick this for today" / "Add to today" (about a Till item) | Mark the Till item picked. Auto-adjusts today's schedule. |

---

## Things Tracy never has to know

Don't make her think about:
- `git`, `npm`, `vercel`, branches, commits, hashes, rebases, merges
- Environment variables (already set up — never ask her for them)
- Stack traces, error codes, build logs
- TypeScript errors (you fix them silently)
- Linting (set up to auto-fix on save — fix any remaining issues yourself)
- Database migrations (you run them — tell her in plain English what changed)

If a step requires technical knowledge, **you do it**. If something is genuinely a decision Tracy should make (e.g. "I see two ways to interpret this — A or B?"), ask her in plain English with no jargon.

---

## How to talk to Tracy

- One plain sentence at a time. No bullet lists unless she asked.
- Use her words back to her ("the heading" not "h1 element").
- Confirm before destructive actions: *"This will delete the row from your live vault — okay?"*
- After a deploy: *"Live now at thevault.app. Want me to open it?"*
- After local: *"Running on your computer at localhost:3000."*
- **Never** describe a problem with the cause if you can describe it with the symptom and a fix. ("The deploy didn't work — let me try again" is better than "TypeScript error in app/today/page.tsx line 47.")

---

## Repo conventions

- **Stack:** Next.js 14+ App Router, TypeScript strict, Tailwind, Supabase, Vercel.
- **Files match URLs.** `app/today/page.tsx` is the `/today` page. Don't create routing config.
- **One file per concept.** A `TaskRow` component lives in `components/TaskRow.tsx`. Don't bundle.
- **Server Actions** for mutations (creating items, updating settings). Co-locate with the form that uses them.
- **`/api/capture`** is a route (not a Server Action) because the iPhone Shortcut hits it. Bearer token auth.
- **Naming:** plain English. `daily-plan.tsx` not `DPSchema.tsx`.
- **Comments:** describe WHY, not what. The names should make the what obvious.
- **Tailwind:** inline classes are fine. If a class string gets longer than ~10 utilities, extract to a `clsx` helper or a className constant — but don't over-abstract.
- **No new abstractions** unless you can name three concrete uses. When in doubt, repeat code.
- **No new dependencies** unless Tracy asks for the feature they unlock. Adding a library is a decision, not a default.

---

## The data model (don't drift)

```ts
// Item — one row of anything in any deposit box
type Item = {
  id: string
  box: string                      // 'ADMIN' | 'PCS_IDEAS' | 'TILL' | ...
  title: string
  area?: string                    // ADMIN's "category code" — ECO, SWB, etc.
  minutes?: number
  urgent: boolean
  must: boolean
  todayOrder?: number
  energy?: 'CREATIVE' | 'PROB-SOLV' | 'LEISURE' | 'PHYSICAL'  // TILL only
  category?: string
  potential?: 1 | 2 | 3 | 4 | 5    // PCS IDEAS
  person?: string
  tag?: 'Admin' | 'Creative' | 'Numbers' | 'Ron'
  notes?: string

  // Records (text-first; only set when item is a Record)
  body?: string                    // markdown content for Records (long-form text)

  // Schedule placement (only when on today's plan)
  scheduledStart?: Date            // computed start time
  scheduledEnd?: Date              // computed end time
  actualStart?: Date               // captured when block becomes 'active'
  actualEnd?: Date                 // captured when block becomes 'done'
  state?: 'upcoming' | 'active' | 'done' | 'skipped' | 'overrun'
  pinned: boolean                  // manual time-pin survives auto-adjust

  createdAt: Date
  modifiedAt: Date
  deletedAt?: Date                 // soft delete
}
```

If you find yourself wanting to add a field, ask Tracy first.

---

## The daily plan logic

Defined once in `lib/daily-plan.ts`. Don't re-implement elsewhere.

- Stressors = `urgent && must` items
- Time-sensitive = `urgent && !must`
- Must-do = `must && !urgent`
- Other admin = items with neither flag (long tail)
- Stressor anchoring threshold: 91 minutes (configurable in settings)
- Till (energy-matched picks) selected by the rules in `lib/till.ts`

Changing this logic requires a deliberate, named change. Don't tweak it for cosmetic reasons.

---

## When in doubt

Ask Tracy. Use her words. Make the smallest change that achieves the goal. Don't refactor.
