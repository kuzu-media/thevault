import Link from "next/link";

export function TopBar() {
  return (
    <header className="relative z-10 flex items-center justify-between border-b border-[#3a322b]/40 bg-vault-bg/80 px-10 py-4 backdrop-blur">
      <Link href="/" className="flex items-center gap-2.5">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="9.5" stroke="#B5853A" strokeWidth="1.4" />
          <circle cx="11" cy="11" r="4" stroke="#B5853A" strokeWidth="1.4" />
        </svg>
        <span className="serif-h text-[22px] text-ink">The Vault</span>
      </Link>
      <nav className="flex items-center gap-8 eyebrow">
        <Link href="/" className="text-brass-bright border-b-2 border-brass pb-3 -mb-3">
          Today
        </Link>
        <Link href="/vault" className="text-ink-mute hover:text-ink">
          Vault
        </Link>
        <Link href="/settings" className="text-ink-mute hover:text-ink">
          Settings
        </Link>
      </nav>
      <div className="flex items-center gap-3.5">
        <Link
          href="/deposit"
          className="brass-button px-4 py-2 text-[10px] font-mono tracking-[0.24em] text-[#2a1c08]"
        >
          + DEPOSIT · ⌘K
        </Link>
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#3a322b] bg-vault-panel text-brass-bright">
          T
        </div>
      </div>
    </header>
  );
}
