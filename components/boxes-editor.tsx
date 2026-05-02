"use client";
import { useState, useTransition } from "react";
import clsx from "clsx";
import { saveBoxConfig } from "@/lib/actions";
import type { Box } from "@/lib/categories";

export function BoxesEditor({ initial }: { initial: Box[] }) {
  const [boxes, setBoxes] = useState<Box[]>(initial);
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function update(i: number, patch: Partial<Box>) {
    const next = boxes.map((b, idx) => (idx === i ? { ...b, ...patch } : b));
    setBoxes(next);
  }

  function add() {
    const i = boxes.length + 1;
    setBoxes([
      ...boxes,
      {
        key: `BOX_${i}`,
        label: "New box",
        dest: "TILL",
        meta: "",
        color: "#b5853a",
      },
    ]);
  }

  function remove(i: number) {
    if (!confirm("Remove this box from the layout? Items in it stay safe."))
      return;
    setBoxes(boxes.filter((_, idx) => idx !== i));
  }

  function save() {
    startTransition(async () => {
      await saveBoxConfig(boxes);
      setSavedAt(Date.now());
    });
  }

  return (
    <div className="mt-6 space-y-3">
      <div className="flex flex-wrap items-center gap-2 px-1 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-mute">
        <span className="w-7" />
        <span className="flex-1 min-w-[160px]">Label</span>
        <span className="flex-1 min-w-[160px]">Meta</span>
        <span className="w-[110px]">Key</span>
        <span className="w-[100px]">Sends to</span>
        <span className="w-[80px]" />
      </div>
      {boxes.map((b, i) => (
        <div
          key={i}
          className="flex flex-wrap items-center gap-2 rounded-sm border border-vault-line bg-vault-panel/40 px-4 py-3"
        >
          <input
            type="color"
            value={b.color ?? "#b5853a"}
            onChange={(e) => update(i, { color: e.target.value })}
            className="h-7 w-7 cursor-pointer rounded-sm border border-vault-line bg-transparent"
            title="Color"
          />
          <input
            value={b.label}
            onChange={(e) => update(i, { label: e.target.value })}
            placeholder="Label"
            className="min-w-[160px] flex-1 rounded-sm border border-vault-line bg-vault-bg/60 px-2 py-1 text-ink outline-none focus:border-brass"
          />
          <input
            value={b.meta ?? ""}
            onChange={(e) => update(i, { meta: e.target.value })}
            placeholder="Meta"
            className="min-w-[160px] flex-1 rounded-sm border border-vault-line bg-vault-bg/60 px-2 py-1 font-mono text-[11px] text-ink-mute outline-none focus:border-brass"
          />
          <input
            value={b.key}
            onChange={(e) =>
              update(i, { key: e.target.value.toUpperCase().replace(/\s/g, "_") })
            }
            placeholder="KEY"
            className="w-[110px] rounded-sm border border-vault-line bg-vault-bg/60 px-2 py-1 font-mono text-[10px] text-brass outline-none focus:border-brass"
          />
          <select
            value={b.dest}
            onChange={(e) =>
              update(i, { dest: e.target.value as Box["dest"] })
            }
            className={clsx(
              "w-[100px] rounded-sm border bg-vault-bg/60 px-2 py-1 font-mono text-[10px] tracking-wider outline-none focus:border-brass",
              b.dest === "DRAWER"
                ? "border-rust/50 text-rust"
                : "border-teal/50 text-teal",
            )}
          >
            <option value="TILL" className="bg-vault-bg">
              TILL
            </option>
            <option value="DRAWER" className="bg-vault-bg">
              DRAWER
            </option>
          </select>
          <button
            onClick={() => remove(i)}
            className="rounded-sm border border-vault-line px-2 py-1 font-mono text-[10px] tracking-wider text-ink-mute hover:border-rust hover:text-rust"
          >
            REMOVE
          </button>
        </div>
      ))}
      <button
        onClick={add}
        className="w-full rounded-sm border border-dashed border-brass/40 py-3 font-mono text-[10px] tracking-[0.24em] text-brass/70 hover:border-brass"
      >
        + ADD BOX
      </button>

      <div className="flex items-center justify-between pt-3">
        <span className="font-mono text-[10px] text-ink-mute">
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
          className="brass-button px-6 py-2 font-mono text-[10px] tracking-[0.24em] text-[#2a1c08] disabled:opacity-50"
        >
          SAVE BOXES
        </button>
      </div>
    </div>
  );
}
