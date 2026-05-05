import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase/server";
import { getSiteUrlFromHeaders } from "@/lib/site-url";
import { verifyCalendarOAuthState } from "@/lib/google-calendar-state";
import { getOAuthClient } from "@/lib/google-calendar-oauth";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

const STATE_MAX_AGE_MS = 15 * 60 * 1000;

export async function GET(req: NextRequest) {
  const h = await headers();
  const base = getSiteUrlFromHeaders(h);
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const err = req.nextUrl.searchParams.get("error");

  if (err) {
    return NextResponse.redirect(
      `${base}/settings/calendar?error=${encodeURIComponent(err)}`,
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${base}/settings/calendar?error=${encodeURIComponent("missing_code")}`,
    );
  }

  const parsed = verifyCalendarOAuthState(state, STATE_MAX_AGE_MS);
  if (!parsed) {
    return NextResponse.redirect(
      `${base}/settings/calendar?error=${encodeURIComponent("bad_state")}`,
    );
  }

  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user || user.id !== parsed.userId) {
    return NextResponse.redirect(`${base}/login`);
  }

  const redirectUri = `${base}/api/google-calendar/callback`;
  const oauth2 = getOAuthClient(redirectUri);
  const { tokens } = await oauth2.getToken(code);
  if (!tokens.refresh_token) {
    return NextResponse.redirect(
      `${base}/settings/calendar?error=${encodeURIComponent("no_refresh_token")}`,
    );
  }

  const { data: existing } = await sb
    .from("google_calendar_connections")
    .select("calendar_id, timezone")
    .eq("vault_id", parsed.vaultId)
    .maybeSingle();

  const admin = supabaseAdmin();
  const { error: secErr } = await admin.from("google_calendar_secrets").upsert(
    {
      vault_id: parsed.vaultId,
      refresh_token: tokens.refresh_token,
    },
    { onConflict: "vault_id" },
  );

  if (secErr) {
    return NextResponse.redirect(
      `${base}/settings/calendar?error=${encodeURIComponent(secErr.message)}`,
    );
  }

  const { error: upErr } = await sb.from("google_calendar_connections").upsert(
    {
      vault_id: parsed.vaultId,
      calendar_id: existing?.calendar_id ?? "primary",
      timezone: existing?.timezone ?? "America/Los_Angeles",
      connected_by: user.id,
      modified_at: new Date().toISOString(),
    },
    { onConflict: "vault_id" },
  );

  if (upErr) {
    return NextResponse.redirect(
      `${base}/settings/calendar?error=${encodeURIComponent(upErr.message)}`,
    );
  }

  revalidatePath("/settings/calendar");
  return NextResponse.redirect(`${base}/settings/calendar?connected=1`);
}
