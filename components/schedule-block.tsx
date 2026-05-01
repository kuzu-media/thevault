import clsx from "clsx";
import type { ScheduledBlock } from "@/lib/daily-plan";

const BUCKET_COLOR: Record<string, string> = {
  STRESSOR: "border-l-rust",
  TIME_SENSITIVE: "border-l-rust/60",
  MUST_DO: "border-l-brass",
  OTHER_ADMIN: "border-l-ink-mute",
  TILL_PICK: "border-l-teal",
  CUSTOM: "border-l-ink-mute",
};

function fmtTime(iso: string) {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export function ScheduleBlock({
  block,
  state = "upcoming",
}: {
  block: ScheduledBlock;
  state?: "upcoming" | "active" | "done" | "skipped" | "overrun";
}) {
  return (
    <div
      className={clsx(
        "group relative flex items-center gap-4 rounded-sm border-l-4 bg-vault-panel/80 px-4 py-3 transition",
        BUCKET_COLOR[block.bucket] ?? "border-l-ink-mute",
        state === "done" && "opacity-50",
        state === "active" && "ring-1 ring-brass shadow-[0_0_24px_rgba(224,185,99,0.18)]",
        state === "skipped" && "border-dashed opacity-40",
      )}
    >
      <div className="flex w-20 flex-col items-end font-mono text-[11px] tracking-wider text-ink-mute">
        <span>{fmtTime(block.start)}</span>
        <span className="text-[9px] text-ink-mute/60">→ {fmtTime(block.end)}</span>
      </div>
      <button
        className={clsx(
          "h-5 w-5 shrink-0 rounded-full border transition",
          state === "done"
            ? "border-brass bg-brass"
            : "border-brass/40 hover:border-brass",
        )}
        aria-label="Mark done"
      />
      <div className="flex-1">
        <div
          className={clsx(
            "serif-h text-[16px]",
            state === "done" && "line-through text-ink-mute",
          )}
        >
          {block.title}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-ink-mute">
          {block.area && <span className="eyebrow">{block.area}</span>}
          <span>·</span>
          <span>{block.minutes} min</span>
          {block.pinned && <span className="text-brass">📌</span>}
        </div>
      </div>
    </div>
  );
}
