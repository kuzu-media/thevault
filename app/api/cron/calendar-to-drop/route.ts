import { NextRequest, NextResponse } from "next/server";
import { syncAllVaultCalendarsToDrop } from "@/lib/google-calendar-sync";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!secret || auth !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Hobby plan allows one cron invocation per day (see vercel.json). Import
  // every connected vault on that run; each vault still uses its own timezone
  // to decide which calendar day is "today".
  const result = await syncAllVaultCalendarsToDrop();
  return NextResponse.json(result);
}
