import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { todayYmdInTz } from "@/lib/calendar-day-bounds";

/**
 * IANA zone for the vault’s calendar day on the server. Vercel runs Node in UTC,
 * so Date#getDate() alone rolls at UTC midnight; this fixes “today” to a chosen zone.
 *
 * Default `Etc/GMT+4` is a fixed UTC−4 offset (IANA `Etc/GMT` signs are inverted).
 * Override with `VAULT_DAY_TIMEZONE` (e.g. `America/New_York` for US Eastern with DST).
 */
export const VAULT_DAY_TIMEZONE =
  process.env.VAULT_DAY_TIMEZONE?.trim() || "Etc/GMT+4";

export function vaultTodayYmd(): string {
  return todayYmdInTz(VAULT_DAY_TIMEZONE);
}

/** Day of month in the vault zone (e.g. for rotating copy on the docket). */
export function vaultZonedDayOfMonth(): number {
  return Number(format(toZonedTime(new Date(), VAULT_DAY_TIMEZONE), "d"));
}
