/** Collapsed setup reference — not an error banner. */
export function CalendarOAuthSetupNote() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "").trim();
  const hasGoogleCreds =
    !!(
      process.env.GOOGLE_CALENDAR_CLIENT_ID?.trim() ||
      process.env.GOOGLE_CLIENT_ID?.trim()
    ) &&
    !!(
      process.env.GOOGLE_CALENDAR_CLIENT_SECRET?.trim() ||
      process.env.GOOGLE_CLIENT_SECRET?.trim()
    );

  if (!siteUrl) {
    return (
      <p className="mt-10 rounded-sm border border-rust/40 bg-rust/5 px-3 py-2 text-[12px] text-rust">
        Server misconfiguration: set{" "}
        <span className="font-mono">NEXT_PUBLIC_SITE_URL</span> in Vercel (e.g.{" "}
        <span className="font-mono">https://the-vault-gray-five.vercel.app</span>
        ), then redeploy.
      </p>
    );
  }

  const callback = `${siteUrl}/api/google-calendar/callback`;

  return (
    <details className="mt-10 rounded-sm border border-vault-line/50 bg-vault-panel/20 px-3 py-2 text-[12px] text-ink-mute">
      <summary className="cursor-pointer font-mono tracking-[0.12em]">
        GOOGLE OAUTH SETUP REFERENCE (not an error)
      </summary>
      <div className="mt-3 space-y-2 leading-relaxed">
        {!hasGoogleCreds ? (
          <p className="text-rust">
            Missing Google OAuth credentials on the server (
            <span className="font-mono">GOOGLE_CALENDAR_CLIENT_ID</span> /{" "}
            <span className="font-mono">SECRET</span>, or{" "}
            <span className="font-mono">GOOGLE_CLIENT_ID</span> /{" "}
            <span className="font-mono">SECRET</span>).
          </p>
        ) : null}
        <p>
          In Google Cloud → Credentials → your OAuth client, register this
          redirect URI exactly:
        </p>
        <p className="break-all font-mono text-[11px] text-brass">{callback}</p>
        <p>
          Open The Vault at{" "}
          <span className="font-mono text-ink/80">{siteUrl}</span> when you
          connect — not an old <span className="font-mono">*.vercel.app</span>{" "}
          URL from a previous project.
        </p>
      </div>
    </details>
  );
}
