// The Docket — today's timed schedule. App home.
//
// If today's day_inputs row hasn't been built yet, show a single calm
// "Build my day" entry. Once she's been through the wizard, show the schedule.

import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  classify,
  buildSchedule,
  pickAtmCandidates,
} from "@/lib/daily-plan";
import { getItemsByBox, getDayInputs } from "@/lib/data";
import { CustomBlockForm } from "@/components/custom-block-form";
import { DocketDayRange } from "@/components/docket-day-range";
import { ScheduleWithNowLine } from "@/components/now-line";
import { UnsealGlow } from "@/components/unseal-glow";
import type { DayInputs } from "@/lib/types";
import { VAULT_SKIP_DROP_LANDING_COOKIE } from "@/lib/vault-nav";

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const DAY_GREETINGS = ["Today", "What we're holding today", "Just for today"];

export default async function DocketPage() {
  const date = todayISO();
  const cookieStore = await cookies();
  const skipDropLanding =
    cookieStore.get(VAULT_SKIP_DROP_LANDING_COOKIE)?.value === "1";

  const [counterItems, atmItems, dayRow, dropItems] = await Promise.all([
    getItemsByBox("COUNTER"),
    getItemsByBox("ATM"),
    getDayInputs(date),
    getItemsByBox("DROP"),
  ]);

  // Anything in The Drop → open there first (fresh session / login). Once you’ve
  // built today, respect “take me to Today” via cookie from nav / wizard exit.
  if (dropItems.length > 0 && (!dayRow || !skipDropLanding)) {
    redirect("/drop");
  }

  // No day built yet → calm entry.
  if (!dayRow) {
    return <BuildPrompt />;
  }

  const inputs: DayInputs = {
    date,
    hoursAvailable: Number(dayRow.hours_available),
    creative: dayRow.creative as DayInputs["creative"],
    probSolv: dayRow.prob_solv as DayInputs["probSolv"],
    tieBreak: dayRow.tie_break as DayInputs["tieBreak"],
    endOfDay: dayRow.end_of_day,
  };

  const classified = classify(counterItems);
  // Only schedule ATM withdrawals the user actually picked today.
  const atmPicks = atmItems
    .filter((i) => i.todayOrder !== null)
    .sort((a, b) => (a.todayOrder ?? 0) - (b.todayOrder ?? 0));
  const now = new Date();
  // Pass `now` so the schedule clamps to the current time when she
  // (re)builds the day mid-morning — no blocks in the past.
  const blocks = buildSchedule({ classified, atmPicks, inputs, now });
  const stateById = new Map(
    [...counterItems, ...atmItems].map((i) => [i.id, i.state ?? "upcoming"]),
  );

  // Overflow: when scheduled minutes exceed the day she said she has.
  const scheduledMinutes = blocks.reduce((a, b) => a + b.minutes, 0);
  const availableMinutes = inputs.hoursAvailable * 60;
  const overflowMinutes = Math.max(0, scheduledMinutes - availableMinutes);

  const greeting = DAY_GREETINGS[new Date().getDate() % DAY_GREETINGS.length];

  return (
    <div className="mx-auto max-w-[820px] px-4 py-6 md:px-10 md:py-10">
      <UnsealGlow />
      <div className="flex items-baseline justify-between">
        <div>
          <div className="serif-h text-[28px] text-ink md:text-[32px]">
            {greeting}.
          </div>
          <DocketDayRange
            date={inputs.date}
            hoursAvailable={inputs.hoursAvailable}
            endOfDay={inputs.endOfDay}
          />
        </div>
        <Link
          href="/build?step=1"
          title="Press g b"
          className="font-mono text-[10px] tracking-[0.18em] text-ink-mute hover:text-brass"
        >
          ↻ REBUILD DAY
        </Link>
      </div>

      {overflowMinutes > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-sm border border-rust/40 bg-rust/5 px-4 py-3 text-[12px] text-ink-dim">
          <span className="font-mono text-[10px] tracking-wider text-rust">
            ⚠ OVERFLOW
          </span>
          <span>
            Scheduled {fmtHrs(scheduledMinutes)} but you said you have{" "}
            {fmtHrs(availableMinutes)} —{" "}
            <strong className="text-rust">{fmtHrs(overflowMinutes)}</strong>{" "}
            past end-of-day.
          </span>
          <Link
            href="/counter"
            className="ml-auto font-mono text-[10px] tracking-[0.18em] text-rust hover:underline"
          >
            TRIM COUNTER →
          </Link>
        </div>
      )}

      <div className="mt-8 space-y-2">
        {blocks.length === 0 && (
          <p className="rounded-sm border border-dashed border-vault-line/60 bg-vault-panel/20 px-4 py-6 text-center text-ink-mute">
            Nothing scheduled. Add a custom block below, or rebuild the day.
          </p>
        )}
        {blocks.map((b, i) => (
          <ScheduleWithNowLine
            key={b.itemId}
            block={b}
            nextStart={blocks[i + 1]?.start}
            state={(stateById.get(b.itemId) as any) ?? "upcoming"}
          />
        ))}
        <CustomBlockForm date={inputs.date} />
      </div>
    </div>
  );
}

function BuildPrompt() {
  return (
    <div className="relative mx-auto flex min-h-[80vh] max-w-[640px] flex-col items-start justify-center px-4 md:px-10">
      <div className="absolute inset-0 -z-0 lamp-glow opacity-50" />
      <div className="relative">
        <div className="eyebrow">— Good morning —</div>
        <h1 className="serif-h mt-3 text-[36px] leading-tight text-ink md:text-[48px]">
          Let&rsquo;s build today.
        </h1>
        <p className="mt-3 max-w-[480px] text-ink-dim">
          Six quick questions, the same ones you&rsquo;ve been answering each
          morning. The schedule comes from your answers.
        </p>
        <Link
          href="/build?step=1"
          className="brass-button mt-10 inline-block px-8 py-3 font-mono text-[10px] tracking-[0.24em] text-[#2a1c08]"
        >
          BUILD TODAY
        </Link>
        <p className="mt-4 font-mono text-[10px] tracking-[0.18em] text-ink-mute">
          Or{" "}
          <Link href="/vault" className="hover:text-brass">
            open the vault
          </Link>{" "}
          to browse without building.
        </p>
      </div>
    </div>
  );
}

function fmtHrs(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

