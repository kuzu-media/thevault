#!/usr/bin/env tsx
/**
 * One-shot import: Google Sheet → Supabase.
 *
 * Reads service-account JSON via GOOGLE_APPLICATION_CREDENTIALS, pulls each
 * tab with the appropriate column mapping, inserts into `items` for the
 * supplied user_id (an auth.uid), and seeds settings.boxes / records /
 * energies so the Vault renders without manual setup afterward.
 *
 * The tab names hardcoded below match the source sheet this was built
 * for; missing tabs are skipped silently. Adapt the fetchTab list at
 * the bottom of main() if you point this at a different sheet.
 *
 * Usage:
 *   tsx scripts/migrate-from-sheet.ts <userId>
 *
 * Required env (all in .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SHEET_ID
 *   GOOGLE_APPLICATION_CREDENTIALS  (path, relative to web/)
 */

import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const userId = process.argv[2];
if (!userId) {
  console.error("Usage: tsx scripts/migrate-from-sheet.ts <userId>");
  process.exit(1);
}

require("dotenv").config({ path: ".env.local" });

const SHEET_ID = process.env.SHEET_ID!;
const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPA_SVC = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const CRED_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS!;
if (!SHEET_ID || !SUPA_URL || !SUPA_SVC || !CRED_PATH) {
  console.error("Missing one of SHEET_ID / Supabase / GOOGLE_APPLICATION_CREDENTIALS");
  process.exit(1);
}

const auth = new google.auth.GoogleAuth({
  keyFile: resolve(CRED_PATH),
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});
const sheets = google.sheets({ version: "v4", auth });
const sb = createClient(SUPA_URL, SUPA_SVC, { auth: { persistSession: false } });

type Row = string[];

async function fetchTab(name: string): Promise<Row[]> {
  const r = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `'${name}'!A1:Z2000`,
  });
  return (r.data.values ?? []) as Row[];
}

const isY = (v: string | undefined) =>
  (v ?? "").trim().toLowerCase() === "y";
const num = (v: string | undefined) => {
  const n = parseFloat((v ?? "").toString().trim());
  return Number.isFinite(n) ? n : null;
};

type Insert = {
  vault_id: string;
  user_id: string;
  box: string;
  title: string;
  area?: string | null;
  minutes?: number | null;
  urgent: boolean;
  must: boolean;
  pinned: boolean;
  today_order?: number | null;
  energy?: string | null;
  category?: string | null;
  potential?: number | null;
  person?: string | null;
  tag?: string | null;
  notes?: string | null;
  body?: string | null;
};

const baseFlags = { urgent: false, must: false, pinned: false } as const;

// Normalize sheet free-text into the canonical box-key form so Counter
// areas and ATM categories line up with settings.boxes after import.
// Mirrors deriveKey() in components/boxes-editor.tsx.
function deriveKey(label: string): string | null {
  const s = label
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_/-]/g, "")
    .slice(0, 40);
  return s || null;
}

function fromAdmin(rows: Row[]): Insert[] {
  // Layout: A=area, B=minutes, C=urgent, D=today's-order, E=must, F=description
  const out: Insert[] = [];
  rows.slice(2).forEach((r) => {
    const desc = (r[5] ?? "").trim();
    if (!desc) return;
    out.push({
      ...baseFlags,
      vault_id: vaultId,
      user_id: userId,
      box: "COUNTER",
      title: desc,
      area: deriveKey((r[0] ?? "").trim()),
      minutes: num(r[1]),
      urgent: isY(r[2]),
      must: isY(r[4]),
      today_order: num(r[3]),
    });
  });
  return out;
}

function fromMenu(rows: Row[]): Insert[] {
  // Layout: A=energy, B=category, C=minutes, D=task
  const out: Insert[] = [];
  rows.slice(1).forEach((r) => {
    const task = (r[3] ?? "").trim();
    if (!task) return;
    out.push({
      ...baseFlags,
      vault_id: vaultId,
      user_id: userId,
      box: "ATM",
      title: task,
      energy: deriveKey((r[0] ?? "").trim()),
      category: deriveKey((r[1] ?? "").trim()),
      minutes: num(r[2]),
    });
  });
  return out;
}

function fromPcsIdeas(rows: Row[]): Insert[] {
  // Header guess: Potential / Time / Person / Admin-Creative / Category / Task
  const out: Insert[] = [];
  rows.slice(1).forEach((r) => {
    const task = (r[5] ?? r[4] ?? "").trim();
    if (!task) return;
    const potRaw = num(r[0]);
    const potential = potRaw && potRaw >= 1 && potRaw <= 5 ? potRaw : null;
    out.push({
      ...baseFlags,
      vault_id: vaultId,
      user_id: userId,
      box: "PCS_IDEAS",
      title: task,
      potential,
      minutes: num(r[1]),
      person: (r[2] ?? "").trim() || null,
      tag: (r[3] ?? "").trim() || null,
      category: (r[4] ?? "").trim() || null,
    });
  });
  return out;
}

function fromGenericList(rows: Row[], box: string): Insert[] {
  // Treat the first non-empty cell of each row as the title; everything else
  // joined as `notes`. Used for low-schema tabs (READ/RESEARCH, MISC IDEAS,
  // HEALTH IDEAS, Ron, PCS DELEGATION, PCS misc).
  const out: Insert[] = [];
  rows.slice(1).forEach((r) => {
    const cells = r.map((c) => (c ?? "").toString().trim()).filter(Boolean);
    if (!cells.length) return;
    const [title, ...rest] = cells;
    out.push({
      ...baseFlags,
      vault_id: vaultId,
      user_id: userId,
      box,
      title,
      notes: rest.length ? rest.join(" — ") : null,
    });
  });
  return out;
}

