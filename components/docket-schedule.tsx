"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { classify, buildSchedule } from "@/lib/daily-plan";
import type { DayInputs, Item } from "@/lib/types";
import { ScheduleWithNowLine } from "@/components/now-line";

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
        {blocks.length === 0 && (
          <p className="rounded-sm border border-dashed border-vault-line/60 bg-vault-panel/20 px-4 py-6 text-center text-ink-mute">
            Nothing scheduled. Add a custom block below, or rebuild the day.
          </p>
        )}
        {blocks.map((b, i) => (
          <ScheduleWithNowLine
            key={b.itemId}
            block={b}
            nextStart={blocks[i + 1]?.start}
            state={(stateById.get(b.itemId) as any) ?? "upcoming"}
          />
        ))}
        {children}
      </div>
    </>
  );
}

function fmtHrs(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
