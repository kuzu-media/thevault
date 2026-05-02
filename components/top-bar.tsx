import Link from "next/link";
import { getSettings } from "@/lib/data";
import { VaultHomeLink } from "@/components/vault-home-link";
import { supabaseServer } from "@/lib/supabase/server";
import { TopBarNav } from "./top-bar-nav";
import { SealToggle } from "./seal-toggle";

// Top bar is a Server Component so we can read settings (sealed flag).
// The nav itself is a Client Component because it needs usePathname.
// We render nothing for unauthed users — login/onboarding stand alone.

export async function TopBar() {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;

  const { data: membership } = await sb
    .from("vault_members")
    .select("vault_id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!membership) return null;

  const settings = await getSettings();
  const sealed = !!settings?.sealed;

  return (
    <header className="relative z-10 flex items-center justify-between gap-3 border-b border-[#3a322b]/30 bg-vault-bg/80 px-4 py-3 backdrop-blur md:px-10 md:py-4">
      <VaultHomeLink className="flex shrink-0 items-center gap-2.5">
        <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="9.5" stroke="#B5853A" strokeWidth="1.4" />
          <circle cx="11" cy="11" r="4" stroke="#B5853A" strokeWidth="1.4" />
        </svg>
        <span className="serif-h hidden text-[20px] text-ink md:inline md:text-[22px]">
          The Vault
        </span>
      </VaultHomeLink>

      <TopBarNav />

      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/deposit"
          className="rounded-sm border border-brass/40 px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-brass hover:bg-brass/10"
          title="Deposit"
        >
          + DEPOSIT
        </Link>
        <SealToggle sealed={sealed} />
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            title="Sign out"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#3a322b] bg-vault-panel text-brass-bright hover:border-brass"
          >
            T
          </button>
        </form>
      </div>
    </header>
  );
}
