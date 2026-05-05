import { NextRequest, NextResponse } from "next/server";
import { syncAllVaultCalendarsToDrop } from "@/lib/google-calendar-sync";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!secret || auth !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncAllVaultCalendarsToDrop();
  return NextResponse.json(result);
}
