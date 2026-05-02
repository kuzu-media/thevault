// Wizard: build today, one question at a time.
//
// Tracy answers her familiar five morning questions, reviews what's heavy,
// withdraws from the ATM, then lands on the Docket. Each step persists
// immediately so a refresh / phone-pickup keeps her place.

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
  const step = Math.max(1, Math.min(6, Number(stepParam ?? 1)));
  const date = todayISO();

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

  const classified = classify(counterItems);

  // Past the last step → bounce to home. Step 6 is itself a step (ATM), not
  // the exit.
  if (step > 6) redirect("/");

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
