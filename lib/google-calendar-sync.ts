import { google } from "googleapis";
import { formatInTimeZone } from "date-fns-tz";
import { revalidatePath } from "next/cache";
import { localDayBoundsUtc, todayYmdInTz } from "@/lib/calendar-day-bounds";
import { getOAuthClient } from "@/lib/google-calendar-oauth";
import { supabaseAdmin } from "@/lib/supabase/server";

type ConnectionRow = {
  vault_id: string;
  refresh_token: string;
  calendar_id: string;
  timezone: string;
};

function redirectUriForOAuth(): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "").trim() ?? "";
  if (!base) {
    throw new Error("Set NEXT_PUBLIC_SITE_URL for Google Calendar");
  }
  return `${base}/api/google-calendar/callback`;
}

type GCalEvent = {
  summary?: string | null;
  start?: { date?: string | null; dateTime?: string | null } | null;
};

function eventToTitle(event: GCalEvent, tz: string): string {
  const summary = (event.summary || "").trim() || "(No title)";
  if (event.start?.date) {
    return `${summary} (all day)`;
  }
  const startIso = event.start?.dateTime;
  if (startIso) {
    const t = formatInTimeZone(new Date(startIso), tz, "h:mm a");
    return `${t} — ${summary}`;
  }
  return summary;
}

/**
 * Import today’s events from the connected calendar into the Drop (deduped).
 * Uses each vault’s timezone to decide what “today” is.
 */
export async function syncAllVaultCalendarsToDrop(): Promise<{
  ok: boolean;
  vaults: number;
  imported: number;
  errors: string[];
}> {
  const admin = supabaseAdmin();
  const errors: string[] = [];
  const { data: rows, error } = await admin
    .from("google_calendar_connections")
    .select("vault_id, calendar_id, timezone");

  if (error) {
    return { ok: false, vaults: 0, imported: 0, errors: [error.message] };
  }
  if (!rows?.length) {
    return { ok: true, vaults: 0, imported: 0, errors: [] };
  }

  let imported = 0;
  for (const row of rows as Omit<ConnectionRow, "refresh_token">[]) {
    try {
      const { data: secret } = await admin
        .from("google_calendar_secrets")
        .select("refresh_token")
        .eq("vault_id", row.vault_id)
        .maybeSingle();
      if (!secret?.refresh_token) continue;

      const full: ConnectionRow = {
        ...row,
        refresh_token: secret.refresh_token,
      };
      const ymd = todayYmdInTz(row.timezone);
      const n = await syncOneVaultForDate(full, ymd);
      imported += n;
    } catch (e) {
      errors.push(
        `${row.vault_id}: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  if (imported > 0) {
    revalidatePath("/drop");
    revalidatePath("/", "layout");
  }

  return { ok: errors.length === 0, vaults: rows.length, imported, errors };
}

export async function syncOneVaultForDate(
  row: ConnectionRow,
  ymd: string,
): Promise<number> {
  const admin = supabaseAdmin();
  const oauth2 = getOAuthClient(redirectUriForOAuth());
  oauth2.setCredentials({ refresh_token: row.refresh_token });
  const calendar = google.calendar({ version: "v3", auth: oauth2 });

  const { start, end } = localDayBoundsUtc(ymd, row.timezone);
  const listRes = await calendar.events.list({
    calendarId: row.calendar_id,
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 250,
  });

  const events = listRes.data.items ?? [];
  const { data: vault } = await admin
    .from("vaults")
    .select("owner_id")
    .eq("id", row.vault_id)
    .maybeSingle();

  if (!vault?.owner_id) return 0;

  let count = 0;
  for (const event of events) {
    const eventId = event.id;
    if (!eventId) continue;

    const { data: existing } = await admin
      .from("calendar_drop_imports")
      .select("item_id")
      .eq("vault_id", row.vault_id)
      .eq("google_event_id", eventId)
      .eq("imported_for_date", ymd)
      .maybeSingle();

    if (existing) continue;

    const title = eventToTitle(event, row.timezone).slice(0, 200);

    const { data: item, error: itemErr } = await admin
      .from("items")
      .insert({
        vault_id: row.vault_id,
        user_id: vault.owner_id,
        box: "DROP",
        title,
        urgent: false,
        must: false,
        pinned: false,
      })
      .select("id")
      .single();

    if (itemErr || !item?.id) {
      throw new Error(itemErr?.message ?? "Couldn't create item");
    }

    const { error: capErr } = await admin.from("captures").insert({
      vault_id: row.vault_id,
      user_id: vault.owner_id,
      raw: title,
      source: "google_calendar",
      item_id: item.id,
    });

    if (capErr) {
      await admin.from("items").delete().eq("id", item.id);
      throw new Error(capErr.message);
    }

    const { error: impErr } = await admin.from("calendar_drop_imports").insert({
      vault_id: row.vault_id,
      google_event_id: eventId,
      imported_for_date: ymd,
      item_id: item.id,
    });

    if (impErr) {
      await admin.from("captures").delete().eq("item_id", item.id);
      await admin.from("items").delete().eq("id", item.id);
      throw new Error(impErr.message);
    }

    count += 1;
  }

  return count;
}
