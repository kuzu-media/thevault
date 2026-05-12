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

// Set (or clear) the project for an entire week. Pass boxKey = null to
// unassign the week. Day overrides for that week are preserved — they
// continue to show through.
export async function setWeekProject(
  weekStart: string,
  boxKey: string | null,
) {
  const ws = YmdSchema.parse(weekStart);
  const bk = BoxKeySchema.parse(boxKey);
  const normalized = sundayOfYmd(ws);
  const { sb, vaultId } = await requireUserAndVault();

  if (bk === null || bk === "") {
    const { error } = await sb
      .from("calendar_week_assignments")
      .delete()
      .eq("vault_id", vaultId)
      .eq("week_start", normalized);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await sb.from("calendar_week_assignments").upsert(
      {
        vault_id: vaultId,
        week_start: normalized,
        box_key: bk,
        modified_at: new Date().toISOString(),
      },
      { onConflict: "vault_id,week_start", ignoreDuplicates: false },
    );
    if (error) throw new Error(error.message);
  }

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
