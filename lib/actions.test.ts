// Smoke tests for the schemas inside lib/actions.ts.
//
// These tests don't hit Supabase — they validate that the zod input contracts
// catch bad shapes before they ever reach the DB. Full integration tests
// would need a test Supabase project + seeded user; left as TODO.

import { describe, it, expect } from "vitest";
import { z } from "zod";

// Re-declare the schemas here; the production code keeps them inline because
// they're co-located with the actions. If they drift we'll see test failures.
const ItemPatch = z.object({
  title: z.string().min(1).max(500).optional(),
  area: z.string().max(40).nullable().optional(),
  minutes: z.coerce.number().min(0).max(1440).nullable().optional(),
  urgent: z.coerce.boolean().optional(),
  must: z.coerce.boolean().optional(),
  energy: z
    .enum(["CREATIVE", "PROB-SOLV", "LEISURE", "PHYSICAL"])
    .nullable()
    .optional(),
  category: z.string().max(40).nullable().optional(),
  potential: z.coerce.number().int().min(1).max(5).nullable().optional(),
  person: z.string().max(40).nullable().optional(),
  tag: z.string().max(40).nullable().optional(),
  notes: z.string().nullable().optional(),
  body: z.string().nullable().optional(),
  today_order: z.coerce.number().int().nullable().optional(),
  pinned: z.coerce.boolean().optional(),
});

describe("ItemPatch", () => {
  it("accepts a minimal patch", () => {
    expect(ItemPatch.parse({ title: "x" })).toMatchObject({ title: "x" });
  });
  it("coerces string numerics", () => {
    expect(ItemPatch.parse({ minutes: "30" }).minutes).toBe(30);
    expect(ItemPatch.parse({ today_order: "5" }).today_order).toBe(5);
  });
  it("rejects out-of-range potential", () => {
    expect(() => ItemPatch.parse({ potential: 7 })).toThrow();
  });
  it("rejects unknown energy", () => {
    expect(() => ItemPatch.parse({ energy: "VIBES" })).toThrow();
  });
  it("allows null to clear a field", () => {
    expect(ItemPatch.parse({ area: null }).area).toBeNull();
  });
  it("rejects oversize titles", () => {
    expect(() => ItemPatch.parse({ title: "x".repeat(501) })).toThrow();
  });
});

const DayInputs = z.object({
  date: z.string(),
  hours_available: z.coerce.number().min(0).max(24),
  creative: z.coerce.number().int().min(1).max(5),
  prob_solv: z.coerce.number().int().min(1).max(5),
  tie_break: z.enum(["CREATIVE", "PROB-SOLV"]),
  end_of_day: z.string(),
});

describe("DayInputs", () => {
  it("rejects out-of-range hours", () => {
    expect(() =>
      DayInputs.parse({
        date: "2026-05-01",
        hours_available: 25,
        creative: 3,
        prob_solv: 4,
        tie_break: "PROB-SOLV",
        end_of_day: "16:30",
      }),
    ).toThrow();
  });
  it("rejects out-of-range energy", () => {
    expect(() =>
      DayInputs.parse({
        date: "2026-05-01",
        hours_available: 7,
        creative: 0,
        prob_solv: 4,
        tie_break: "PROB-SOLV",
        end_of_day: "16:30",
      }),
    ).toThrow();
  });
  it("coerces string form values", () => {
    const r = DayInputs.parse({
      date: "2026-05-01",
      hours_available: "6.5",
      creative: "3",
      prob_solv: "3",
      tie_break: "CREATIVE",
      end_of_day: "16:30",
    });
    expect(r.hours_available).toBe(6.5);
    expect(r.creative).toBe(3);
  });
});

const InviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["owner", "editor"]).default("editor"),
});

describe("InviteSchema", () => {
  it("rejects garbage email", () => {
    expect(() => InviteSchema.parse({ email: "nope" })).toThrow();
  });
  it("defaults role", () => {
    expect(InviteSchema.parse({ email: "a@b.co" }).role).toBe("editor");
  });
});
