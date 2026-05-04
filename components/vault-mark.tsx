// Shared vault-dial mark used by every icon size (apple-icon, icon0,
// icon1). Keeping the JSX in one place so a tweak propagates to the
// favicon, the iOS home-screen, and the PWA install icon.

import type React from "react";

type Variant = "rounded" | "edge";

export function VaultMark({ variant }: { variant: Variant }): React.ReactElement {
  // Apple masks its own rounded corners on the home screen icon, so the
  // edge variant skips the rounded background and bleeds the dial out
  // to the edges. The rounded variant is used for the manifest icons,
  // which platforms display as a square.
  return (
    <svg viewBox="0 0 256 256" width="100%" height="100%">
      <defs>
        <radialGradient id="vault-plate" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#faf8f4" />
          <stop offset="100%" stopColor="#e4dcd0" />
        </radialGradient>
        <radialGradient id="vault-hub" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#e0b963" />
          <stop offset="100%" stopColor="#b5853a" />
        </radialGradient>
      </defs>

      {variant === "rounded" && (
        <rect width="256" height="256" rx="52" fill="#f3eee5" />
      )}

      <circle
        cx="128"
        cy="128"
        r={variant === "edge" ? 110 : 98}
        fill="url(#vault-plate)"
      />
      <circle
        cx="128"
        cy="128"
        r={variant === "edge" ? 110 : 98}
        fill="none"
        stroke="#b5853a"
        strokeWidth="6"
      />
      <circle
        cx="128"
        cy="128"
        r={variant === "edge" ? 103 : 92}
        fill="none"
        stroke="#6b4612"
        strokeWidth="1"
      />

      {/* Major ticks at 12, 3, 6, 9 */}
      <g stroke="#b5853a" strokeLinecap="round" strokeWidth="4" fill="none">
        <line
          x1="128"
          y1={variant === "edge" ? 28 : 36}
          x2="128"
          y2={variant === "edge" ? 44 : 50}
        />
        <line
          x1={variant === "edge" ? 228 : 220}
          y1="128"
          x2={variant === "edge" ? 212 : 206}
          y2="128"
        />
        <line
          x1="128"
          y1={variant === "edge" ? 228 : 220}
          x2="128"
          y2={variant === "edge" ? 212 : 206}
        />
        <line
          x1={variant === "edge" ? 28 : 36}
          y1="128"
          x2={variant === "edge" ? 44 : 50}
          y2="128"
        />
      </g>

      {/* Minor ticks */}
      <g stroke="#b5853a" strokeLinecap="round" strokeWidth="2.4" fill="none">
        <line x1="174" y1="48" x2="170" y2="58" />
        <line x1="208" y1="82" x2="198" y2="86" />
        <line x1="208" y1="174" x2="198" y2="170" />
        <line x1="174" y1="208" x2="170" y2="198" />
        <line x1="82" y1="208" x2="86" y2="198" />
        <line x1="48" y1="174" x2="58" y2="170" />
        <line x1="48" y1="82" x2="58" y2="86" />
        <line x1="82" y1="48" x2="86" y2="58" />
      </g>

      {/* Inner concentric ring */}
      <circle
        cx="128"
        cy="128"
        r={variant === "edge" ? 68 : 62}
        fill="none"
        stroke="#b5853a"
        strokeWidth="2.5"
      />

      {/* Indicator pin at 12 o'clock */}
      <line
        x1="128"
        y1={variant === "edge" ? 56 : 62}
        x2="128"
        y2={variant === "edge" ? 92 : 92}
        stroke="#e0b963"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="128" cy="92" r="4.5" fill="#e0b963" />

      {/* Center hub */}
      <circle
        cx="128"
        cy="128"
        r={variant === "edge" ? 22 : 20}
        fill="url(#vault-hub)"
        stroke="#6b4612"
        strokeWidth="1"
      />
      <circle cx="128" cy="128" r="6" fill="#262018" />
    </svg>
  );
}
