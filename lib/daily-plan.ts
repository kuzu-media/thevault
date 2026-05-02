// Port of plan_day.py classification + scheduling.
// Tracy's logic, kept faithful to the original — just expressed in TS and
// extended to produce timed blocks instead of an .rtf file.

import type { DayInputs, Item } from "./types";

export type Bucket = "STRESSOR" | "TIME_SENSITIVE" | "MUST_DO" | "OTHER_ADMIN";

export type ClassifiedItem = Item & { bucket: Bucket };

export type Classified = {
  stressors: ClassifiedItem[];
  timeSensitive: ClassifiedItem[];
  mustDo: ClassifiedItem[];
  otherAdmin: ClassifiedItem[];
  stressorsMinutes: number;
  timeSensitiveMinutes: number;
  mustDoMinutes: number;
};

export function classify(items: Item[]): Classified {
  const stressors: ClassifiedItem[] = [];
  const timeSensitive: ClassifiedItem[] = [];
  const mustDo: ClassifiedItem[] = [];
  const otherAdmin: ClassifiedItem[] = [];

  for (const it of items) {
    if (it.deletedAt) continue;
    const m = it.minutes ?? 0;
    if (it.urgent && it.must) {
      stressors.push({ ...it, bucket: "STRESSOR" });
    } else if (it.urgent) {
      timeSensitive.push({ ...it, bucket: "TIME_SENSITIVE" });
    } else if (it.must) {
      mustDo.push({ ...it, bucket: "MUST_DO" });
    } else {
      otherAdmin.push({ ...it, bucket: "OTHER_ADMIN" });
    }
    void m;
  }

  const sum = (xs: Item[]) =>
    xs.reduce((a, b) => a + (b.minutes ?? 0), 0);

  return {
    stressors,
    timeSensitive,
    mustDo,
    otherAdmin,
    stressorsMinutes: sum(stressors),
    timeSensitiveMinutes: sum(timeSensitive),
    mustDoMinutes: sum(mustDo),
  };
}

// Till selection — port of pick_menu_choices.
export function pickAtmCandidates(
  tillItems: Item[],
  inputs: DayInputs,
): Item[] {
  const availMinutes = inputs.hoursAvailable * 60;
  const sum = inputs.creative + inputs.probSolv;
  const needLeisure = sum < 6;
  let needCreative = inputs.creative > inputs.probSolv;
  let needProb = inputs.creative < inputs.probSolv;
  let needLeisureOverride = false;
  if (inputs.creative === inputs.probSolv) {
    if (inputs.tieBreak === "CREATIVE") needCreative = true;
    else if (inputs.tieBreak === "PROB-SOLV") needProb = true;
    // (legacy script also supports "leisure" tie-break — keep door open)
  }

  return tillItems.filter((it) => {
    if (it.deletedAt) continue_safe();
    const m = it.minutes ?? 0;
    if (m <= 0 || m > availMinutes) return false;
    const energy = (it.energy ?? "").toUpperCase();
    const cat = (it.category ?? "").toUpperCase();
    if (
      needLeisure &&
      (energy === "LEISURE" || energy === "PEOPLE" || cat === "PEOPLE")
    ) {
      return true;
    }
    if (needCreative && energy === "CREATIVE") return true;
    if (needProb && energy === "PROB-SOLV") return true;
    if (needLeisureOverride) return energy === "LEISURE";
    return false;
  });
}

// Tiny helper so the filter above reads cleanly without `continue`.
function continue_safe(): false {
  return false;
}

export type ScheduledBlock = {
  itemId: string;
  title: string;
  bucket: Bucket | "ATM_PICK" | "CUSTOM";
  minutes: number;
  start: string; // ISO
  end: string; // ISO
  pinned: boolean;
  area?: string | null;
  overflow?: boolean;
};

export type BuildScheduleArgs = {
  classified: Classified;
  atmPicks: Item[];
  inputs: DayInputs;
  stressorAnchorMinutes?: number;
  now?: Date;
};

