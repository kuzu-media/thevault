"use client";
import { useState, useTransition } from "react";
import clsx from "clsx";
import { updateItem } from "@/lib/actions";

export function EditableText({
  itemId,
  field,
  initial,
  className,
  placeholder,
  numeric = false,
}: {
  itemId: string;
  field:
    | "title"
    | "minutes"
    | "area"
    | "category"
    | "person"
    | "tag"
    | "notes"
    | "today_order";
  initial: string | number | null | undefined;
  className?: string;
  placeholder?: string;
  numeric?: boolean;
}) {
  const [value, setValue] = useState(initial ?? "");
  const [pending, startTransition] = useTransition();

  function commit() {
    if (String(value) === String(initial ?? "")) return;
    const v: any = numeric
      ? value === ""
        ? null
        : Number(value)
      : value === ""
        ? null
        : value;
    startTransition(async () => {
      await updateItem(itemId, { [field]: v } as any);
    });
  }

  return (
    <input
      value={value as any}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") setValue(initial ?? "");
      }}
      placeholder={placeholder}
      type={numeric ? "number" : "text"}
      className={clsx(
        "bg-transparent outline-none focus:bg-vault-bg/40 focus:ring-1 focus:ring-brass/40 rounded-sm px-1",
        pending && "opacity-50",
        className,
      )}
    />
  );
}

export function EditableFlag({
  itemId,
  field,
  initial,
  glyph,
  className,
}: {
  itemId: string;
  field: "urgent" | "must" | "pinned";
  initial: boolean;
  glyph: string;
  className?: string;
}) {
  const [on, setOn] = useState(initial);
  const [pending, startTransition] = useTransition();
  // When OFF, render an outline-style ghost (not just dimmed) so the empty
  // state reads clearly even without color. When ON, render the colored glyph
  // at full opacity.
  return (
    <button
      title={field}
      onClick={() => {
        const next = !on;
        setOn(next);
        startTransition(async () => {
          await updateItem(itemId, { [field]: next } as any);
        });
      }}
      className={clsx(
        "flex h-5 w-5 items-center justify-center rounded-sm leading-none transition",
        on ? className : "text-ink-mute/30 hover:text-ink-mute",
        pending && "opacity-50",
      )}
    >
      {on ? glyph : "·"}
    </button>
  );
}
