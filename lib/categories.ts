// Tracy's categories — what she calls "boxes." Stored in settings.boxes
// as JSON; each box has a key, label, destination (TILL or DRAWER), and
// optional color/meta. The Drop triage dropdown reads this list, the Drawer
// area pill reads the DRAWER-dest entries, the Till groups by category.

import { supabaseServer } from "./supabase/server";

export type CategoryDest = "TILL" | "DRAWER";

export type Box = {
  key: string;
  label: string;
  dest: CategoryDest;
  color?: string;
  meta?: string;
};

// Default seed if settings.boxes is empty. Editable in Settings → Boxes.
export const DEFAULT_BOXES: Box[] = [
  // Till (non-admin)
  { key: "PLD", label: "PLD", dest: "TILL" },
  { key: "CC", label: "CC", dest: "TILL" },
  { key: "NP", label: "NP", dest: "TILL" },
  { key: "HG", label: "HG", dest: "TILL" },
  { key: "READ/WATCH", label: "Read / Watch", dest: "TILL" },
  { key: "LEISURE", label: "Leisure", dest: "TILL" },
  { key: "PHYSICAL", label: "Physical", dest: "TILL" },
  { key: "PEOPLE", label: "People", dest: "TILL" },
  // Drawer (admin)
  { key: "PCS", label: "PCS", dest: "DRAWER" },
  { key: "QCOM", label: "Qcom", dest: "DRAWER" },
  { key: "SWB", label: "SWB", dest: "DRAWER" },
  { key: "ECOSHIP", label: "Ecoship", dest: "DRAWER" },
  { key: "ADVERT", label: "Advert", dest: "DRAWER" },
  { key: "HOME", label: "Home", dest: "DRAWER" },
  { key: "FF", label: "FF", dest: "DRAWER" },
  { key: "HEALTH", label: "Health", dest: "DRAWER" },
  { key: "TRAVEL", label: "Travel", dest: "DRAWER" },
];

function normalize(raw: any): Box | null {
  if (!raw || typeof raw !== "object") return null;
  const key = typeof raw.key === "string" ? raw.key : null;
  if (!key) return null;
  const dest =
    raw.dest === "DRAWER" || raw.dest === "TILL" ? raw.dest : "TILL";
  return {
    key,
    label: typeof raw.label === "string" ? raw.label : key,
    dest,
    color: typeof raw.color === "string" ? raw.color : undefined,
    meta: typeof raw.meta === "string" ? raw.meta : undefined,
  };
}

// Read the user's box list from settings, or fall back to defaults.
// Returns the seed (without writing) so first-run users see something
// immediately; writing happens on first save in the Boxes editor.
export async function getBoxes(): Promise<Box[]> {
  const sb = await supabaseServer();
  const { data } = await sb
    .from("settings")
    .select("boxes")
    .maybeSingle();
  const raw = (data?.boxes as any[]) ?? null;
  if (!raw || !Array.isArray(raw) || raw.length === 0) return DEFAULT_BOXES;
  const parsed = raw
    .map(normalize)
    .filter((b): b is Box => b !== null);
  return parsed.length ? parsed : DEFAULT_BOXES;
}

export function destinationFor(boxes: Box[], key: string): CategoryDest {
  return boxes.find((b) => b.key === key)?.dest ?? "TILL";
}