// End-of-day anchored schedule.
//
// Logic:
//   1. Compute end-of-day Date from inputs.endOfDay ("HH:MM" 24-hr or "4:30 PM").
//   2. If stressorsMinutes < threshold, the admin pile (stressors + time-sensitive
//      + must-do) is anchored so it FINISHES at end-of-day. Till picks fill earlier.
//   3. If stressorsMinutes >= threshold, admin runs FIRST starting at the
//      day-start (computed = endOfDay - hoursAvailable). Till picks come after.
//   4. Pinned items keep their scheduledStart; everything else flows around them.
export function buildSchedule({
  classified,
  atmPicks,
  inputs,
  stressorAnchorMinutes = 91,
  now,
}: BuildScheduleArgs): ScheduledBlock[] {
  const endOfDay = parseTimeOnDate(inputs.endOfDay, inputs.date);
  const dayStart = new Date(
    endOfDay.getTime() - inputs.hoursAvailable * 60 * 60_000,
  );

  const adminPile = [
    ...classified.stressors,
    ...classified.timeSensitive,
    ...classified.mustDo,
  ];
  const adminMinutes = sumMinutes(adminPile);
  const atmMinutes = sumMinutes(atmPicks);

  // Admin-first vs admin-anchored-to-end.
  const adminFirst =
    classified.stressorsMinutes >= stressorAnchorMinutes;

  let cursor: Date;
  const blocks: ScheduledBlock[] = [];

  if (adminFirst) {
    cursor = new Date(dayStart);
    cursor = appendBlocks(blocks, adminPile, cursor);
    cursor = appendBlocks(blocks, atmPicks, cursor, "ATM_PICK");
  } else {
    // Till first, then admin lands at end-of-day.
    const adminStart = new Date(endOfDay.getTime() - adminMinutes * 60_000);
    cursor = new Date(dayStart);
    cursor = appendBlocks(blocks, atmPicks, cursor, "ATM_PICK");
    // If till + admin together overshoot, admin still anchors to end-of-day;
    // till blocks may overlap day_start (caller can flag overflow).
    cursor = new Date(adminStart);
    cursor = appendBlocks(blocks, adminPile, cursor);
    void atmMinutes;
  }

  // Apply pins last — items with their own scheduledStart override.
  for (const block of blocks) {
    const source = [...adminPile, ...atmPicks].find(
      (i) => i.id === block.itemId,
    );
    if (source?.pinned && source.scheduledStart) {
      const s = new Date(source.scheduledStart);
      const e = new Date(s.getTime() + block.minutes * 60_000);
      block.start = s.toISOString();
      block.end = e.toISOString();
      block.pinned = true;
    }
  }
  void now;

  return blocks;
}

function sumMinutes(items: Item[]): number {
  return items.reduce((a, b) => a + (b.minutes ?? 0), 0);
}

function appendBlocks(
  out: ScheduledBlock[],
  items: Item[],
  cursor: Date,
  forceBucket?: ScheduledBlock["bucket"],
): Date {
  let c = new Date(cursor);
  for (const it of items) {
    const minutes = it.minutes ?? 0;
    if (minutes <= 0) continue;
    const start = new Date(c);
    const end = new Date(c.getTime() + minutes * 60_000);
    out.push({
      itemId: it.id,
      title: it.title,
      bucket:
        forceBucket ??
        ((it as ClassifiedItem).bucket as Bucket) ??
        "OTHER_ADMIN",
      minutes,
      start: start.toISOString(),
      end: end.toISOString(),
      pinned: it.pinned,
      area: it.area,
    });
    c = end;
  }
  return c;
}

// Accepts "16:30", "4:30 PM", "4 PM" etc. and combines with an ISO date string.
export function parseTimeOnDate(time: string, isoDate: string): Date {
  const [y, m, d] = isoDate.split("-").map(Number);
  const t = time.trim().toUpperCase();
  let h = 0;
  let min = 0;
  const ampm = /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/.exec(t);
  if (ampm) {
    h = Number(ampm[1]);
    min = Number(ampm[2] ?? "0");
    if (ampm[3] === "PM" && h !== 12) h += 12;
    if (ampm[3] === "AM" && h === 12) h = 0;
  } else {
    const m24 = /^(\d{1,2}):(\d{2})$/.exec(t);
    if (!m24) throw new Error(`Bad time: ${time}`);
    h = Number(m24[1]);
    min = Number(m24[2]);
  }
  return new Date(y, m - 1, d, h, min, 0, 0);
}

// Produces the threshold-callout message the Docket header needs.
export function thresholdCallout(
  classified: Classified,
  inputs: DayInputs,
  threshold = 91,
): string {
  if (classified.stressorsMinutes >= threshold) {
    return "Today's Admin tasks should be done first";
  }
  const endOfDay = parseTimeOnDate(inputs.endOfDay, inputs.date);
  const start = new Date(
    endOfDay.getTime() - classified.stressorsMinutes * 60_000,
  );
  return `Today's Admin tasks should be started at ${formatHHMM12(start)}`;
}

function formatHHMM12(d: Date): string {
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
}
