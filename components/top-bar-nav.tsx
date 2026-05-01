"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const ITEMS = [
  { href: "/", label: "Today", match: (p: string) => p === "/" || p.startsWith("/build") },
  { href: "/drop", label: "Drop", match: (p: string) => p.startsWith("/drop") },
  { href: "/till", label: "Till", match: (p: string) => p.startsWith("/till") },
  { href: "/drawer", label: "Drawer", match: (p: string) => p.startsWith("/drawer") },
  { href: "/vault", label: "Vault", match: (p: string) => p.startsWith("/vault") || p.startsWith("/records") },
  { href: "/settings", label: "Settings", match: (p: string) => p.startsWith("/settings") },
];

export function TopBarNav() {
  const path = usePathname();
  return (
    <nav className="flex min-w-0 flex-1 items-center justify-center gap-3 overflow-x-auto eyebrow md:gap-7">
      {ITEMS.map((item) => {
        const active = item.match(path);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "shrink-0 whitespace-nowrap pb-3 -mb-3 transition",
              active
                ? "border-b-2 border-brass text-brass-bright"
                : "text-ink-mute hover:text-ink",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
