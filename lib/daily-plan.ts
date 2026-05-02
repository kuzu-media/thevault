// Daily plan: bucket items by flags, pick ATM candidates by energy
// match, and produce a timed schedule that fills the day from dayStart.
//
// Two related but separate concerns:
//   classify()         → bucket counter items by urgent/must combinations
//   pickAtmCandidates → energy-matched filter for ATM items
//   buildSchedule     → emit timed blocks, admin-first or ATM-first
//                        based on the stressor anchor threshold

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

// Bucket items into the four flag-based piles. Set `todayOnly: true` to
// also drop items that aren't on today's plan (today_order = null) — used
// when feeding buildSchedule. The wizard's "What's heavy" review wants to
// see every counter item so the user can opt in, so it passes false.
export function classify(items: Item[], todayOnly = true): Classified {
  const stressors: ClassifiedItem[] = [];
  const timeSensitive: ClassifiedItem[] = [];
  const mustDo: ClassifiedItem[] = [];
  const otherAdmin: ClassifiedItem[] = [];

  for (const it of items) {
    if (it.deletedAt) continue;
    if (todayOnly && (it.todayOrder ?? null) === null) continue;
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

// Pick ATM items whose energy matches today's mood. Creative-leaning
// days surface CREATIVE items, problem-solving days surface PROB-SOLV,
// low-energy days unlock LEISURE/PEOPLE for rest. The tieBreak resolves
// even days; "leisure" tie-break is reserved (not yet wired in the UI).
export function pickAtmCandidates(
  atmItems: Item[],
  inputs: DayInputs,
): Item[] {
  const availMinutes = inputs.hoursAvailable * 60;
  const sum = inputs.creative + inputs.probSolv;
  const needLeisure = sum < 6;
  let needCreative = inputs.creative > inputs.probSolv;
  let needProb = inputs.creative < inputs.probSolv;
  const needLeisureOverride = false;
  if (inputs.creative === inputs.probSolv) {
    if (inputs.tieBreak === "CREATIVE") needCreative = true;
    else if (inputs.tieBreak === "PROB-SOLV") needProb = true;
  }

  return atmItems.filter((it) => {
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
  const configuredStart = new Date(
    endOfDay.getTime() - inputs.hoursAvailable * 60 * 60_000,
  );
  // Don't schedule into the past. If she runs Build Day at 11 AM with a
  // 9:30 AM configured start, the first block lands at 11 AM. The
  // configured dayStart still wins when "now" is before it (e.g. she
  // builds at 7 AM the night before for the next morning).
  const nowOnDate = now ?? new Date();
  const dayStart =
    nowOnDate > configuredStart && sameLocalDate(nowOnDate, configuredStart)
      ? nowOnDate
      : configuredStart;

  // adminPile = every counter item on today's plan, in priority order.
  // otherAdmin (neither urgent nor must) was being dropped from the
  // schedule — fixed: append at the tail so "neither" items also show up.
  const adminPile = [
    ...classified.stressors,
    ...classified.timeSensitive,
    ...classified.mustDo,
    ...classified.otherAdmin,
  ];

  // Admin-first vs ATM-first ordering. Either way, the day starts at
  // dayStart — the old "anchor admin to end-of-day" mode produced weird
  // 5:45 PM start times when ATM picks were empty, since the morning
  // had nothing to fill it. Now both branches start at dayStart.
  const adminFirst =
    classified.stressorsMinutes >= stressorAnchorMinutes;

  let cursor: Date = new Date(dayStart);
  const blocks: ScheduledBlock[] = [];

  if (adminFirst) {
    cursor = appendBlocks(blocks, adminPile, cursor);
    cursor = appendBlocks(blocks, atmPicks, cursor, "ATM_PICK");
  } else {
    cursor = appendBlocks(blocks, atmPicks, cursor, "ATM_PICK");
    cursor = appendBlocks(blocks, adminPile, cursor);
  }
  void endOfDay;
  void nowOnDate;

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

function sameLocalDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
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
