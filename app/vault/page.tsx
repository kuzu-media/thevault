import Link from "next/link";
import { getAllItems } from "@/lib/data";
import { fixtureItems } from "@/lib/fixtures";
import { BoxCard } from "@/components/box-card";

// Vault interior — STORAGE ONLY. Daily-action surfaces (Drop / Docket /
// ATM / Counter) live in the top nav; here we only show the things you
// put away.

const BOXES = [
  { key: "SWB_PLAN", title: "SWB Plan", meta: "Strategic rows" },
  { key: "PCS_DELEGATION", title: "PCS Delegation", meta: "For Ron" },
  { key: "PCS_IDEAS", title: "PCS Ideas", meta: "Work ideas" },
  { key: "READ_RESEARCH", title: "Read & Research", meta: "URLs & refs" },
  { key: "HEALTH_IDEAS", title: "Health Ideas", meta: "Aspirational" },
  { key: "MISC_IDEAS", title: "Misc Ideas", meta: "Aspirational" },
  { key: "RON", title: "Ron's Queue", meta: "Delegation" },
];

const RECORDS = [
  { key: "MEASUREMENTS", title: "Measurements", meta: "Weekly log", href: "/records/measurements" },
  { key: "LIFTING", title: "Lifting", meta: "Workout plan", href: "/records/lifting" },
  { key: "PCS_MISC", title: "PCS Misc", meta: "Promo schedule", href: "/records/pcs-misc" },
  { key: "NOTES", title: "Notes", meta: "Manifesto", href: "/records/notes" },
];

export default async function VaultInteriorPage() {
  const all = await getAllItems();
  const source = all.length ? all : fixtureItems;
  const counts = new Map<string, number>();
  for (const it of source) counts.set(it.box, (counts.get(it.box) ?? 0) + 1);

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 md:px-10">
      <h1 className="serif-h text-[28px] leading-tight md:text-[36px]">
        The vault.
      </h1>
      <p className="mt-1 text-[12px] text-ink-mute">
        Storage. Long-term places for ideas, plans, and reference.
      </p>

      <Header label="The Boxes" />
      <Grid>
        {BOXES.map((b) => (
          <BoxCard
            key={b.key}
            title={b.title}
            meta={b.meta}
            count={counts.get(b.key) ?? 0}
            href={`/vault/${b.key.toLowerCase().replace(/_/g, "-")}`}
          />
        ))}
        <NewBoxTile />
      </Grid>

      <Header label="The Records" />
      <Grid>
        {RECORDS.map((r) => (
          <BoxCard key={r.key} title={r.title} meta={r.meta} href={r.href} />
        ))}
      </Grid>
    </div>
  );
}

function Header({ label }: { label: string }) {
  return <div className="mt-10 eyebrow text-ink-mute">— {label} —</div>;
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="mt-4 flex flex-wrap gap-4">{children}</div>;
}

function NewBoxTile() {
  return (
    <Link
      href="/settings/boxes"
      className="flex h-[140px] w-full flex-col items-center justify-center gap-1 rounded-sm border border-dashed border-vault-line text-ink-mute transition hover:border-brass/40 hover:text-brass sm:w-[240px]"
    >
      <span className="serif-h text-[16px]">+ New box</span>
    </Link>
  );
}
