import Link from "next/link";

export default function SealedPage() {
  return (
    <div className="relative flex min-h-[80vh] flex-col items-center justify-center px-10">
      <div className="absolute inset-0 lamp-glow opacity-50" />
      <div className="relative flex flex-col items-center gap-6">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r="55" stroke="#B5853A" strokeWidth="2" />
          <circle cx="60" cy="60" r="40" stroke="#B5853A" strokeWidth="1" opacity="0.5" />
          <circle cx="60" cy="60" r="6" fill="#B5853A" />
        </svg>
        <h1 className="serif-h text-[36px] text-ink">The Vault is sealed.</h1>
        <p className="text-center text-ink-dim">
          Today is closed. Anything that comes up still lands in The Drop.
        </p>
        <div className="flex gap-3">
          <Link
            href="/"
            className="brass-button px-6 py-2 font-mono text-[10px] tracking-[0.24em] text-[#2a1c08]"
          >
            UNSEAL · OPEN VAULT
          </Link>
          <Link
            href="/deposit"
            className="rounded-sm border border-brass/40 px-6 py-2 font-mono text-[10px] tracking-[0.24em] text-brass hover:bg-brass/10"
          >
            + DEPOSIT · ⌘K
          </Link>
        </div>
      </div>
    </div>
  );
}
