import Link from "next/link";
import clsx from "clsx";

export type BoxCardProps = {
  href: string;
  title: string;
  meta?: string;
  count?: number | string;
  accent?: "brass" | "rust" | "teal";
};

const ACCENT: Record<NonNullable<BoxCardProps["accent"]>, string> = {
  brass: "before:bg-brass/70",
  rust: "before:bg-rust/70",
  teal: "before:bg-teal/70",
};

// Calmer card: no plaque numbers, no big count, just title + a small dim
// "X items" line. Counts are present-but-dim, not loud.
export function BoxCard(p: BoxCardProps) {
  return (
    <Link
      href={p.href}
      className={clsx(
        "group relative flex h-[140px] w-full flex-col justify-end rounded-sm border border-vault-line/60 bg-vault-panel/40 p-4 transition hover:border-brass/40 hover:bg-vault-panel/60 sm:w-[240px]",
        "before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[2px]",
        ACCENT[p.accent ?? "brass"],
      )}
    >
      <h3 className="serif-h text-[22px] leading-tight text-ink">{p.title}</h3>
      <div className="mt-2 flex items-baseline justify-between font-mono text-[10px] tracking-wider text-ink-mute">
        {p.meta && <span>{p.meta.toLowerCase()}</span>}
        {p.count !== undefined && Number(p.count) > 0 && (
          <span>
            {p.count} item{p.count === 1 ? "" : "s"}
          </span>
        )}
      </div>
    </Link>
  );
}
