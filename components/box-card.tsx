import Link from "next/link";
import clsx from "clsx";

export type BoxCardProps = {
  title: string;
  meta?: string;
  count?: number | string;
  accent?: "brass" | "rust" | "teal";
  href?: string;
  /** When set, the card is a button (e.g. expand in place on the vault hub). */
  onPress?: () => void;
  selected?: boolean;
};

const ACCENT: Record<NonNullable<BoxCardProps["accent"]>, string> = {
  brass: "before:bg-brass/70",
  rust: "before:bg-rust/70",
  teal: "before:bg-teal/70",
};

// Calmer card: no plaque numbers, no big count, just title + a small dim
// "X items" line. Counts are present-but-dim, not loud.
export function BoxCard(p: BoxCardProps) {
  const shell = clsx(
    "group relative flex h-[140px] w-full flex-col justify-end rounded-sm border border-vault-line/60 bg-vault-panel/40 p-4 transition hover:border-brass/40 hover:bg-vault-panel/60 sm:w-[240px]",
    "before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[2px]",
    ACCENT[p.accent ?? "brass"],
    p.selected &&
      "border-brass/50 bg-vault-panel/70 ring-1 ring-brass/25 hover:border-brass/60",
  );

  const inner = (
    <>
      <h3 className="serif-h text-[22px] leading-tight text-ink">{p.title}</h3>
      <div className="mt-2 flex items-baseline justify-between font-mono text-[10px] tracking-wider text-ink-mute">
        {p.meta && <span>{p.meta.toLowerCase()}</span>}
        {p.count !== undefined && Number(p.count) > 0 && (
          <span>
            {p.count} item{p.count === 1 ? "" : "s"}
          </span>
        )}
      </div>
    </>
  );

  if (p.onPress) {
    return (
      <button
        type="button"
        onClick={p.onPress}
        aria-expanded={p.selected}
        className={clsx(shell, "cursor-pointer text-left")}
      >
        {inner}
      </button>
    );
  }

  const href = p.href;
  if (!href) {
    throw new Error("BoxCard requires `href` unless `onPress` is provided.");
  }

  return (
    <Link href={href} className={shell}>
      {inner}
    </Link>
  );
}
