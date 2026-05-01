"use client";
import { useTransition } from "react";
import clsx from "clsx";
import { toast } from "sonner";
import { moveItemToBox, softDeleteItem } from "@/lib/actions";

export function TriageChips({
  itemId,
  targets,
}: {
  itemId: string;
  targets: { label: string; box: string }[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className={clsx("flex gap-1", pending && "opacity-50")}>
      {targets.map((t) => (
        <button
          key={t.box}
          onClick={() =>
            startTransition(async () => {
              try {
                await moveItemToBox(itemId, t.box);
                toast.success(`Moved ${t.label.replace("→ ", "to ")}.`);
              } catch {
                toast.error("Couldn't move.");
              }
            })
          }
          className="rounded-sm border border-brass/40 px-2 py-1 font-mono text-[10px] tracking-wider text-brass hover:bg-brass/10"
        >
          {t.label}
        </button>
      ))}
      <button
        onClick={() =>
          startTransition(async () => {
            try {
              await softDeleteItem(itemId);
              toast.success("Dismissed.");
            } catch {
              toast.error("Couldn't dismiss.");
            }
          })
        }
        className="rounded-sm border border-vault-line px-2 py-1 font-mono text-[10px] tracking-wider text-ink-mute hover:border-rust hover:text-rust"
      >
        Dismiss
      </button>
    </div>
  );
}
