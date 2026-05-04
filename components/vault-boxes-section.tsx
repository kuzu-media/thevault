"use client";

import { useState } from "react";
import Link from "next/link";
import { BoxCard } from "@/components/box-card";
import { BoxStorageList } from "@/components/box-storage-list";
import type { BoxKey, Item } from "@/lib/types";

export type VaultBoxTile = {
  key: string;
  label: string;
  count: number;
  slug: string;
};

const ROW_GRID = [
  "grid gap-2 grid-cols-2 sm:grid-cols-4",
  "grid gap-2 grid-cols-2 sm:grid-cols-5",
  "grid grid-cols-3 gap-2 max-w-lg mx-auto sm:max-w-xl",
] as const;

function findTile(
  key: string | null,
  rows: (VaultBoxTile | null)[][],
  orphans: VaultBoxTile[],
): VaultBoxTile | undefined {
  if (!key) return undefined;
  for (const row of rows) {
    for (const c of row) {
      if (c?.key === key) return c;
    }
  }
  return orphans.find((b) => b.key === key);
}

export function VaultBoxesSection({
  rows,
  orphanTiles,
  itemsByBox,
  children,
}: {
  rows: (VaultBoxTile | null)[][];
  orphanTiles: VaultBoxTile[];
  itemsByBox: Record<string, Item[]>;
  children?: React.ReactNode;
}) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const open = findTile(openKey, rows, orphanTiles);

  return (
    <div className="mt-4 space-y-6">
      <div className="space-y-2.5">
        {rows.map((row, ri) => (
          <div key={ri} className={ROW_GRID[ri] ?? ROW_GRID[0]}>
            {row.map((cell, ci) =>
              cell ? (
                <BoxCard
                  key={cell.key}
                  title={cell.label}
                  count={cell.count}
                  selected={openKey === cell.key}
                  onPress={() =>
                    setOpenKey((k) => (k === cell.key ? null : cell.key))
                  }
                  size="compact"
                />
              ) : (
                <div
                  key={`empty-${ri}-${ci}`}
                  className="hidden min-h-[88px] rounded-sm border border-transparent sm:block sm:opacity-0 sm:pointer-events-none"
                  aria-hidden
                />
              ),
            )}
          </div>
        ))}

        {(orphanTiles.length > 0 || children) && (
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
            {orphanTiles.map((b) => (
              <BoxCard
                key={b.key}
                title={b.label}
                count={b.count}
                selected={openKey === b.key}
                onPress={() =>
                  setOpenKey((k) => (k === b.key ? null : b.key))
                }
                size="compact"
              />
            ))}
            {children}
          </div>
        )}
      </div>

      {open && (
        <section
          id="vault-box-panel"
          aria-label={`Items in ${open.label}`}
          className="rounded-sm border border-vault-line/80 bg-vault-panel/30 p-4 md:p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-vault-line/50 pb-4">
            <div>
              <div className="eyebrow text-ink-mute">— In this box —</div>
              <h2 className="serif-h mt-1 text-[26px] leading-tight text-ink md:text-[30px]">
                {open.label}
              </h2>
              <p className="mt-1 font-mono text-[10px] text-ink-mute">
                {open.count} item{open.count === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/vault/${open.slug}`}
                className="rounded-sm border border-vault-line px-3 py-1.5 font-mono text-[10px] tracking-[0.16em] text-ink-mute transition hover:border-brass/40 hover:text-brass"
              >
                Open full page
              </Link>
              <button
                type="button"
                onClick={() => setOpenKey(null)}
                className="rounded-sm border border-vault-line px-3 py-1.5 font-mono text-[10px] tracking-[0.16em] text-ink-mute transition hover:border-brass/40 hover:text-brass"
              >
                Close
              </button>
            </div>
          </div>
          <div className="mt-4">
            <BoxStorageList
              boxKey={open.key as BoxKey}
              title={open.label}
              items={itemsByBox[open.key] ?? []}
            />
          </div>
        </section>
      )}
    </div>
  );
}
