// Vault interior — STORAGE ONLY. Daily-action surfaces (Drop / Docket /
// ATM / Counter) live in the top nav; here we only show the things you
// put away.
//
// Strictly configured-only:
//   Boxes   = settings.boxes (and only those)
//   Records = settings.records (and only those)
//
// Items whose `box` doesn't match a configured key are NOT rendered. They
// stay in the database (so historical data isn't destroyed), but the vault
// only surfaces what the user has explicitly set up. Edit the lists in
// Settings → Boxes / Records.

import Link from "next/link";
import { getAllItems } from "@/lib/data";
import { getBoxes, getRecords } from "@/lib/categories";
import { BoxCard } from "@/components/box-card";

export default async function VaultInteriorPage() {
  const [items, boxes, records] = await Promise.all([
    getAllItems(),
    getBoxes(),
    getRecords(),
  ]);

  // Per-key item count, restricted to configured keys.
  const counts = new Map<string, number>();
  const configuredKeys = new Set<string>([
    ...boxes.map((b) => b.key),
    ...records.map((r) => r.key),
  ]);
  for (const it of items) {
    if (!configuredKeys.has(it.box)) continue;
    counts.set(it.box, (counts.get(it.box) ?? 0) + 1);
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 md:px-10">
      <h1 className="serif-h text-[28px] leading-tight md:text-[36px]">
        The vault.
      </h1>
      <p className="mt-1 text-[12px] text-ink-mute">
        Storage. Long-term places for ideas, plans, and reference.
      </p>

      {boxes.length > 0 && (
        <>
          <Header label="The Boxes" />
          <Grid>
            {boxes.map((b) => (
              <BoxCard
                key={b.key}
                title={b.label}
                count={counts.get(b.key) ?? 0}
                href={`/vault/${slugify(b.key)}`}
              />
            ))}
            <NewTile href="/settings/boxes" label="+ New box" />
          </Grid>
        </>
      )}

      {boxes.length === 0 && records.length === 0 && (
        <div className="mt-10 rounded-sm border border-dashed border-vault-line/60 bg-vault-panel/20 p-8 text-center">
          <p className="text-ink-dim">No boxes or records yet.</p>
          <p className="mt-1 text-[12px] text-ink-mute">
            Set up your categories to start filing thoughts.
          </p>
          <div className="mt-4 inline-flex gap-2">
            <Link
              href="/settings/boxes"
              className="rounded-sm border border-brass/40 px-4 py-2 font-mono text-[10px] tracking-[0.18em] text-brass transition hover:bg-brass/10"
            >
              + ADD BOXES
            </Link>
            <Link
              href="/settings/records"
              className="rounded-sm border border-brass/40 px-4 py-2 font-mono text-[10px] tracking-[0.18em] text-brass transition hover:bg-brass/10"
            >
              + ADD RECORDS
            </Link>
          </div>
        </div>
      )}

      {records.length > 0 && (
        <>
          <Header label="The Records" />
          <Grid>
            {records.map((r) => (
              <BoxCard
                key={r.key}
                title={r.label}
                meta={r.meta || "reference"}
                href={`/records/${slugify(r.key)}`}
              />
            ))}
            <NewTile href="/settings/records" label="+ New record" />
          </Grid>
        </>
      )}
    </div>
  );
}

function Header({ label }: { label: string }) {
  return <div className="mt-10 eyebrow text-ink-mute">— {label} —</div>;
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="mt-4 flex flex-wrap gap-4">{children}</div>;
}

function NewTile({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex h-[140px] w-full flex-col items-center justify-center gap-1 rounded-sm border border-dashed border-vault-line text-ink-mute transition hover:border-brass/40 hover:text-brass sm:w-[240px]"
    >
      <span className="serif-h text-[16px]">{label}</span>
    </Link>
  );
}

// Convert a BOX_KEY → slug-case for URLs.
function slugify(key: string): string {
  return key.toLowerCase().replace(/_/g, "-").replace(/\//g, "-");
}
