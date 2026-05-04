"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { markPreferTodayOverDropLanding } from "@/lib/vault-nav-client";

const ITEMS = [
  { href: "/", label: "Today", hint: "g d", match: (p: string) => p === "/" || p.startsWith("/build") },
  { href: "/drop", label: "Drop", hint: "g r", match: (p: string) => p.startsWith("/drop") },
  { href: "/atm", label: "ATM", hint: "g a", match: (p: string) => p.startsWith("/atm") },
  { href: "/counter", label: "Counter", hint: "g c", match: (p: string) => p.startsWith("/counter") },
  { href: "/vault", label: "Boxes", hint: "g v", match: (p: string) => p.startsWith("/vault") },
  {
    href: "/records",
    label: "RECORDS",
    hint: "g e",
    match: (p: string) => p === "/records" || p.startsWith("/records/"),
  },
  { href: "/settings", label: "Settings", hint: "g s", match: (p: string) => p.startsWith("/settings") },
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
            title={`Press ${item.hint}`}
            className={clsx(
              "group shrink-0 whitespace-nowrap pb-3 -mb-3 transition",
              active
                ? "border-b-2 border-brass text-brass-bright"
                : "text-ink-mute hover:text-ink",
            )}
            onClick={
              item.href === "/"
                ? () => markPreferTodayOverDropLanding()
                : undefined
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
