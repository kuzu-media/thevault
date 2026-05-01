"use client";
import { useState, useTransition } from "react";
import { updateItem } from "@/lib/actions";
import clsx from "clsx";

const AREAS = ["ECO", "SWB", "HEALTH", "FF", "TRAVEL", "HOME", "FINANCE"];

export function AreaPill({
  itemId,
  initial,
}: {
  itemId: string;
  initial?: string | null;
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
      {AREAS.map((a) => (
        <option key={a} className="bg-vault-bg" value={a}>
          {a}
        </option>
      ))}
    </select>
  );
}
