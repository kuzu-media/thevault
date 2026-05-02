// Boxes are Tracy's single flat list of categories. Each item has a box +
// an energy. Routing is determined by ENERGY, not by the box:
//
//   energy = ADMIN          → goes to The Drawer  (area = box.key)
//   energy = anything else  → goes to The Till    (category = box.key)
//
// So a single box (e.g. PCS) can have items in both The Drawer (PCS admin
// work) and The Till (PCS creative work) at the same time.
//
// The list lives in settings.boxes JSONB so Tracy can edit it from
// /settings/boxes. The seed below is just the default for first-run.

import { supabaseServer } from "./supabase/server";

export type Box = {
  key: string;
  label: string;
  color?: string;
  meta?: string;
};

// No defaults — every vault starts empty. Owner sets up their own boxes
// from Settings → Boxes before they can triage from The Drop.
export const DEFAULT_BOXES: Box[] = [];

function normalize(raw: any): Box | null {
  if (!raw || typeof raw !== "object") return null;
  const key = typeof raw.key === "string" ? raw.key : null;
  if (!key) return null;
  return {
    key,
    label: typeof raw.label === "string" ? raw.label : key,
    color: typeof raw.color === "string" ? raw.color : undefined,
    meta: typeof raw.meta === "string" ? raw.meta : undefined,
  };
}

export async function getBoxes(): Promise<Box[]> {
  const sb = await supabaseServer();
  const { data } = await sb
    .from("settings")
    .select("boxes")
    .maybeSingle();
  const raw = (data?.boxes as any[]) ?? null;
  if (!raw || !Array.isArray(raw)) return [];
  return raw.map(normalize).filter((b): b is Box => b !== null);
}

export type Destination = "TILL" | "DRAWER";

// Energies are also user-editable. Each one has a destination that decides
// where a Drop item routes when she picks that energy.
export type EnergyType = {
  key: string;
  label: string;
  dest: Destination;
};

// No defaults — every vault starts empty. Owner sets up their own energies
// from Settings → Energies before they can triage from The Drop.
export const DEFAULT_ENERGIES: EnergyType[] = [];

function normalizeEnergy(raw: any): EnergyType | null {
  if (!raw || typeof raw !== "object") return null;
  const key = typeof raw.key === "string" ? raw.key : null;
  if (!key) return null;
  const dest =
    raw.dest === "DRAWER" || raw.dest === "TILL" ? raw.dest : "TILL";
  return {
    key,
    label: typeof raw.label === "string" ? raw.label : key,
    dest,
  };
}

export async function getEnergies(): Promise<EnergyType[]> {
  const sb = await supabaseServer();
  const { data } = await sb
    .from("settings")
    .select("energies")
    .maybeSingle();
  const raw = (data?.energies as any[]) ?? null;
  if (!raw || !Array.isArray(raw)) return [];
  return raw
    .map(normalizeEnergy)
    .filter((e): e is EnergyType => e !== null);
}

// Look up the destination for a given energy key from the user's list.
// Falls back to TILL if the key isn't in the list (custom unknown energy).
export function destinationForEnergy(
  energies: EnergyType[],
  key: string | null | undefined,
): Destination {
  if (!key) return "TILL";
  return energies.find((e) => e.key === key)?.dest ?? "TILL";
}
