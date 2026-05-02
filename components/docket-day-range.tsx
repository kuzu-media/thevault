"use client";

import { useEffect, useState } from "react";
import { dayScheduleWindow } from "@/lib/daily-plan";
import type { DayInputs } from "@/lib/types";

function fmt12Local(d: Date) {
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
}

/** Header range must run in the browser — SSR uses UTC and shifts times vs your zone. */
export function DocketDayRange({
  date,
  hoursAvailable,
  endOfDay,
}: Pick<DayInputs, "date" | "hoursAvailable" | "endOfDay">) {
  const [text, setText] = useState("");

  useEffect(() => {
    const inputs: DayInputs = {
      date,
      hoursAvailable,
      endOfDay,
      creative: 3,
      probSolv: 3,
      tieBreak: "PROB-SOLV",
    };
    const now = new Date();
    const { dayStart, endOfDay: end } = dayScheduleWindow(inputs, now);
    setText(`${fmt12Local(dayStart)} – ${fmt12Local(end)}`);
  }, [date, hoursAvailable, endOfDay]);

  return (
    <p className="mt-1 text-[13px] text-ink-dim" suppressHydrationWarning>
      {text || "\u00a0"}
    </p>
  );
}
