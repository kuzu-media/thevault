"use client";
import { useState, useTransition } from "react";
import { updateItem } from "@/lib/actions";
import { Select } from "./ui";

// Compact box-key picker. Used on Counter rows to set/change the area.

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
    <Select
      tone="brass"
      value={area}
      onChange={(e) => {
        const v = e.target.value;
        setArea(v);
        startTransition(async () => {
          await updateItem(itemId, { area: v || null });
        });
      }}
      className={pending ? "opacity-50" : undefined}
    >
      <option className="bg-vault-bg" value="">
        — box —
      </option>
      {options.map((o) => (
        <option key={o.key} className="bg-vault-bg" value={o.key}>
          {o.label}
        </option>
      ))}
    </Select>
  );
}
