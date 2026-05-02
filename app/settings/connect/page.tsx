// Connect-your-devices walkthrough.
//
// Tracy's main complaint with the old sheet was capture friction. The point
// of this page is: in five minutes, she can drop a thought from her
// phone or her Mac without opening a tab. Each card is one mechanism with
// its own copyable snippet pre-filled with her userId + token + base URL.

import Link from "next/link";
import { headers } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { getSettings } from "@/lib/data";
import { ConnectDeviceCards } from "@/components/connect-device-cards";

export default async function ConnectPage() {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  const settings = await getSettings();
  const token = settings?.capture_token ?? null;

  // Resolve the public origin so snippets show real URLs.
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "the-vault.app";
  const baseUrl = `${proto}://${host}`;

  return (
    <div className="mx-auto max-w-[800px] px-4 py-8 md:px-10">
      <h1 className="serif-h text-[28px] leading-tight md:text-[36px]">
        Settings.
      </h1>
      <p className="mt-1 text-[13px] text-ink-dim">
        Connect The Vault to your iPhone and Mac so capture is one tap or one
        word away.
      </p>

      <div className="mt-4 flex flex-wrap gap-2 font-mono text-[10px] tracking-wider">
        <Link
          href="/settings"
          className="rounded-sm border border-vault-line px-3 py-1.5 text-ink-mute transition hover:border-brass/40 hover:text-brass"
        >
          GENERAL
        </Link>
        <Link
          href="/settings/members"
          className="rounded-sm border border-vault-line px-3 py-1.5 text-ink-mute transition hover:border-brass/40 hover:text-brass"
        >
          MEMBERS
        </Link>
        <Link
          href="/settings/boxes"
          className="rounded-sm border border-vault-line px-3 py-1.5 text-ink-mute transition hover:border-brass/40 hover:text-brass"
        >
          BOXES
        </Link>
        <Link
          href="/settings/records"
          className="rounded-sm border border-vault-line px-3 py-1.5 text-ink-mute transition hover:border-brass/40 hover:text-brass"
        >
          RECORDS
        </Link>
        <Link
          href="/settings/energies"
          className="rounded-sm border border-vault-line px-3 py-1.5 text-ink-mute transition hover:border-brass/40 hover:text-brass"
        >
          ENERGIES
        </Link>
        <Link
          href="/settings/connect"
          className="rounded-sm border border-brass bg-brass/10 px-3 py-1.5 text-brass"
        >
          CONNECT
        </Link>
      </div>

      <ConnectDeviceCards
        userId={user?.id ?? ""}
        token={token}
        baseUrl={baseUrl}
      />
    </div>
  );
}
