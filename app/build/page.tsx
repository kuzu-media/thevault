// Wizard: build today — one setup screen (energies + end time), Counter
// review, ATM picks. Each step persists so refresh keeps your place.

import { redirect } from "next/navigation";
import { getDayInputs, getItemsByBox, getSettings } from "@/lib/data";
import { defaultDayInputs } from "@/lib/data";
import { classify } from "@/lib/daily-plan";
import { BuildWizard } from "@/components/build-wizard";
import type { DayInputs } from "@/lib/types";

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function BuildDayPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const { step: stepParam } = await searchParams;
  const date = todayISO();
  let s = Number(stepParam ?? 1);
  if (!Number.isFinite(s) || s < 1) s = 1;
  if (s > 6) redirect("/");
  if (s === 5) s = 2;
  else if (s === 6) s = 3;
  const step = Math.max(1, Math.min(3, s));

  const [dayRow, counterItems, atmItems, settings] = await Promise.all([
    getDayInputs(date),
    getItemsByBox("COUNTER"),
    getItemsByBox("ATM"),
    getSettings(),
  ]);

  const dayRaw = dayRow ?? {
    ...defaultDayInputs(date),
    hours_available: settings?.default_hours ?? 7,
    end_of_day: settings?.default_end_of_day ?? "16:30",
  };
  const inputs: DayInputs = {
    date,
    hoursAvailable: Number(dayRaw.hours_available),
    creative: dayRaw.creative as DayInputs["creative"],
    probSolv: dayRaw.prob_solv as DayInputs["probSolv"],
    tieBreak: dayRaw.tie_break as DayInputs["tieBreak"],
    endOfDay: dayRaw.end_of_day,
  };

  // Wizard review wants every counter item (for opt-in), not just the
  // ones already on today's plan.
  const classified = classify(counterItems, /* todayOnly */ false);

  if (step > 3) redirect("/");

  return (
    <BuildWizard
      step={step}
      inputs={inputs}
      counterItems={counterItems}
      atmItems={atmItems}
      stressors={classified.stressors}
      timeSensitive={classified.timeSensitive}
      mustDo={classified.mustDo}
    />
  );
}
