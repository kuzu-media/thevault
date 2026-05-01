"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { setSealed } from "@/lib/actions";

// Lock-icon button. Click sets the seal state and navigates to /sealed with
// `?just=sealed` so the ceremonial dial plays the close animation.

export function SealToggle({ sealed }: { sealed: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      title={sealed ? "Unseal vault" : "Seal vault"}
      onClick={() => {
        const next = !sealed;
        startTransition(async () => {
          await setSealed(next);
          if (next) router.push("/sealed?just=sealed");
          else router.push("/?just=unsealed");
        });
      }}
      className={clsx(
        "flex h-8 w-8 items-center justify-center rounded-sm border transition",
        sealed
          ? "border-brass bg-brass/10 text-brass"
          : "border-[#3a322b] text-ink-mute hover:border-brass/40 hover:text-brass",
        pending && "opacity-60",
      )}
    >
      {sealed ? <ClosedLock /> : <OpenLock />}
    </button>
  );
}

function ClosedLock() {
  return (
    <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
      <path
        d="M3 7V4.5C3 2.567 4.567 1 6.5 1S10 2.567 10 4.5V7"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <rect
        x="1.5"
        y="7"
        width="11"
        height="8"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function OpenLock() {
  return (
    <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
      <path
        d="M10 7V4.5C10 2.567 8.433 1 6.5 1S3 2.567 3 4.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <rect
        x="1.5"
        y="7"
        width="11"
        height="8"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}
