"use client";
import { usePathname } from "next/navigation";

// Client wrapper that hides the regular top bar on routes that have their
// own ceremonial chrome (currently /sealed).
export function TopBarShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (path?.startsWith("/sealed")) return null;
  return <>{children}</>;
}
