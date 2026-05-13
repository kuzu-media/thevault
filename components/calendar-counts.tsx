"use client";

import type { Box } from "@/lib/categories";
import type { CalendarWeek } from "@/lib/calendar-planning";

const UNASSIGNED = "__unassigned__";

function hexToRgba(hex: string | undefined, alpha: number): string | undefined {
  if (!hex) return undefined;
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  if (full.length !== 6) return undefined;
  const n = parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Tally days across the given weeks by their resolved project (override
// wins over week assignment; null = unassigned). Returns chips sorted by
// count descending, with the unassigned tally last regardless of count.
export function CalendarCounts({
  weeks,
  boxes,
}: {
  weeks: CalendarWeek[];
  boxes: Box[];
}) {
  const counts = new Map<string, number>();
  for (const w of weeks) {
    for (const d of w.days) {
      const key = d.boxKey ?? UNASSIGNED;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  const boxesByKey = new Map(boxes.map((b) => [b.key, b]));
  const projectChips = Array.from(counts.entries())
    .filter(([k]) => k !== UNASSIGNED)
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => {
      const box = boxesByKey.get(key);
      return {
        key,
        label: box?.label ?? key,
        color: box?.color,
        count,
      };
    });
  const unassignedCount = counts.get(UNASSIGNED) ?? 0;

  if (projectChips.length === 0 && unassignedCount === 0) return null;

  return (
    <section
      aria-label="Project counts for current and upcoming weeks"
      className="rounded-sm border border-vault-line bg-vault-panel/30 px-3 py-3 md:px-4 md:py-3"
    >
      <div className="mb-2 font-mono text-[10px] tracking-[0.18em] text-ink-mute">
        FROM THIS WEEK FORWARD
      </div>
      <div className="flex flex-wrap gap-1.5">
        {projectChips.map((chip) => (
          <span
            key={chip.key}
            className="inline-flex items-baseline gap-2 rounded-sm border px-2 py-1 text-[12px]"
            style={{
              backgroundColor: hexToRgba(chip.color, 0.18),
              borderColor: hexToRgba(chip.color, 0.5),
            }}
          >
            <span
              className="font-mono tracking-[0.06em]"
              style={{ color: hexToRgba(chip.color, 0.95) }}
            >
              {chip.label}
            </span>
            <span className="font-mono text-[11px] text-ink-dim">
              {chip.count}
            </span>
          </span>
        ))}
        {unassignedCount > 0 && (
          <span className="inline-flex items-baseline gap-2 rounded-sm border border-dashed border-vault-line px-2 py-1 text-[12px]">
            <span className="font-mono tracking-[0.06em] text-ink-mute">
              Unassigned
            </span>
            <span className="font-mono text-[11px] text-ink-mute">
              {unassignedCount}
            </span>
          </span>
        )}
      </div>
    </section>
  );
}
