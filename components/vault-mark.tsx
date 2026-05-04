// Shared mark for apple-icon, icon0, icon1 — metallic gold tile + black V.

import type React from "react";

type Variant = "rounded" | "edge";

export function VaultMark({ variant }: { variant: Variant }): React.ReactElement {
  // "rounded": extra corner radius for manifest / maskable tiles.
  // "edge": full-bleed square; iOS applies its own mask on the home screen.
  const rx = variant === "rounded" ? 52 : 0;

  return (
    <svg viewBox="0 0 256 256" width="100%" height="100%">
      <defs>
        <linearGradient
          id="vault-gold-base"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#f2e6a8" />
          <stop offset="22%" stopColor="#d4af37" />
          <stop offset="55%" stopColor="#b8892a" />
          <stop offset="100%" stopColor="#7a5a18" />
        </linearGradient>
        <radialGradient id="vault-gold-hot" cx="32%" cy="28%" r="70%">
          <stop offset="0%" stopColor="rgba(255, 250, 220, 0.55)" />
          <stop offset="45%" stopColor="rgba(255, 220, 140, 0.12)" />
          <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
        </radialGradient>
        <linearGradient id="vault-gold-cool" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(0, 0, 0, 0.18)" />
          <stop offset="55%" stopColor="rgba(0, 0, 0, 0)" />
          <stop offset="100%" stopColor="rgba(255, 255, 255, 0.08)" />
        </linearGradient>
      </defs>

      <rect width="256" height="256" rx={rx} fill="url(#vault-gold-base)" />
      <rect width="256" height="256" rx={rx} fill="url(#vault-gold-hot)" />
      <rect width="256" height="256" rx={rx} fill="url(#vault-gold-cool)" />
      {variant === "rounded" ? (
        <rect
          width="256"
          height="256"
          rx={rx}
          fill="none"
          stroke="#4a3a12"
          strokeWidth="2"
          opacity={0.55}
        />
      ) : null}

      {/* Bold black V — safe inside ~80% for maskable */}
      <path
        fill="#0d0d0d"
        d="M 128 198 L 68 58 L 102 58 L 128 150 L 154 58 L 188 58 Z"
      />
    </svg>
  );
}
