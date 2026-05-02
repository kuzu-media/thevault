import { describe, it, expect } from "vitest";
import {
  classify,
  pickAtmCandidates,
  buildSchedule,
  parseTimeOnDate,
  thresholdCallout,
} from "./daily-plan";
import type { Item, DayInputs } from "./types";

const baseItem = (over: Partial<Item>): Item => ({
  id: crypto.randomUUID(),
  box: "ADMIN",
  title: "x",
  urgent: false,
  must: false,
  pinned: false,
  createdAt: new Date().toISOString(),
  modifiedAt: new Date().toISOString(),
  ...over,
});

const inputs: DayInputs = {
  date: "2026-05-01",
  hoursAvailable: 7,
  creative: 3,
  probSolv: 4,
  tieBreak: "PROB-SOLV",
  endOfDay: "16:30",
};

describe("classify", () => {
  it("buckets urgent+must as stressors", () => {
    const items = [
      baseItem({ title: "tax", urgent: true, must: true, minutes: 60 }),
      baseItem({ title: "call", urgent: true, must: false, minutes: 15 }),
      baseItem({ title: "ron", urgent: false, must: true, minutes: 30 }),
      baseItem({ title: "blog", urgent: false, must: false, minutes: 45 }),
    ];
    const r = classify(items);
    expect(r.stressors).toHaveLength(1);
    expect(r.timeSensitive).toHaveLength(1);
    expect(r.mustDo).toHaveLength(1);
    expect(r.otherAdmin).toHaveLength(1);
    expect(r.stressorsMinutes).toBe(60);
    expect(r.timeSensitiveMinutes).toBe(15);
    expect(r.mustDoMinutes).toBe(30);
  });

  it("ignores soft-deleted rows", () => {
    const items = [
      baseItem({
        urgent: true,
        must: true,
        minutes: 60,
        deletedAt: new Date().toISOString(),
      }),
    ];
    const r = classify(items);
    expect(r.stressors).toHaveLength(0);
  });
});

describe("pickAtmCandidates", () => {
  it("includes creative when creative > prob-solv", () => {
    const items = [
      baseItem({ box: "ATM", energy: "CREATIVE", minutes: 30, title: "a" }),
      baseItem({ box: "ATM", energy: "PROB-SOLV", minutes: 30, title: "b" }),
    ];
    const r = pickAtmCandidates(items, { ...inputs, creative: 4, probSolv: 2 });
    expect(r.map((x) => x.title)).toEqual(["a"]);
  });

  it("filters out items longer than available hours", () => {
    const items = [
      baseItem({
        box: "ATM",
        energy: "PROB-SOLV",
        minutes: 9999,
        title: "huge",
      }),
    ];
    const r = pickAtmCandidates(items, inputs);
    expect(r).toEqual([]);
  });

  it("low total energy unlocks LEISURE/PEOPLE", () => {
    const items = [
      baseItem({ box: "ATM", energy: "LEISURE", minutes: 30, title: "rest" }),
    ];
    const r = pickAtmCandidates(items, {
      ...inputs,
      creative: 2,
      probSolv: 2,
    });
    expect(r.map((x) => x.title)).toEqual(["rest"]);
  });
});

describe("buildSchedule", () => {
  it("anchors admin pile to end-of-day when stressors < threshold", () => {
    const classified = classify([
      baseItem({ urgent: true, must: true, minutes: 30, title: "S1" }),
      baseItem({ urgent: false, must: true, minutes: 60, title: "M1" }),
    ]);
    const blocks = buildSchedule({ classified, atmPicks: [], inputs });
    const last = blocks[blocks.length - 1];
    expect(new Date(last.end).toISOString()).toBe(
      parseTimeOnDate("16:30", "2026-05-01").toISOString(),
    );
  });

  it("runs admin first when stressors >= threshold", () => {
    const stressors = Array.from({ length: 5 }, () =>
      baseItem({ urgent: true, must: true, minutes: 25, title: "s" }),
    );
    const classified = classify(stressors);
    const blocks = buildSchedule({ classified, atmPicks: [], inputs });
    const first = blocks[0];
    expect(new Date(first.start).getHours()).toBe(9);
    expect(new Date(first.start).getMinutes()).toBe(30);
  });

  it("respects pinned scheduledStart", () => {
    const pinned = baseItem({
      urgent: false,
      must: true,
      minutes: 30,
      title: "P",
      pinned: true,
      scheduledStart: "2026-05-01T15:00:00.000Z",
    });
    const classified = classify([pinned]);
    const blocks = buildSchedule({ classified, atmPicks: [], inputs });
    expect(blocks[0].start).toBe("2026-05-01T15:00:00.000Z");
  });
});

describe("thresholdCallout", () => {
  it("speaks plain English under threshold", () => {
    const c = classify([
      baseItem({ urgent: true, must: true, minutes: 30, title: "S" }),
    ]);
    expect(thresholdCallout(c, inputs)).toMatch(/Today's Admin/);
  });
});
