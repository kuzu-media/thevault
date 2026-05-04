// Vault interior — STORAGE ONLY. Daily-action surfaces (Drop / Docket /
// ATM / Counter) live in the top nav; here we only show the things you
// put away.
//
// Strictly configured-only: boxes = settings.boxes (and only those).
// Record categories live on /records; items whose `box` isn't a configured
// box key are not shown here. Edit boxes under Settings → Boxes.

import Link from "next/link";
import { getAllItems } from "@/lib/data";
import { getBoxes, type Box } from "@/lib/categories";
import { layoutVaultHubBoxRows } from "@/lib/vault-box-layout";
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
  const [items, boxes] = await Promise.all([getAllItems(), getBoxes()]);

  // Per-key item count for configured storage boxes only.
  const counts = new Map<string, number>();
  const configuredBoxKeys = new Set<string>(boxes.map((b) => b.key));
  for (const it of items) {
    if (!configuredBoxKeys.has(it.box)) continue;
    counts.set(it.box, (counts.get(it.box) ?? 0) + 1);
  }

  const itemsByBox: Record<string, Item[]> = {};
  for (const b of boxes) {
    itemsByBox[b.key] = [];
  }
  for (const it of items) {
    if (!configuredBoxKeys.has(it.box)) continue;
    if (!itemsByBox[it.box]) itemsByBox[it.box] = [];
    itemsByBox[it.box].push(it);
  }
  for (const k of Object.keys(itemsByBox)) {
    itemsByBox[k].sort(vaultItemSort);
  }

  const { rows: rowBoxes, orphans } = layoutVaultHubBoxRows(boxes);
  const toVaultTile = (b: Box) => ({
    key: b.key,
    label: b.label,
    count: counts.get(b.key) ?? 0,
    slug: slugify(b.key),
  });
  const tileRows =
    boxes.length === 0
      ? []
      : rowBoxes.map((row) => row.map((b) => (b ? toVaultTile(b) : null)));
  const orphanTiles = orphans.map(toVaultTile);

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
        rows={tileRows}
        orphanTiles={orphanTiles}
        itemsByBox={itemsByBox}
      >
        <NewTile href="/settings/boxes" label="+ New box" compact />
      </VaultBoxesSection>
    </div>
  );
}

function Header({ label }: { label: string }) {
  return <div className="mt-10 eyebrow text-ink-mute">— {label} —</div>;
}

function NewTile({
  href,
  label,
  compact,
}: {
  href: string;
  label: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        compact
          ? "flex min-h-[88px] flex-col items-center justify-center gap-1 rounded-sm border border-dashed border-vault-line px-2 py-2 text-center text-ink-mute transition hover:border-brass/40 hover:text-brass sm:min-h-[92px]"
          : "flex h-[140px] w-full flex-col items-center justify-center gap-1 rounded-sm border border-dashed border-vault-line text-ink-mute transition hover:border-brass/40 hover:text-brass sm:w-[240px]"
      }
    >
      <span className={compact ? "serif-h text-[13px] leading-tight" : "serif-h text-[16px]"}>
        {label}
      </span>
    </Link>
  );
}

// Convert a BOX_KEY → slug-case for URLs.
function slugify(key: string): string {
  return key.toLowerCase().replace(/_/g, "-").replace(/\//g, "-");
}
