import Link from "next/link";
import clsx from "clsx";

export type BoxCardProps = {
  number?: string;
  href: string;
  title: string;
  meta?: string;
  count?: number | string;
  edited?: string;
  indicator?: string;
  accent?: "brass" | "rust" | "teal";
};

const ACCENT: Record<NonNullable<BoxCardProps["accent"]>, string> = {
  brass: "before:bg-brass",
  rust: "before:bg-rust",
  teal: "before:bg-teal",
};

export function BoxCard(p: BoxCardProps) {
  return (
    <Link
      href={p.href}
      className={clsx(
        "group relative flex h-[200px] w-[260px] flex-col justify-between rounded-sm border border-vault-line bg-vault-panel/60 p-5 transition hover:border-brass/60",
        "before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px]",
        ACCENT[p.accent ?? "brass"],
      )}
    >
      <div className="flex items-start justify-between">
        {p.number ? <span className="plaque">{p.number}</span> : <span />}
        {p.indicator && (
          <span className="rounded-sm border border-brass/40 px-2 py-0.5 font-mono text-[10px] tracking-wider text-brass">
            {p.indicator}
          </span>
        )}
      </div>
      <h3 className="serif-h text-[26px] leading-tight text-ink">{p.title}</h3>
      <div className="flex items-end justify-between">
        <div>
          {p.meta && <div className="eyebrow">{p.meta}</div>}
          {p.count !== undefined && (
            <div className="serif-h text-[22px] leading-tight text-ink">
              {p.count}
            </div>
          )}
        </div>
        {p.edited && (
          <div className="font-mono text-[10px] text-ink-mute">{p.edited}</div>
        )}
      </div>
    </Link>
  );
}
