/** Public base URL for OAuth redirects (no trailing slash). */
export function getSiteUrlFromHeaders(h: { get(name: string): string | null }): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "").trim();
  if (env) return env;
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}
