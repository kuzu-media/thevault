"use client";
import { useEffect, useState } from "react";
import { ScheduleBlock } from "./schedule-block";
import type { ScheduledBlock } from "@/lib/daily-plan";

// Wraps a ScheduleBlock and renders a brass "now" line above it when "now"
// falls between the previous block's end and this block's start.
export function ScheduleWithNowLine({
  block,
  nextStart,
  state,
}: {
  block: ScheduledBlock;
  nextStart?: string;
  state: "upcoming" | "active" | "done" | "skipped" | "overrun";
}) {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const start = new Date(block.start).getTime();
  const end = new Date(block.end).getTime();
  const showAbove = now >= start && now < end;

  return (
    <>
      {showAbove && <NowLine now={now} />}
      <ScheduleBlock block={block} state={state} />
      {!showAbove &&
        nextStart &&
        now >= end &&
        now < new Date(nextStart).getTime() && <NowLine now={now} />}
    </>
  );
}

function NowLine({ now }: { now: number }) {
  const d = new Date(now);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  const time = `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
  return (
    <div className="my-1 flex items-center gap-3">
      <span className="rounded-sm bg-brass px-2 py-0.5 font-mono text-[10px] tracking-wider text-[#2a1c08]">
        NOW · {time}
      </span>
      <span className="h-px flex-1 bg-brass/60" />
    </div>
  );
}
