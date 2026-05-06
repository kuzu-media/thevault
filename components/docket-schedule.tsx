"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  dayScheduleWindow,
  type ScheduledBlock,
} from "@/lib/daily-plan";
import type { DayInputs, Item } from "@/lib/types";
import { ScheduleWithNowLine } from "@/components/now-line";
import { hardDeleteDoneTodayItems, reorderItems } from "@/lib/actions";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";

/** Builds timed blocks in the visitor's local TZ — server-side scheduling uses UTC on Vercel and skews labels by offset (e.g. −4h Eastern). */
export function DocketSchedule({
  counterItems,
  atmItems,
  inputs,
  children,
}: {
  counterItems: Item[];
  atmItems: Item[];
  inputs: DayInputs;
  children?: ReactNode;
}) {
  const router = useRouter();
  // Scheduling uses local wall clock; Vercel SSR is UTC — skip building until mount to avoid wrong first paint + hydration drift.
  const [client, setClient] = useState(false);
  // Bust schedule cache periodically so `now` in buildSchedule advances (same as before when each GET recomputed).
  const [tick, setTick] = useState(0);
  useEffect(() => {
    setClient(true);
  }, []);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);
  const [orderedBlocks, setOrderedBlocks] = useState<ScheduledBlock[]>([]);
  const [, startTransition] = useTransition();
  const [clearPending, startClearTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );
  const doneTodayItems = useMemo(
    () =>
      [...counterItems, ...atmItems]
        .filter(
          (i) => (i.todayOrder ?? null) !== null && (i.state ?? "upcoming") === "done",
        )
        .sort((a, b) => (a.todayOrder ?? 0) - (b.todayOrder ?? 0)),
    [counterItems, atmItems],
  );
  const skippedTodayItems = useMemo(
    () =>
      [...counterItems, ...atmItems]
        .filter(
          (i) => (i.todayOrder ?? null) !== null && (i.state ?? "upcoming") === "skipped",
        )
        .sort((a, b) => (a.todayOrder ?? 0) - (b.todayOrder ?? 0)),
    [counterItems, atmItems],
  );

  const { blocks, stateById, overflowMinutes, scheduledMinutes, availableMinutes } =
    useMemo(() => {
      if (!client) {
        return {
          blocks: [],
          stateById: new Map(),
          overflowMinutes: 0,
          scheduledMinutes: 0,
          availableMinutes: inputs.hoursAvailable * 60,
        };
      }
      const scheduledCounter = counterItems.filter((i) => {
        const s = i.state ?? "upcoming";
        return s !== "done" && s !== "skipped";
      });
      const scheduledAtm = atmItems.filter((i) => {
        const s = i.state ?? "upcoming";
        return s !== "done" && s !== "skipped";
      });
      const todayItems = [...scheduledCounter, ...scheduledAtm]
        .filter((i) => i.todayOrder !== null)
        .sort((a, b) => (a.todayOrder ?? 0) - (b.todayOrder ?? 0));
      const { dayStart } = dayScheduleWindow(inputs, new Date());
      const blocks: ScheduledBlock[] = [];
      let cursor = new Date(dayStart);
      for (const it of todayItems) {
        const minutes = it.minutes ?? 0;
        if (minutes <= 0) continue;
        const start = new Date(cursor);
        const end = new Date(start.getTime() + minutes * 60_000);
        blocks.push({
          itemId: it.id,
          title: it.title,
          bucket:
            it.box === "ATM"
              ? "ATM_PICK"
              : it.urgent && it.must
                ? "STRESSOR"
                : it.urgent
                  ? "TIME_SENSITIVE"
                  : it.must
                    ? "MUST_DO"
                    : "OTHER_ADMIN",
          minutes,
          start: start.toISOString(),
          end: end.toISOString(),
          pinned: it.pinned,
          area: it.area ?? it.category,
        });
        cursor = end;
      }
      // Keep existing pin semantics: pin changes its own block time only.
      for (const b of blocks) {
        const src = todayItems.find((i) => i.id === b.itemId);
        if (src?.pinned && src.scheduledStart) {
          const s = new Date(src.scheduledStart);
          const e = new Date(s.getTime() + b.minutes * 60_000);
          b.start = s.toISOString();
          b.end = e.toISOString();
          b.pinned = true;
        }
      }
      const stateById = new Map(
        [...counterItems, ...atmItems].map((i) => [
          i.id,
          i.state ?? "upcoming",
        ]),
      );
      const scheduledMinutes = blocks.reduce((a, b) => a + b.minutes, 0);
      const availableMinutes = inputs.hoursAvailable * 60;
      const overflowMinutes = Math.max(0, scheduledMinutes - availableMinutes);
      return {
        blocks,
        stateById,
        overflowMinutes,
        scheduledMinutes,
        availableMinutes,
      };
    }, [client, counterItems, atmItems, inputs, tick]);

  useEffect(() => {
    setOrderedBlocks((prev) => {
      if (prev.length === 0) return blocks;
      const incomingById = new Map(blocks.map((b) => [b.itemId, b]));
      const prevIds = prev.map((b) => b.itemId);
      const incomingIds = blocks.map((b) => b.itemId);
      const sameIdSet =
        prevIds.length === incomingIds.length &&
        prevIds.every((id) => incomingById.has(id));

      // Keep user's drag order stable; only refresh each row's latest block data.
      if (sameIdSet) {
        return prev.map((b) => incomingById.get(b.itemId) ?? b);
      }

      // If membership changes (added/removed), preserve existing relative order
      // for surviving ids, then append genuinely new ids in server order.
      const merged: ScheduledBlock[] = [];
      for (const id of prevIds) {
        const next = incomingById.get(id);
        if (next) merged.push(next);
      }
      for (const b of blocks) {
        if (!prevIds.includes(b.itemId)) merged.push(b);
      }
      return merged;
    });
  }, [blocks]);

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedBlocks.findIndex((b) => b.itemId === active.id);
    const newIndex = orderedBlocks.findIndex((b) => b.itemId === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(orderedBlocks, oldIndex, newIndex);
    setOrderedBlocks(next);
    startTransition(async () => {
      await reorderItems(next.map((b) => b.itemId));
    });
  }

  if (!client) {
    return (
      <div className="mt-8 space-y-2">
        <div
          className="h-[4.25rem] animate-pulse rounded-sm bg-vault-panel/30"
          aria-hidden
        />
        <div
          className="h-[4.25rem] animate-pulse rounded-sm bg-vault-panel/30"
          aria-hidden
        />
        {children}
      </div>
    );
  }

  return (
    <>
      {overflowMinutes > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-sm border border-rust/40 bg-rust/5 px-4 py-3 text-[12px] text-ink-dim">
          <span className="font-mono text-[10px] tracking-wider text-rust">
            ⚠ OVERFLOW
          </span>
          <span>
            Scheduled {fmtHrs(scheduledMinutes)} but you said you have{" "}
            {fmtHrs(availableMinutes)} —{" "}
            <strong className="text-rust">{fmtHrs(overflowMinutes)}</strong>{" "}
            past end-of-day.
          </span>
          <Link
            href="/counter"
            className="ml-auto font-mono text-[10px] tracking-[0.18em] text-rust hover:underline"
          >
            TRIM COUNTER →
          </Link>
        </div>
      )}

      <div className="mt-8 space-y-2">
        {orderedBlocks.length > 1 && (
          <p className="font-mono text-[10px] tracking-[0.18em] text-ink-mute">
            DRAG <span className="text-brass">⋮⋮</span> TO REORDER TODAY
          </p>
        )}
        {orderedBlocks.length === 0 && (
          <p className="rounded-sm border border-dashed border-vault-line/60 bg-vault-panel/20 px-4 py-6 text-center text-ink-mute">
            Nothing scheduled. Add a custom block below, or rebuild the day.
          </p>
        )}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={orderedBlocks.map((b) => b.itemId)}
            strategy={verticalListSortingStrategy}
          >
            {orderedBlocks.map((b, i) => (
              <SortableScheduleRow key={b.itemId} id={b.itemId}>
                <ScheduleWithNowLine
                  block={b}
                  nextStart={orderedBlocks[i + 1]?.start}
                  state={(stateById.get(b.itemId) as any) ?? "upcoming"}
                />
              </SortableScheduleRow>
            ))}
          </SortableContext>
        </DndContext>
        {children}
        {doneTodayItems.length > 0 && (
          <div className="mt-6 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-[10px] tracking-[0.18em] text-ink-mute">
                DONE TODAY
              </p>
              <button
                type="button"
                disabled={clearPending}
                title="Permanently delete every completed task from Counter and ATM"
                className="shrink-0 rounded-sm border border-vault-line bg-vault-panel/40 px-3 py-1 font-mono text-[10px] tracking-[0.18em] text-ink-mute transition hover:border-rust/50 hover:text-rust disabled:opacity-40"
                onClick={() => {
                  const n = doneTodayItems.length;
                  if (
                    !confirm(
                      `Permanently delete all ${n} completed item${n === 1 ? "" : "s"}? This removes them from Counter and ATM and cannot be undone.`,
                    )
                  )
                    return;
                  startClearTransition(async () => {
                    try {
                      const r = await hardDeleteDoneTodayItems(
                        doneTodayItems.map((it) => it.id),
                      );
                      toast.success(
                        `Permanently deleted ${r.deleted} completed item${r.deleted === 1 ? "" : "s"}.`,
                      );
                      router.refresh();
                    } catch (e: any) {
                      toast.error(
                        e?.message ??
                          "Could not clear completed items. Try again.",
                      );
                    }
                  });
                }}
              >
                {clearPending ? "CLEARING…" : "CLEAR ALL DONE"}
              </button>
            </div>
            {doneTodayItems.map((it) => (
              <div
                key={it.id}
                className="rounded-sm border border-vault-line/40 bg-vault-panel/30 px-4 py-3 opacity-60"
              >
                <div className="vault-task-title line-through text-ink-mute">
                  {it.title}
                </div>
                <div className="mt-0.5 text-[11px] text-ink-mute">
                  {it.minutes ?? "—"} min
                </div>
              </div>
            ))}
          </div>
        )}
        {skippedTodayItems.length > 0 && (
          <div className="mt-6 space-y-2">
            <p className="font-mono text-[10px] tracking-[0.18em] text-ink-mute">
              SKIPPED TODAY
            </p>
            {skippedTodayItems.map((it) => (
              <div
                key={it.id}
                className="rounded-sm border border-vault-line/40 bg-vault-panel/30 px-4 py-3 opacity-60"
              >
                <div className="vault-task-title text-ink-mute">{it.title}</div>
                <div className="mt-0.5 text-[11px] text-ink-mute">
                  {it.minutes ?? "—"} min
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function SortableScheduleRow({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
      }}
      className="flex items-stretch gap-2"
    >
      <button
        {...attributes}
        {...listeners}
        title="Drag to reorder"
        aria-label="Drag to reorder schedule item"
        className="cursor-grab select-none rounded-sm border border-vault-line/60 bg-vault-panel/45 px-1.5 font-mono text-[14px] leading-none text-brass/80 hover:border-brass/60 hover:text-brass active:cursor-grabbing"
      >
        ⋮⋮
      </button>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function fmtHrs(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
