"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateItem } from "@/lib/actions";
import { Select } from "./ui";

// Compact box-key picker. Counter rows set `area`; ATM rows set `category`.

export function AreaPill({
  itemId,
  initial,
  options,
  field = "area",
  className,
}: {
  itemId: string;
  initial?: string | null;
  options: { key: string; label: string }[];
  field?: "area" | "category";
  /** Merged onto the `<select>` (e.g. compact chip sizing on ATM). */
  className?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initial ?? "");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setValue(initial ?? "");
  }, [initial]);

  return (
    <Select
      tone="brass"
      value={value}
      className={className}
      onChange={(e) => {
        const v = e.target.value;
        setValue(v);
        startTransition(async () => {
          await updateItem(
            itemId,
            field === "category"
              ? { category: v || null, area: null }
              : { area: v || null },
          );
          router.refresh();
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
