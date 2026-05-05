"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createItem } from "@/lib/actions";
import { Select } from "@/components/ui";

export function NewCounterItemRow({
  boxes,
  initialArea = "",
}: {
  boxes: { key: string; label: string }[];
  initialArea?: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [area, setArea] = useState(initialArea);
  const [pending, startTransition] = useTransition();

  function add() {
    const t = title.trim();
    if (!t || !area) return;
    startTransition(async () => {
      await createItem("COUNTER", t, { area, category: null });
      setTitle("");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-sm border border-dashed border-vault-line/60 bg-vault-panel/20 px-4 py-2 transition hover:border-brass/40">
      <span className="font-mono text-[10px] tracking-wider text-ink-mute">+</span>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add();
          }
        }}
        placeholder="+ New counter item"
        className="vault-task-title min-w-[220px] flex-1 bg-transparent text-ink placeholder:text-ink-mute outline-none"
      />
      <Select
        value={area}
        onChange={(e) => setArea(e.target.value)}
        tone="brass"
        className="w-[13rem] shrink-0 px-2 py-1 font-mono text-[10px]"
        aria-label="Choose box for new counter task"
      >
        <option value="" className="bg-vault-bg">
          — choose box —
        </option>
        {boxes.map((b) => (
          <option key={b.key} value={b.key} className="bg-vault-bg">
            {b.label}
          </option>
        ))}
      </Select>
      <button
        type="button"
        onClick={add}
        disabled={pending || !title.trim() || !area}
        className="rounded-sm border border-brass/40 px-3 py-1 font-mono text-[10px] tracking-[0.16em] text-brass transition hover:bg-brass/10 disabled:opacity-40"
      >
        ADD
      </button>
      {pending && (
        <span className="font-mono text-[10px] text-brass">saving…</span>
      )}
    </div>
  );
}
