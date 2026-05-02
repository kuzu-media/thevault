"use client";

// Catches browser-side unhandled promise rejections and forwards them to
// the dev console with full detail (the Next.js dev log only prints the
// rejection's `reason.toString()`, which is "undefined" for a lot of
// React/Server-Action errors). Also calls preventDefault so the red
// devtools overlay doesn't flap on every transient failure.

import { useEffect } from "react";
import { toast } from "sonner";

export function UnhandledRejectionGuard() {
  useEffect(() => {
    function onRejection(e: PromiseRejectionEvent) {
      const reason = e.reason as { message?: string } | null | undefined;
      // Bare `undefined` / `null` rejections are framework noise — Next.js
      // prefetcher does this when an RSC fetch fails and the browser tab
      // has a stale client bundle (common after a dev-server restart). Not
      // an app bug, so swallow silently in production-like fashion.
      const isFrameworkNoise = reason == null || reason === false;
      if (!isFrameworkNoise) {
        // eslint-disable-next-line no-console
        console.error("[vault] unhandled promise rejection", {
          reason: e.reason,
          message: reason?.message,
          stack: (reason as { stack?: string } | null)?.stack,
          type: typeof e.reason,
        });
        if (process.env.NODE_ENV !== "production") {
          toast.error(
            reason?.message
              ? `Background error: ${reason.message}`
              : "A background promise rejected (see console).",
          );
        }
      }
      e.preventDefault();
    }
    window.addEventListener("unhandledrejection", onRejection);
    return () => window.removeEventListener("unhandledrejection", onRejection);
  }, []);
  return null;
}
