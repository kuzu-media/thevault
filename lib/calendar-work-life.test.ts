import { describe, expect, it } from "vitest";
import type { Box } from "@/lib/categories";
import { calendarWorkLifeGroup } from "@/lib/calendar-work-life";

function box(label: string, key = label): Box {
  return { key, label };
}

describe("calendarWorkLifeGroup", () => {
  it("classifies work categories by label and abbreviations", () => {
    expect(calendarWorkLifeGroup(box("Stonewater Books"))).toBe("work");
    expect(calendarWorkLifeGroup(box("SWB"))).toBe("work");
    expect(calendarWorkLifeGroup(box("Ecom & Ecoship"))).toBe("work");
    expect(calendarWorkLifeGroup(box("ECOSHIP"))).toBe("work");
    expect(calendarWorkLifeGroup(box("PCS"))).toBe("work");
    expect(calendarWorkLifeGroup(box("Writing"))).toBe("work");
  });

  it("classifies other categories by label and abbreviations", () => {
    expect(calendarWorkLifeGroup(box("Travel"))).toBe("other");
    expect(calendarWorkLifeGroup(box("Leisure"))).toBe("other");
    expect(calendarWorkLifeGroup(box("Friends & Family"))).toBe("other");
    expect(calendarWorkLifeGroup(box("F&F"))).toBe("other");
    expect(calendarWorkLifeGroup(box("Home & Garden"))).toBe("other");
  });

  it("returns null for boxes outside work/life groups", () => {
    expect(calendarWorkLifeGroup(box("Health"))).toBeNull();
    expect(calendarWorkLifeGroup(box("Read / Watch"))).toBeNull();
  });
});
