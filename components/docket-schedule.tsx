"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  classify,
  buildSchedule,
  type ScheduledBlock,
} from "@/lib/daily-plan";
import type { DayInputs, Item } from "@/lib/types";
import { ScheduleWithNowLine } from "@/components/now-line";
import { reorderItems } from "@/lib/actions";
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
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
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
      const classified = classify(counterItems);
      const atmPicks = atmItems
        .filter((i) => i.todayOrder !== null)
        .sort((a, b) => (a.todayOrder ?? 0) - (b.todayOrder ?? 0));
      const blocks = buildSchedule({
        classified,
        atmPicks,
        inputs,
        now: new Date(),
      });
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
    const current = orderedBlocks.map((b) => b.itemId).join(",");
    const incoming = blocks.map((b) => b.itemId).join(",");
    if (current !== incoming) setOrderedBlocks(blocks);
    else if (orderedBlocks.length === blocks.length) {
      const same = orderedBlocks.every((b, i) => b === blocks[i]);
      if (!same) setOrderedBlocks(blocks);
    }
  }, [blocks, orderedBlocks]);

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
        title="Drag"
        className="cursor-grab select-none rounded-sm border border-vault-line/40 bg-vault-panel/30 px-1 font-mono text-[13px] text-ink-dim hover:border-brass/40 hover:text-brass active:cursor-grabbing"
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
