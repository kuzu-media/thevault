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
import { VaultBoxesSection } from "@/components/vault-boxes-section";
import type { Item } from "@/lib/types";

/** Match `getItemsByBox` ordering: today_order asc (nulls last), then created_at. */
function vaultItemSort(a: Item, b: Item): number {
  const ao = a.todayOrder;
  const bo = b.todayOrder;
  if (ao != null && bo != null && ao !== bo) return ao - bo;
  if (ao != null && bo == null) return -1;
  if (ao == null && bo != null) return 1;
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

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

  const itemsByBox: Record<string, Item[]> = {};
  for (const b of boxes) {
    itemsByBox[b.key] = [];
  }
  for (const it of items) {
    if (!configuredKeys.has(it.box)) continue;
    if (!itemsByBox[it.box]) itemsByBox[it.box] = [];
    itemsByBox[it.box].push(it);
  }
  for (const k of Object.keys(itemsByBox)) {
    itemsByBox[k].sort(vaultItemSort);
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 md:px-10">
      <h1 className="serif-h text-[28px] leading-tight md:text-[36px]">
        The Boxes
      </h1>
      <p className="mt-1 text-[13px] text-ink-dim">
        Put away all the projects, tasks, and ideas here.
      </p>

      {/* Boxes section — click a box to see its items and add new rows here. */}
      <Header label="Open a box" />
      <VaultBoxesSection
        boxes={boxes.map((b) => ({
          key: b.key,
          label: b.label,
          count: counts.get(b.key) ?? 0,
          slug: slugify(b.key),
        }))}
        itemsByBox={itemsByBox}
      >
        <NewTile href="/settings/boxes" label="+ New box" />
      </VaultBoxesSection>

      {/* Records section — same treatment. */}
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
