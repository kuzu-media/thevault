"use client";
import { useEffect, useState } from "react";

// Brief brass-glow pulse over the page when arriving with ?just=unsealed.
// Mirrors the close-animation on the sealed page: a quick "the door is open"
// flourish before the Docket settles.

export function UnsealGlow() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("just") !== "unsealed") return;
    setShow(true);
    // Strip the query param so a refresh doesn't re-trigger.
    const url = new URL(window.location.href);
    url.searchParams.delete("just");
    window.history.replaceState({}, "", url.toString());
    const t = setTimeout(() => setShow(false), 1400);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-50 animate-[unseal_1400ms_ease-out_forwards]">
      <style>{`
        @keyframes unseal {
          0% { opacity: 0; }
          15% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(224,185,99,0.20),_transparent_60%)]" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <svg width="220" height="220" viewBox="0 0 220 220" fill="none">
          <circle
            cx="110"
            cy="110"
            r="100"
            stroke="#E0B963"
            strokeWidth="1.5"
            opacity="0.6"
            style={{ animation: "unseal-ring 1400ms ease-out forwards" }}
          />
          <style>{`
            @keyframes unseal-ring {
              0%   { r: 30; opacity: 0.8; }
              100% { r: 200; opacity: 0; }
            }
          `}</style>
        </svg>
      </div>
    </div>
  );
}
