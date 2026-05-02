"use client";
import { useState, useTransition } from "react";
import { updateItem } from "@/lib/actions";
import clsx from "clsx";

// AreaPill takes its option list from the parent (driven by settings.boxes,
// filtered to DRAWER-dest entries on the Drawer page). No hardcoded areas.

export function AreaPill({
  itemId,
  initial,
  options,
}: {
  itemId: string;
  initial?: string | null;
  options: { key: string; label: string }[];
}) {
  const [area, setArea] = useState(initial ?? "");
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={area}
      onChange={(e) => {
        const v = e.target.value;
        setArea(v);
        startTransition(async () => {
          await updateItem(itemId, { area: v || null });
        });
      }}
      className={clsx(
        "rounded-sm border border-brass/40 bg-transparent px-1.5 py-0.5 font-mono text-[9px] tracking-wider text-brass outline-none",
        pending && "opacity-50",
      )}
    >
      <option className="bg-vault-bg" value="">
        —
      </option>
      {options.map((o) => (
        <option key={o.key} className="bg-vault-bg" value={o.key}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
