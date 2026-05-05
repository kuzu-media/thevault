"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { todayYmdInTz } from "@/lib/calendar-day-bounds";
import { syncOneVaultForDate } from "@/lib/google-calendar-sync";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase/server";

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
  return { sb, user, vaultId: membership.vault_id };
}

const CalendarSettingsSchema = z.object({
  calendar_id: z.string().min(1).max(500),
  timezone: z.string().min(1).max(80),
});

export async function saveGoogleCalendarSettings(formData: FormData) {
  const { sb, vaultId } = await requireUserAndVault();
  const parsed = CalendarSettingsSchema.parse({
    calendar_id: formData.get("calendar_id"),
    timezone: formData.get("timezone"),
  });

  const { error } = await sb
    .from("google_calendar_connections")
    .update({
      calendar_id: parsed.calendar_id,
      timezone: parsed.timezone,
      modified_at: new Date().toISOString(),
    })
    .eq("vault_id", vaultId);

  if (error) throw new Error(error.message);
  revalidatePath("/settings/calendar");
}

export async function disconnectGoogleCalendar() {
  const { sb, vaultId } = await requireUserAndVault();
  const admin = supabaseAdmin();
  await admin.from("google_calendar_secrets").delete().eq("vault_id", vaultId);
  const { error } = await sb
    .from("google_calendar_connections")
    .delete()
    .eq("vault_id", vaultId);
  if (error) throw new Error(error.message);
  revalidatePath("/settings/calendar");
}

export async function syncGoogleCalendarForMyVaultNow() {
  const { vaultId } = await requireUserAndVault();
  const admin = supabaseAdmin();
  const { data: conn } = await admin
    .from("google_calendar_connections")
    .select("vault_id, calendar_id, timezone")
    .eq("vault_id", vaultId)
    .maybeSingle();

  const { data: secret } = await admin
    .from("google_calendar_secrets")
    .select("refresh_token")
    .eq("vault_id", vaultId)
    .maybeSingle();

  if (!conn || !secret?.refresh_token) {
    throw new Error("Connect Google Calendar first.");
  }

  const ymd = todayYmdInTz(conn.timezone);
  const n = await syncOneVaultForDate(
    { ...conn, refresh_token: secret.refresh_token },
    ymd,
  );
  revalidatePath("/drop");
  revalidatePath("/", "layout");
  return { imported: n };
}
