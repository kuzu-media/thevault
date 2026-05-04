"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { softDeleteItem } from "@/lib/actions";

/** Small red ✕ — soft-deletes the item and refreshes the page. */
export function DeleteItemButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label="Delete item"
      title="Delete"
      disabled={pending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm("Delete this item?")) return;
        startTransition(async () => {
          await softDeleteItem(itemId);
          router.refresh();
        });
      }}
      className="shrink-0 rounded-sm px-1 py-0.5 font-mono text-[15px] leading-none text-red-600 transition hover:bg-red-500/10 hover:text-red-700 disabled:opacity-40"
    >
      ×
    </button>
  );
}
