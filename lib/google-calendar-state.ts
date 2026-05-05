import { createHmac, timingSafeEqual } from "crypto";

const PREFIX = "v1";

function secretKey(): string {
  const s =
    process.env.CALENDAR_OAUTH_STATE_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim();
  if (!s) {
    throw new Error(
      "Set CALENDAR_OAUTH_STATE_SECRET or CRON_SECRET for calendar OAuth",
    );
  }
  return s;
}

export function signCalendarOAuthState(vaultId: string, userId: string): string {
  const ts = Date.now();
  const payload = `${PREFIX}:${vaultId}:${userId}:${ts}`;
  const sig = createHmac("sha256", secretKey())
    .update(payload)
    .digest("base64url");
  return Buffer.from(`${payload}:${sig}`, "utf8").toString("base64url");
}

export function verifyCalendarOAuthState(
  state: string | null,
  maxAgeMs: number,
): { vaultId: string; userId: string } | null {
  if (!state) return null;
  let raw: string;
  try {
    raw = Buffer.from(state, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const parts = raw.split(":");
  if (parts.length !== 5 || parts[0] !== PREFIX) return null;
  const [, vaultId, userId, tsStr, sig] = parts;
  const ts = Number(tsStr);
  if (!vaultId || !userId || !Number.isFinite(ts)) return null;
  if (Date.now() - ts > maxAgeMs) return null;
  const payload = `${PREFIX}:${vaultId}:${userId}:${tsStr}`;
  const expected = createHmac("sha256", secretKey())
    .update(payload)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return { vaultId, userId };
}
