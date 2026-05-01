// The Docket — today's timed schedule. App home.

import {
  classify,
  buildSchedule,
  thresholdCallout,
  pickTillCandidates,
} from "@/lib/daily-plan";
import { getItemsByBox, getDayInputs, defaultDayInputs } from "@/lib/data";
import { fixtureItems } from "@/lib/fixtures";
import { ScheduleBlock } from "@/components/schedule-block";
import type { DayInputs } from "@/lib/types";

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function DocketPage() {
  const date = todayISO();
  const [drawer, till, dayRow] = await Promise.all([
    getItemsByBox("DRAWER"),
    getItemsByBox("TILL"),
    getDayInputs(date),
  ]);

  const drawerItems = drawer.length ? drawer : fixtureItems.filter((i) => i.box === "DRAWER");
  const tillItems = till.length ? till : fixtureItems.filter((i) => i.box === "TILL");
  const dayRaw = dayRow ?? defaultDayInputs(date);
  const inputs: DayInputs = {
    date,
    hoursAvailable: Number(dayRaw.hours_available),
    creative: dayRaw.creative as DayInputs["creative"],
    probSolv: dayRaw.prob_solv as DayInputs["probSolv"],
    tieBreak: dayRaw.tie_break as DayInputs["tieBreak"],
    endOfDay: dayRaw.end_of_day,
  };

  const classified = classify(drawerItems);
  const tillPicks = pickTillCandidates(tillItems, inputs).slice(0, 2);
  const blocks = buildSchedule({ classified, tillPicks, inputs });
  const callout = thresholdCallout(classified, inputs);

  return (
    <div className="mx-auto max-w-[1440px] px-10 py-8">
      <DayInputsBar inputs={inputs} />

      <div className="mt-8 grid grid-cols-[600px_1fr] gap-8">
        <aside>
          <h2 className="eyebrow">— What has to happen —</h2>
          <p className="mt-2 text-ink-dim">{callout}</p>

          <Section title="Stressors" tone="rust">
            {classified.stressors.length === 0 && <Empty />}
            {classified.stressors.map((it) => (
              <DrawerRow
                key={it.id}
                title={it.title}
                area={it.area}
                minutes={it.minutes}
              />
            ))}
          </Section>
          <Section title="Time-sensitive" tone="rust-soft">
            {classified.timeSensitive.length === 0 && <Empty />}
            {classified.timeSensitive.map((it) => (
              <DrawerRow
                key={it.id}
                title={it.title}
                area={it.area}
                minutes={it.minutes}
              />
            ))}
          </Section>
          <Section title="Must-do" tone="brass">
            {classified.mustDo.length === 0 && <Empty />}
            {classified.mustDo.map((it) => (
              <DrawerRow
                key={it.id}
                title={it.title}
                area={it.area}
                minutes={it.minutes}
              />
            ))}
          </Section>

          <h2 className="eyebrow mt-8">— From the Till —</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {tillItems.map((it) => (
              <div
                key={it.id}
                className="rounded-sm border border-vault-line bg-vault-panel/40 p-3"
              >
                <div className="eyebrow">
                  {it.category} · {it.minutes} min
                </div>
                <div className="mt-1 serif-h text-[15px]">{it.title}</div>
              </div>
            ))}
          </div>
        </aside>

        <section>
          <h2 className="serif-h text-[22px]">Today&rsquo;s Schedule</h2>
          <p className="eyebrow mt-1">
            {fmt12(blocks[0]?.start)} → {fmt12(blocks[blocks.length - 1]?.end)} ·{" "}
            {inputs.hoursAvailable} HRS
          </p>
          <div className="mt-4 space-y-2">
            {blocks.map((b) => (
              <ScheduleBlock key={b.itemId} block={b} />
            ))}
            <button className="w-full rounded-sm border border-dashed border-brass/40 py-3 font-mono text-[10px] tracking-[0.24em] text-brass/70 hover:border-brass">
              + ADD A CUSTOM BLOCK
            </button>
            <div className="mt-4 flex items-center gap-3 border-t border-brass/30 pt-3 text-[11px] text-ink-mute">
              <span className="eyebrow">END OF DAY</span>
              <span>{inputs.endOfDay}</span>
            </div>
          </div>
        </section>
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

function DayInputsBar({ inputs }: { inputs: DayInputs }) {
  return (
    <div className="flex flex-wrap items-end gap-6 rounded-sm border border-vault-line bg-vault-panel/40 p-4">
      <Pill label="Hours available" value={`${inputs.hoursAvailable} hrs`} />
      <Pill label="Creative" value={`${inputs.creative} / 5`} />
      <Pill label="Problem-solv" value={`${inputs.probSolv} / 5`} />
      <Pill label="If equal" value={inputs.tieBreak} />
      <Pill label="End of day" value={inputs.endOfDay} />
    </div>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="eyebrow">{label}</span>
      <span className="serif-h text-[18px] text-ink">{value}</span>
    </div>
  );
}

function Section({
  title,
  tone,
  children,
}: {
  title: string;
  tone: "rust" | "rust-soft" | "brass";
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6">
      <div className="flex items-center gap-2">
        <span
          className={
            tone === "rust"
              ? "h-2 w-2 rounded-full bg-rust"
              : tone === "rust-soft"
                ? "h-2 w-2 rounded-full bg-rust/50"
                : "h-2 w-2 rounded-sm bg-brass"
          }
        />
        <h3 className="eyebrow">{title}</h3>
      </div>
      <div className="mt-2 space-y-2">{children}</div>
    </div>
  );
}

function DrawerRow({
  title,
  area,
  minutes,
}: {
  title: string;
  area?: string | null;
  minutes?: number | null;
}) {
  return (
    <div className="flex items-center justify-between rounded-sm border border-vault-line/60 bg-vault-panel/40 px-3 py-2">
      <div className="flex items-center gap-3">
        {area && (
          <span className="rounded-sm border border-brass/40 px-1.5 py-0.5 font-mono text-[9px] tracking-wider text-brass">
            {area}
          </span>
        )}
        <span className="text-ink">{title}</span>
      </div>
      <span className="font-mono text-[11px] text-ink-mute">{minutes} min</span>
    </div>
  );
}

function Empty() {
  return <div className="text-[12px] italic text-ink-mute">(none)</div>;
}
