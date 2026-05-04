"use client";

import { useLayoutEffect, useState } from "react";

function greetingForHour(h: number): string {
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/** Local time-of-day line for the pre-build “today” prompt (eyebrow style). */
export function BuildPromptGreeting() {
  const [phrase, setPhrase] = useState("Good morning");

  useLayoutEffect(() => {
    setPhrase(greetingForHour(new Date().getHours()));
  }, []);

  return (
    <div className="eyebrow">
      — {phrase} —
    </div>
  );
}
