"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import type { RecordType } from "@/lib/categories";

function deriveKey(label: string): string {
  return label
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_/-]/g, "")
    .slice(0, 40);
}

const FOLDERS: Array<{ key: NonNullable<RecordType["folder"]>; label: string }> = [
  { key: "health", label: "HEALTH" },
  { key: "books", label: "BOOKS" },
  { key: "misc", label: "MISC" },
  { key: "ecom-ecoship", label: "ECOM & ECOSHIP" },
  { key: "friends-family", label: "FRIENDS & FAMILY" },
  { key: "home-garden", label: "HOME & GARDEN" },
  { key: "stonewater-books", label: "STONEWATER BOOKS" },
  { key: "leisure", label: "LEISURE" },
  { key: "writing", label: "WRITING" },
  { key: "travel", label: "TRAVEL" },
];

export function RecordsSettingsEditor({
  initial,
  onSave,
}: {
  initial: RecordType[];
  onSave: (rows: RecordType[]) => Promise<unknown>;
}) {
  const [records, setRecords] = useState<RecordType[]>(initial);
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const manualKeys = useRef<Set<number>>(new Set());

  function update(i: number, patch: Partial<RecordType>) {
    setRecords(records.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function changeLabel(i: number, label: string) {
    setRecords(
      records.map((r, idx) => {
        if (idx !== i) return r;
        const key = manualKeys.current.has(i) ? r.key : deriveKey(label);
        return { ...r, label, key };
      }),
    );
  }

  function changeKey(i: number, key: string) {
    manualKeys.current.add(i);
    update(i, { key: key.toUpperCase().replace(/\s+/g, "_") });
  }

  function add() {
    setRecords([
      ...records,
      { key: "", label: "", meta: "", color: "#b5853a", folder: "misc" },
    ]);
  }

  function remove(i: number) {
    if (!confirm("Remove this record? Items already filed under it stay safe.")) return;
    setRecords(records.filter((_, idx) => idx !== i));
    const next = new Set<number>();
    for (const idx of manualKeys.current) {
      if (idx < i) next.add(idx);
      else if (idx > i) next.add(idx - 1);
    }
    manualKeys.current = next;
  }

  function save() {
    const cleaned = records.map((r) => ({
      ...r,
      key: r.key || deriveKey(r.label) || "RECORD",
      folder: r.folder ?? "misc",
    }));
    setRecords(cleaned);
    startTransition(async () => {
      try {
        await onSave(cleaned);
        setSavedAt(Date.now());
      } catch (e: any) {
        toast.error(
          e?.message ? `Couldn't save: ${e.message}` : "Couldn't save records.",
        );
      }
    });
  }

  return (
    <div className="mt-6 space-y-3">
      <div className="flex flex-wrap items-center gap-2 px-1 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute">
        <span className="w-7" />
        <span className="min-w-[140px] flex-1">Label</span>
        <span className="min-w-[160px] flex-1">Meta</span>
        <span className="w-[110px]">Folder</span>
        <span className="w-[110px]">Key</span>
        <span className="w-[80px]" />
      </div>
      {records.map((r, i) => (
        <div
          key={i}
          className="flex flex-wrap items-center gap-2 rounded-sm border border-vault-line bg-vault-panel/40 px-4 py-3"
        >
          <input
            type="color"
            value={r.color ?? "#b5853a"}
            onChange={(e) => update(i, { color: e.target.value })}
            className="h-7 w-7 cursor-pointer rounded-sm border border-vault-line bg-transparent"
            title="Color"
          />
          <input
            value={r.label}
            onChange={(e) => changeLabel(i, e.target.value)}
            placeholder="Label (e.g. Notes)"
            className="min-w-[140px] flex-1 rounded-sm border border-vault-line bg-vault-bg/60 px-2 py-1 text-ink outline-none focus:border-brass"
          />
          <input
            value={r.meta ?? ""}
            onChange={(e) => update(i, { meta: e.target.value })}
            placeholder="Subtitle, e.g. Measurements & doses"
            className="min-w-[160px] flex-1 rounded-sm border border-vault-line bg-vault-bg/60 px-2 py-1 font-mono text-[13px] text-ink-mute outline-none focus:border-brass"
          />
          <select
            value={r.folder ?? "misc"}
            onChange={(e) => update(i, { folder: e.target.value as RecordType["folder"] })}
            className="w-[110px] rounded-sm border border-vault-line bg-vault-bg/60 px-2 py-1 font-mono text-[12px] text-ink outline-none focus:border-brass"
          >
            {FOLDERS.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>
          <input
            value={r.key}
            onChange={(e) => changeKey(i, e.target.value)}
            placeholder="auto"
            className="w-[110px] rounded-sm border border-vault-line bg-vault-bg/60 px-2 py-1 font-mono text-[12px] text-brass outline-none focus:border-brass"
          />
          <button
            onClick={() => remove(i)}
            className="rounded-sm border border-vault-line px-2 py-1 font-mono text-[11px] tracking-wider text-ink-mute hover:border-rust hover:text-rust"
          >
            REMOVE
          </button>
        </div>
      ))}
      <button
        onClick={add}
        className="w-full rounded-sm border border-dashed border-brass/40 py-3 font-mono text-[11px] tracking-[0.24em] text-brass/70 hover:border-brass"
      >
        + ADD RECORD
      </button>

      <div className="flex items-center justify-between pt-3">
        <span className="font-mono text-[11px] text-ink-mute">
          {pending && "saving…"}
          {!pending &&
            savedAt &&
            `saved ${new Date(savedAt).toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            })}`}
        </span>
        <button
          onClick={save}
          disabled={pending}
          className="brass-button px-6 py-2 font-mono text-[11px] tracking-[0.24em] text-[#2a1c08] disabled:opacity-50"
        >
          SAVE RECORDS
        </button>
      </div>
    </div>
  );
}
