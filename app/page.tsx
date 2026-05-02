// The Docket — today's timed schedule. App home.
//
// If today's day_inputs row hasn't been built yet, show a single calm
// "Build my day" entry. Once she's been through the wizard, show the schedule.

import Link from "next/link";
import {
  classify,
  buildSchedule,
  pickAtmCandidates,
} from "@/lib/daily-plan";
import { getItemsByBox, getDayInputs } from "@/lib/data";
import { CustomBlockForm } from "@/components/custom-block-form";
import { ScheduleWithNowLine } from "@/components/now-line";
import { UnsealGlow } from "@/components/unseal-glow";
import type { DayInputs } from "@/lib/types";

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const DAY_GREETINGS = ["Today", "What we're holding today", "Just for today"];

export default async function DocketPage() {
  const date = todayISO();
  const [counterItems, atmItems, dayRow] = await Promise.all([
    getItemsByBox("COUNTER"),
    getItemsByBox("ATM"),
    getDayInputs(date),
  ]);

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
  const blocks = buildSchedule({ classified, atmPicks, inputs });
  const stateById = new Map(
    [...counterItems, ...atmItems].map((i) => [i.id, i.state ?? "upcoming"]),
  );

  const greeting = DAY_GREETINGS[new Date().getDate() % DAY_GREETINGS.length];

  return (
    <div className="mx-auto max-w-[820px] px-4 py-6 md:px-10 md:py-10">
      <UnsealGlow />
      <div className="flex items-baseline justify-between">
        <div>
          <div className="serif-h text-[28px] text-ink md:text-[32px]">
            {greeting}.
          </div>
          <p className="mt-1 text-[12px] text-ink-mute">
            {fmt12(blocks[0]?.start)} – {fmt12HHMM(inputs.endOfDay, inputs.date)}
          </p>
        </div>
        <Link
          href="/build?step=1"
          className="font-mono text-[10px] tracking-[0.18em] text-ink-mute hover:text-brass"
        >
          ↻ REBUILD DAY
        </Link>
      </div>

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

function fmt12(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
}

// "16:30" / "4:30 PM" → "4:30 PM"
function fmt12HHMM(t: string, date: string) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!m) return t;
  const iso = `${date}T${t.padStart(5, "0")}:00`;
  return fmt12(iso);
}