function fromRecord(rows: Row[], title: string, box: string): Insert {
  // Whole-tab → single Record row, body = TSV preserving structure.
  const body = rows.map((r) => r.join("\t")).join("\n");
  return {
    ...baseFlags,
    vault_id: vaultId,
    user_id: userId,
    box,
    title,
    body,
  };
}

let vaultId = "";

async function resolveVault() {
  const { data: existing } = await sb
    .from("vault_members")
    .select("vault_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing?.vault_id) return existing.vault_id;

  // No membership yet — create a vault for this user.
  const { data: v, error: ve } = await sb
    .from("vaults")
    .insert({ name: "The Vault", owner_id: userId })
    .select("id")
    .single();
  if (ve || !v) throw ve ?? new Error("vault create failed");
  await sb.from("vault_members").insert({
    vault_id: v.id,
    user_id: userId,
    role: "owner",
  });
  return v.id;
}

async function main() {
  vaultId = await resolveVault();
  console.log("Vault:", vaultId);
  console.log("Reading sheet…");
  const [
    admin,
    menu,
    pcsIdeas,
    pcsDeleg,
    readResearch,
    healthIdeas,
    miscIdeas,
    ron,
    swbPlan,
    measurements,
    lifting,
    pcsMisc,
    notes,
  ] = await Promise.all([
    fetchTab("ADMIN"),
    fetchTab("MENU"),
    fetchTab("PCS IDEAS").catch(() => []),
    fetchTab("PCS DELEGATION").catch(() => []),
    fetchTab("READ-RESEARCH").catch(() => fetchTab("READ/RESEARCH").catch(() => [])),
    fetchTab("HEALTH IDEAS").catch(() => []),
    fetchTab("MISC IDEAS").catch(() => []),
    fetchTab("Ron").catch(() => []),
    fetchTab("SWB PLAN").catch(() => []),
    fetchTab("measurements").catch(() => []),
    fetchTab("lifting").catch(() => []),
    fetchTab("PCS misc").catch(() => []),
    fetchTab("Notes").catch(() => []),
  ]);

  const inserts: Insert[] = [
    ...fromAdmin(admin),
    ...fromMenu(menu),
    ...fromPcsIdeas(pcsIdeas),
    ...fromGenericList(pcsDeleg, "PCS_DELEGATION"),
    ...fromGenericList(readResearch, "READ_RESEARCH"),
    ...fromGenericList(healthIdeas, "HEALTH_IDEAS"),
    ...fromGenericList(miscIdeas, "MISC_IDEAS"),
    ...fromGenericList(ron, "RON"),
    fromRecord(swbPlan, "SWB Plan", "SWB_PLAN"),
    fromRecord(measurements, "Measurements", "MEASUREMENTS"),
    fromRecord(lifting, "Lifting", "LIFTING"),
    fromRecord(pcsMisc, "PCS Misc", "PCS_MISC"),
    fromRecord(notes, "Notes", "NOTES"),
  ];

  console.log(`Inserting ${inserts.length} rows…`);
  const { error } = await sb.from("items").insert(inserts);
  if (error) {
    console.error("Insert failed:", error);
    process.exit(1);
  }

  // The Vault page only renders configured boxes / records (settings.boxes
  // and settings.records). Derive both from the items we just inserted so
  // the user lands on a populated Vault, not an empty shell.
  await seedSettingsFromItems(inserts);

  console.log("Done.");
}

// Record-shaped tabs: each became a single Insert with `body`. Box-shaped
// tabs got many Inserts with `title`. We walk the Insert list, partition
// by that signal, and dedupe.
async function seedSettingsFromItems(inserts: Insert[]) {
  const recordKeys = new Set<string>();
  const boxKeys = new Set<string>();
  const energySet = new Set<string>();

  for (const it of inserts) {
    if (it.body) {
      recordKeys.add(it.box);
    } else if (it.box !== "COUNTER" && it.box !== "ATM") {
      boxKeys.add(it.box);
    }
    // Counter areas + ATM categories are also boxes — they're the user's
    // category axis, just stored on items rather than as the box key.
    // Without folding them in, the ATM page groups by category and
    // /counter filters by area, but the configured boxes list omits them.
    if (it.box === "COUNTER" && it.area) boxKeys.add(it.area);
    if (it.box === "ATM" && it.category) boxKeys.add(it.category);
    if (it.energy) energySet.add(it.energy);
  }

  const boxes = Array.from(boxKeys)
    .sort()
    .map((key) => ({ key, label: prettify(key) }));
  const records = Array.from(recordKeys)
    .sort()
    .map((key) => ({ key, label: prettify(key) }));
  const energies = Array.from(energySet)
    .sort()
    .map((key) => ({ key, label: prettify(key) }));

  const { error } = await sb.from("settings").upsert({
    vault_id: vaultId,
    boxes,
    records,
    energies,
  });
  if (error) {
    console.error("Settings seed failed:", error);
    return;
  }
  console.log(
    `Seeded settings: ${boxes.length} boxes, ${records.length} records, ${energies.length} energies.`,
  );
}

function prettify(key: string): string {
  return key
    .split(/[_\s-]+/)
    .map((p) => p.charAt(0) + p.slice(1).toLowerCase())
    .join(" ");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
