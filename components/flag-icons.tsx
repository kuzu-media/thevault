// Distinct icons for the two flags Tracy toggles per item.
//
// Urgent  →  ⚡ lightning bolt — time-pressure, rust color
// Must-do →  ★ star          — anchor / required, brass color
//
// Each icon has a `filled` variant (when the flag is ON) and an outline
// variant (when OFF) so the meaning is legible in both states.

export function UrgentIcon({
  filled,
  size = 14,
}: {
  filled: boolean;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M9.5 1 L 3 9.2 L 7.5 9.2 L 6.5 15 L 13 6.8 L 8.5 6.8 Z" />
    </svg>
  );
}

export function MustIcon({
  filled,
  size = 14,
}: {
  filled: boolean;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M8 1.5 L 9.85 6.05 L 14.7 6.45 L 11 9.65 L 12.15 14.4 L 8 11.85 L 3.85 14.4 L 5 9.65 L 1.3 6.45 L 6.15 6.05 Z" />
    </svg>
  );
}

export type FlagKind = "urgent" | "must";

export function FlagIcon({
  kind,
  filled,
  size,
}: {
  kind: FlagKind;
  filled: boolean;
  size?: number;
}) {
  return kind === "urgent" ? (
    <UrgentIcon filled={filled} size={size} />
  ) : (
    <MustIcon filled={filled} size={size} />
  );
}
