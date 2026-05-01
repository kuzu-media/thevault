"use client";
import { useEffect, useState } from "react";
import clsx from "clsx";

// Big ceremonial vault dial. Renders in three phases:
//   open      — rings still, lock open, pin at 12 o'clock
//   sealing   — pin sweeps clockwise, ring rotates, lock closes
//   sealed    — locked, settled
// Pass `animate` true to play the sealing transition once on mount.

type Phase = "open" | "sealing" | "sealed";

export function VaultDial({
  sealed,
  animate = false,
  size = 440,
}: {
  sealed: boolean;
  animate?: boolean;
  size?: number;
}) {
  const [phase, setPhase] = useState<Phase>(
    sealed ? (animate ? "sealing" : "sealed") : "open",
  );

  useEffect(() => {
    if (!animate) return;
    if (sealed) {
      setPhase("sealing");
      const t = setTimeout(() => setPhase("sealed"), 1400);
      return () => clearTimeout(t);
    } else {
      setPhase("sealing"); // unsealing reverses
      const t = setTimeout(() => setPhase("open"), 900);
      return () => clearTimeout(t);
    }
  }, [animate, sealed]);

  const isSealed = phase === "sealed" || (phase === "sealing" && sealed);
  const ringTurn =
    phase === "open" ? 0 : phase === "sealing" && sealed ? 90 : sealed ? 90 : 0;

  return (
    <div
      className="relative select-none"
      style={{ width: size, height: size }}
      aria-label={sealed ? "Vault sealed" : "Vault open"}
    >
      {/* Outer ring (rotates) */}
      <svg
        viewBox="0 0 440 440"
        width={size}
        height={size}
        className="absolute inset-0 transition-transform duration-[900ms] ease-[cubic-bezier(0.65,0,0.35,1)]"
        style={{ transform: `rotate(${ringTurn}deg)` }}
      >
        <defs>
          <radialGradient id="dial-face" cx="50%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#1f2228" />
            <stop offset="100%" stopColor="#0c0e11" />
          </radialGradient>
          <radialGradient id="brass-glow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="rgba(224,185,99,0.25)" />
            <stop offset="100%" stopColor="rgba(224,185,99,0)" />
          </radialGradient>
        </defs>

        {/* Soft brass glow behind the dial */}
        <circle cx="220" cy="220" r="200" fill="url(#brass-glow)" opacity="0.6" />

        {/* Dial face */}
        <circle
          cx="220"
          cy="220"
          r="180"
          fill="url(#dial-face)"
          stroke="#3a322b"
          strokeWidth="1.5"
        />

        {/* Outer track */}
        <circle
          cx="220"
          cy="220"
          r="170"
          fill="none"
          stroke="#B5853A"
          strokeWidth="1"
          opacity="0.6"
        />
        {/* Inner track */}
        <circle
          cx="220"
          cy="220"
          r="115"
          fill="none"
          stroke="#B5853A"
          strokeWidth="0.8"
          strokeDasharray="2 4"
          opacity="0.5"
        />

        {/* Tick marks every 30° */}
        {Array.from({ length: 12 }, (_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          const r1 = 165;
          const r2 = 155;
          const x1 = 220 + Math.sin(angle) * r1;
          const y1 = 220 - Math.cos(angle) * r1;
          const x2 = 220 + Math.sin(angle) * r2;
          const y2 = 220 - Math.cos(angle) * r2;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#B5853A"
              strokeWidth={i % 3 === 0 ? "1.5" : "0.7"}
              opacity={i % 3 === 0 ? "0.7" : "0.3"}
            />
          );
        })}

        {/* Pin pointer (rotates with ring) */}
        <line
          x1="220"
          y1="60"
          x2="220"
          y2="100"
          stroke="#E0B963"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>

      {/* Bolts (don't rotate) — top, right, bottom, left */}
      {[0, 90, 180, 270].map((deg) => (
        <div
          key={deg}
          className="absolute left-1/2 top-1/2 h-[18px] w-[36px] -translate-x-1/2 rounded-sm border border-[#3a322b] bg-[#1a1d22]"
          style={{
            transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-${size / 2 - 6}px)`,
          }}
        />
      ))}

      {/* Center plate with lock */}
      <div
        className={clsx(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-[140px] w-[140px] flex-col items-center justify-center gap-2 rounded-full border border-brass/30 bg-[#0c0e11] transition-shadow duration-700",
          isSealed && "shadow-[0_0_60px_rgba(224,185,99,0.15)]",
        )}
      >
        <LockIcon
          sealed={isSealed}
          animating={phase === "sealing"}
        />
        <span
          className={clsx(
            "font-mono text-[10px] tracking-[0.32em] transition-opacity duration-500",
            isSealed ? "text-brass opacity-100" : "text-ink-mute opacity-60",
          )}
        >
          {isSealed ? "LOCKED" : "OPEN"}
        </span>
      </div>
    </div>
  );
}

function LockIcon({
  sealed,
  animating,
}: {
  sealed: boolean;
  animating: boolean;
}) {
  return (
    <svg
      width="32"
      height="36"
      viewBox="0 0 32 36"
      fill="none"
      className={clsx(
        "transition-transform duration-700",
        animating && "scale-105",
      )}
    >
      {/* Shackle — slides up when open */}
      <path
        d={
          sealed
            ? "M 7 16 V 11 a 9 9 0 0 1 18 0 V 16"
            : "M 7 13 V 8 a 9 9 0 0 1 18 0 V 13"
        }
        stroke="#E0B963"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="transition-all duration-700 ease-[cubic-bezier(0.65,0,0.35,1)]"
      />
      {/* Body */}
      <rect
        x="3"
        y="16"
        width="26"
        height="18"
        rx="2"
        stroke="#E0B963"
        strokeWidth="2.5"
        fill="rgba(224,185,99,0.08)"
      />
      {/* Keyhole */}
      <circle cx="16" cy="23" r="2" fill="#E0B963" />
      <rect x="15" y="24" width="2" height="5" fill="#E0B963" />
    </svg>
  );
}
