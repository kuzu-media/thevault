import { NextResponse } from "next/server";
import { google } from "googleapis";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase/server";
import { getSiteUrlFromHeaders } from "@/lib/site-url";
import { getOAuthClient } from "@/lib/google-calendar-oauth";
import { headers } from "next/headers";

export const runtime = "nodejs";

export async function GET() {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: membership } = await sb
    .from("vault_members")
    .select("vault_id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!membership?.vault_id) {
    return NextResponse.json({ error: "No vault" }, { status: 400 });
  }

  const { data: conn } = await sb
    .from("google_calendar_connections")
    .select("vault_id")
    .eq("vault_id", membership.vault_id)
    .maybeSingle();

  if (!conn) {
    return NextResponse.json({ error: "Not connected" }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const { data: secret } = await admin
    .from("google_calendar_secrets")
    .select("refresh_token")
    .eq("vault_id", membership.vault_id)
    .maybeSingle();

  if (!secret?.refresh_token) {
    return NextResponse.json({ error: "Not connected" }, { status: 400 });
  }

  const h = await headers();
  const base = getSiteUrlFromHeaders(h);
  const redirectUri = `${base}/api/google-calendar/callback`;
  const oauth2 = getOAuthClient(redirectUri);
  oauth2.setCredentials({ refresh_token: secret.refresh_token });
  const calendar = google.calendar({ version: "v3", auth: oauth2 });

  const list = await calendar.calendarList.list({
    minAccessRole: "reader",
    maxResults: 250,
  });

  const calendars =
    list.data.items?.map((c) => ({
      id: c.id ?? "",
      summary: c.summary ?? c.id ?? "Calendar",
      primary: !!c.primary,
    })) ?? [];

  return NextResponse.json({ calendars: calendars.filter((c) => c.id) });
}
