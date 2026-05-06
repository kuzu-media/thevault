import { NextRequest, NextResponse } from "next/server";
import { syncAllVaultCalendarsToDropWithOptions } from "@/lib/google-calendar-sync";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!secret || auth !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Cron runs hourly; this gate makes auto-import daily at 5:00 AM local
  // per vault timezone (including DST shifts).
  const result = await syncAllVaultCalendarsToDropWithOptions({
    localHourOnly: 5,
  });
  return NextResponse.json(result);
}
