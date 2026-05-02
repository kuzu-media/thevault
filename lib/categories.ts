// Boxes are user-defined categories — life/business/project axes. They
// don't carry a destination on their own; a single box (e.g. SWB) can hold
// Drawer items (obligations) and Till items (energy-matched pulls) at the
// same time.
//
// Destination is its own axis, picked explicitly per item at triage time:
//   TILL   — energy-matched pulls; carries `category`, `energy`, `minutes`
//   DRAWER — obligations; carries `area`, `urgent`, `must`, `minutes`
//
// Boxes and energies both live in `settings` JSONB so they're editable
// from the Settings UI. No defaults — vaults start empty.

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

// Energies are pure metadata — they live on Till items, used by the daily
// energy-matching to decide what to pick today. Drawer items don't carry
// energy. (Tracy's MENU sheet has Energy as a column; ADMIN sheet doesn't.)
export type EnergyType = {
  key: string;
  label: string;
};

export const DEFAULT_ENERGIES: EnergyType[] = [];

function normalizeEnergy(raw: any): EnergyType | null {
  if (!raw || typeof raw !== "object") return null;
  const key = typeof raw.key === "string" ? raw.key : null;
  if (!key) return null;
  return {
    key,
    label: typeof raw.label === "string" ? raw.label : key,
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
