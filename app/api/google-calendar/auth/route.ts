import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { getSiteUrlFromHeaders } from "@/lib/site-url";
import { signCalendarOAuthState } from "@/lib/google-calendar-state";
import { getCalendarAuthUrl } from "@/lib/google-calendar-oauth";

export const runtime = "nodejs";

export async function GET() {
  const h = await headers();
  const base = getSiteUrlFromHeaders(h);
  try {
    const sb = await supabaseServer();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) {
      return NextResponse.redirect(`${base}/login?next=/api/google-calendar/auth`);
    }

    const { data: membership } = await sb
      .from("vault_members")
      .select("vault_id")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!membership?.vault_id) {
      return NextResponse.redirect(`${base}/onboarding`);
    }

    const redirectUri = `${base}/api/google-calendar/callback`;
    const state = signCalendarOAuthState(membership.vault_id, user.id);
    const url = getCalendarAuthUrl({ redirectUri, state });

    return NextResponse.redirect(url);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "oauth_start_failed";
    return NextResponse.redirect(
      `${base}/settings/calendar?error=${encodeURIComponent(msg)}`,
    );
  }
}
