"use client";

import { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  saveGoogleCalendarSettings,
  disconnectGoogleCalendar,
  syncGoogleCalendarForMyVaultNow,
} from "@/lib/calendar-actions";

type Cal = { id: string; summary: string; primary: boolean };

const DEFAULT_TZ = "America/Los_Angeles";

function timeZoneOptions(): string[] {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return [DEFAULT_TZ, "America/New_York", "America/Chicago", "UTC"];
  }
}

export function GoogleCalendarPanel({
  connected,
  calendarId,
  timezone,
}: {
  connected: boolean;
  calendarId: string;
  timezone: string;
}) {
  const search = useSearchParams();
  const [calendars, setCalendars] = useState<Cal[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [syncing, startSync] = useTransition();

  useEffect(() => {
    const err = search.get("error");
    const ok = search.get("connected");
    if (err) {
      toast.error(
        err === "no_refresh_token"
          ? "Google did not return a refresh token. Try again and make sure you check all access boxes."
          : `Could not connect: ${decodeURIComponent(err)}`,
      );
    } else if (ok === "1") {
      toast.success("Google Calendar connected.");
    }
  }, [search]);

  useEffect(() => {
    if (!connected) return;
    let cancelled = false;
    void fetch("/api/google-calendar/calendars")
      .then((r) => {
        if (!r.ok) throw new Error("Couldn't list calendars");
        return r.json() as Promise<{ calendars: Cal[] }>;
      })
      .then((j) => {
        if (!cancelled) {
          setCalendars(j.calendars);
          setLoadErr(null);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setLoadErr(e instanceof Error ? e.message : "Couldn't load calendars");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [connected]);

  const tzList = timeZoneOptions();
  const tzValue = timezone || DEFAULT_TZ;

  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-sm border border-vault-line/60 bg-vault-panel/30 p-4 text-[14px] leading-relaxed text-ink-dim">
        <p>
          When this is on, The Vault adds a <strong className="text-ink/90">Drop</strong>{" "}
          line for each calendar event on <strong className="text-ink/90">that day</strong>{" "}
          (in the time zone you pick). It runs in the background about every hour, and
          you can also pull in today&apos;s events with the button below. Each event is
          only added once per day.
        </p>
      </div>

      {!connected ? (
        <div>
          <a
            href="/api/google-calendar/auth"
            className="inline-block rounded-sm border border-brass bg-brass/10 px-4 py-2 text-[13px] text-brass transition hover:bg-brass/20"
          >
            Connect Google Calendar
          </a>
          <p className="mt-3 text-[12px] text-ink-mute">
            You&apos;ll sign in with Google and allow read-only access to your
            calendars. The Vault never changes your calendar.
          </p>
        </div>
      ) : (
        <>
          {loadErr && (
            <p className="text-[13px] text-rust">{loadErr}</p>
          )}
          <form action={saveGoogleCalendarSettings} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-[12px] text-ink-mute" htmlFor="calendar_id">
                Which calendar
              </label>
              <select
                id="calendar_id"
                name="calendar_id"
                defaultValue={calendarId || "primary"}
                className="max-w-md rounded-sm border border-vault-line bg-vault-bg/60 px-2.5 py-2 text-[13px] text-ink outline-none focus:border-brass"
                required
              >
                {calendars.length === 0 ? (
                  <option value={calendarId || "primary"}>
                    {calendarId || "primary"}
                  </option>
                ) : (
                  calendars.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.primary ? "★ " : ""}
                      {c.summary}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] text-ink-mute" htmlFor="timezone">
                Your time zone (for &ldquo;today&rdquo;)
              </label>
              <select
                id="timezone"
                name="timezone"
                defaultValue={tzValue}
                className="max-w-md rounded-sm border border-vault-line bg-vault-bg/60 px-2.5 py-2 text-[13px] text-ink outline-none focus:border-brass"
                required
              >
                {tzList.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                className="brass-button px-4 py-2 font-mono text-[10px] tracking-[0.24em] text-[#2a1c08]"
              >
                SAVE
              </button>
              <button
                type="button"
                disabled={syncing}
                onClick={() => {
                  startSync(() => {
                    void (async () => {
                      try {
                        const r = await syncGoogleCalendarForMyVaultNow();
                        toast.success(
                          r.imported === 0
                            ? "No new events to add (or nothing on today’s calendar)."
                            : `Added ${r.imported} to the Drop.`,
                        );
                      } catch (e) {
                        toast.error(
                          e instanceof Error ? e.message : "Couldn't sync.",
                        );
                      }
                    })();
                  });
                }}
                className="rounded-sm border border-vault-line px-3 py-2 text-[12px] text-ink-mute transition hover:border-brass/40 hover:text-brass disabled:opacity-50"
              >
                {syncing ? "Working…" : "Pull in today’s events now"}
              </button>
            </div>
          </form>

          <div className="flex flex-wrap gap-3 border-t border-vault-line/40 pt-6">
            <a
              href="/api/google-calendar/auth"
              className="text-[12px] text-brass underline-offset-2 hover:underline"
            >
              Re-connect Google
            </a>
            <form action={disconnectGoogleCalendar}>
              <button
                type="submit"
                className="text-[12px] text-ink-mute underline-offset-2 hover:text-rust hover:underline"
              >
                Disconnect Google Calendar
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
