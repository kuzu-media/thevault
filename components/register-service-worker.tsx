"use client";

import { useEffect } from "react";

/** Registers /sw.js so Chrome can offer “Install page as app” (PWA criteria). */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const { hostname, protocol } = window.location;
    const ok =
      protocol === "https:" ||
      hostname === "localhost" ||
      hostname === "127.0.0.1";
    if (!ok) return;

    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // Non-fatal; user can still use the site in the tab.
    });
  }, []);

  return null;
}
