/** Public base URL for OAuth redirects (no trailing slash). */

function hostFromHeaders(h: { get(name: string): string | null }): string | null {
  const raw = h.get("x-forwarded-host") ?? h.get("host");
  if (!raw) return null;
  const host = raw.split(",")[0]?.trim();
  if (!host || host.startsWith("localhost")) return null;
  return host;
}

/**
 * Prefer the host from the incoming request so OAuth matches the URL you are
 * actually using. Falls back to NEXT_PUBLIC_SITE_URL for local dev / cron.
 */
export function getSiteUrlFromHeaders(h: { get(name: string): string | null }): string {
  const host = hostFromHeaders(h);
  if (host) {
    const proto =
      h.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "https";
    return `${proto}://${host}`;
  }
  const env = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "").trim();
  if (env) return env;
  return "http://localhost:3000";
}

/** Env-only URL (cron / background jobs with no request host). */
export function getSiteUrlFromEnv(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "").trim() ??
    "http://localhost:3000"
  );
}
