"use client";
import { useState, useTransition } from "react";
import clsx from "clsx";
import { toast } from "sonner";
import { pickFromAtm } from "@/lib/actions";

export function AtmPickButton({
  itemId,
  picked: initial,
}: {
  itemId: string;
  picked: boolean;
}) {
  const [picked, setPicked] = useState(initial);
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() => {
        const next = !picked;
        setPicked(next);
        startTransition(async () => {
          try {
            await pickFromAtm(itemId, next);
            toast.success(next ? "On today's plan." : "Returned to ATM.");
          } catch (e: any) {
            toast.error(e?.message ?? "Couldn't update.");
          }
        });
      }}
      className={clsx(
        "rounded-sm border px-3 py-1 font-mono text-[10px] tracking-wider transition",
        picked
          ? "border-brass bg-brass/20 text-brass"
          : "border-brass/30 text-brass/80 hover:bg-brass/10",
        pending && "opacity-60",
      )}
    >
      {picked ? "✓ For today" : "Let's do this today"}
    </button>
  );
}
