import { getAllItems } from "@/lib/data";
import { fixtureItems } from "@/lib/fixtures";
import { BoxCard } from "@/components/box-card";

const COUNTER = [
  { key: "DROP", title: "The Drop", meta: "Unsorted thoughts", number: "№ 01", href: "/drop", accent: "rust" as const },
  { key: "DOCKET", title: "The Docket", meta: "On the counter", number: "№ 02", href: "/", accent: "rust" as const },
  { key: "TILL", title: "The Till", meta: "Options", number: "№ 03", href: "/till", accent: "teal" as const },
  { key: "DRAWER", title: "The Drawer", meta: "Admin pull", number: "№ 04", href: "/drawer", accent: "teal" as const },
];

const BOXES = [
  { key: "SWB_PLAN", title: "SWB Plan", meta: "Strategic rows", number: "№ 05" },
  { key: "PCS_DELEGATION", title: "PCS Delegation", meta: "For Ron", number: "№ 06" },
  { key: "PCS_IDEAS", title: "PCS Ideas", meta: "Work ideas", number: "№ 07" },
  { key: "READ_RESEARCH", title: "Read & Research", meta: "URLs & refs", number: "№ 08" },
  { key: "HEALTH_IDEAS", title: "Health Ideas", meta: "Aspirational", number: "№ 09" },
  { key: "MISC_IDEAS", title: "Misc Ideas", meta: "Aspirational", number: "№ 10" },
  { key: "RON", title: "Ron's Queue", meta: "Delegation", number: "№ 11" },
];

const RECORDS = [
  { key: "MEASUREMENTS", title: "Measurements", meta: "Weekly log", number: "№ 12", href: "/records/measurements" },
  { key: "LIFTING", title: "Lifting", meta: "Workout plan", number: "№ 13", href: "/records/lifting" },
  { key: "PCS_MISC", title: "PCS Misc", meta: "Promo schedule", number: "№ 14", href: "/records/pcs-misc" },
  { key: "NOTES", title: "Notes", meta: "Manifesto", number: "№ 15", href: "/records/notes" },
];

export default async function VaultInteriorPage() {
  const all = await getAllItems();
  const source = all.length ? all : fixtureItems;
  const counts = new Map<string, number>();
  for (const it of source) counts.set(it.box, (counts.get(it.box) ?? 0) + 1);

  return (
    <div className="mx-auto max-w-[1440px] px-10 py-8">
      <div className="eyebrow">— 4 Stations · 7 Boxes · 4 Records —</div>
      <h1 className="serif-h mt-2 text-[40px] leading-tight">Welcome to the bank.</h1>
      <p className="text-ink-dim">
        {source.length} items in safe storage. Browse to find, open to work.
      </p>

      <Header label="The Counter" sub="where today's plan comes from" />
      <Grid>
        {COUNTER.map((c) => (
          <BoxCard
            key={c.key}
            title={c.title}
            meta={c.meta}
            number={c.number}
            count={counts.get(c.key) ?? 0}
            href={c.href}
            accent={c.accent}
          />
        ))}
      </Grid>

      <Header label="The Boxes" sub="categorized task collections · backlog you draw from" />
      <Grid>
        {BOXES.map((b) => (
          <BoxCard
            key={b.key}
            title={b.title}
            meta={b.meta}
            number={b.number}
            count={counts.get(b.key) ?? 0}
            href={`/vault/${b.key.toLowerCase().replace(/_/g, "-")}`}
          />
        ))}
        <NewBoxTile />
      </Grid>

      <Header label="The Records" sub="reference, logs, manifesto · not tasks, don't roll up" />
      <Grid>
        {RECORDS.map((r) => (
          <BoxCard
            key={r.key}
            title={r.title}
            meta={r.meta}
            number={r.number}
            href={r.href}
          />
        ))}
      </Grid>
    </div>
  );
}

function Header({ label, sub }: { label: string; sub: string }) {
  return (
    <div className="mt-10 flex items-baseline gap-3">
      <span className="eyebrow text-rust">— {label} —</span>
      <span className="text-[12px] italic text-ink-mute">{sub}</span>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="mt-4 flex flex-wrap gap-4">{children}</div>;
}

function NewBoxTile() {
  return (
    <div className="flex h-[200px] w-[260px] flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-brass/40 text-brass/60 transition hover:border-brass">
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="10" stroke="currentColor" />
        <path d="M11 6v10M6 11h10" stroke="currentColor" />
      </svg>
      <div className="serif-h text-[18px]">New deposit box</div>
      <div className="font-mono text-[10px] text-ink-mute">give it a number, name, color</div>
    </div>
  );
}
