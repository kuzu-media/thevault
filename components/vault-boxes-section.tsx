"use client";

import { useState } from "react";
import Link from "next/link";
import { BoxCard } from "@/components/box-card";
import { BoxStorageList } from "@/components/box-storage-list";
import type { BoxKey, Item } from "@/lib/types";

export function VaultBoxesSection({
  boxes,
  itemsByBox,
  children,
}: {
  boxes: { key: string; label: string; count: number; slug: string }[];
  itemsByBox: Record<string, Item[]>;
  children?: React.ReactNode;
}) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const open = boxes.find((b) => b.key === openKey);

  return (
    <div className="mt-4 space-y-6">
      <div className="flex flex-wrap gap-4">
        {boxes.map((b) => (
          <BoxCard
            key={b.key}
            title={b.label}
            count={b.count}
            selected={openKey === b.key}
            onPress={() =>
              setOpenKey((k) => (k === b.key ? null : b.key))
            }
          />
        ))}
        {children}
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
