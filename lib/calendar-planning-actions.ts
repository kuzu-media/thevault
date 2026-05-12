"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { sundayOfYmd } from "@/lib/calendar-planning";

async function requireUserAndVault() {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: membership } = await sb
    .from("vault_members")
    .select("vault_id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!membership?.vault_id) throw new Error("No vault");
  return { sb, vaultId: membership.vault_id as string };
}

const YmdSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const BoxKeySchema = z.string().min(1).max(64).nullable();
const NoteSchema = z.string().max(2000).nullable();

type SupabaseClient = Awaited<ReturnType<typeof supabaseServer>>;

// Drop an entirely-empty week row (no project AND no note) so we don't
// accumulate ghost rows after the user clears everything.
async function cleanupEmptyWeek(
  sb: SupabaseClient,
  vaultId: string,
  weekStart: string,
) {
  const { data: row } = await sb
    .from("calendar_week_assignments")
    .select("box_key, note")
    .eq("vault_id", vaultId)
    .eq("week_start", weekStart)
    .maybeSingle();
  if (!row) return;
  const hasBox = !!row.box_key;
  const hasNote = typeof row.note === "string" && row.note.length > 0;
  if (!hasBox && !hasNote) {
    await sb
      .from("calendar_week_assignments")
      .delete()
      .eq("vault_id", vaultId)
      .eq("week_start", weekStart);
  }
}

// Set (or clear) the project for an entire week. Pass boxKey = null to
// unassign the week — the row is kept if the week has a note. Day
// overrides for that week are preserved either way.
export async function setWeekProject(
  weekStart: string,
  boxKey: string | null,
) {
  const ws = YmdSchema.parse(weekStart);
  const bk = BoxKeySchema.parse(boxKey);
  const normalized = sundayOfYmd(ws);
  const { sb, vaultId } = await requireUserAndVault();

  const { error } = await sb.from("calendar_week_assignments").upsert(
    {
      vault_id: vaultId,
      week_start: normalized,
      box_key: bk && bk !== "" ? bk : null,
      modified_at: new Date().toISOString(),
    },
    { onConflict: "vault_id,week_start", ignoreDuplicates: false },
  );
  if (error) throw new Error(error.message);

  if (!bk || bk === "") await cleanupEmptyWeek(sb, vaultId, normalized);

  revalidatePath("/calendar");
}

// Set (or clear) the note for a week. Pass note = null or "" to clear.
// Project (if any) is preserved.
export async function setWeekNote(weekStart: string, note: string | null) {
  const ws = YmdSchema.parse(weekStart);
  const n = NoteSchema.parse(note);
  const normalized = sundayOfYmd(ws);
  const trimmed = n?.trim() ?? "";
  const { sb, vaultId } = await requireUserAndVault();

  const { error } = await sb.from("calendar_week_assignments").upsert(
    {
      vault_id: vaultId,
      week_start: normalized,
      note: trimmed === "" ? null : trimmed,
      modified_at: new Date().toISOString(),
    },
    { onConflict: "vault_id,week_start", ignoreDuplicates: false },
  );
  if (error) throw new Error(error.message);

  if (trimmed === "") await cleanupEmptyWeek(sb, vaultId, normalized);

  revalidatePath("/calendar");
}

// Override a single day's project. Pass boxKey = null to remove the
// override — the day will then inherit from its week.
export async function setDayProject(date: string, boxKey: string | null) {
  const d = YmdSchema.parse(date);
  const bk = BoxKeySchema.parse(boxKey);
  const { sb, vaultId } = await requireUserAndVault();

  if (bk === null || bk === "") {
    const { error } = await sb
      .from("calendar_day_overrides")
      .delete()
      .eq("vault_id", vaultId)
      .eq("date", d);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await sb.from("calendar_day_overrides").upsert(
      {
        vault_id: vaultId,
        date: d,
        box_key: bk,
        modified_at: new Date().toISOString(),
      },
      { onConflict: "vault_id,date", ignoreDuplicates: false },
    );
    if (error) throw new Error(error.message);
  }

  revalidatePath("/calendar");
}
