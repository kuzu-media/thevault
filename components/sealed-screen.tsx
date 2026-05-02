"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { toast } from "sonner";
import { VaultDial } from "./vault-dial";
import { depositText } from "@/lib/actions";
import { markPreferTodayOverDropLanding } from "@/lib/vault-nav-client";

export function SealedScreen({
  sealed,
  itemCount,
  animate,
  unsealAction,
  sealAction,
}: {
  sealed: boolean;
  itemCount: number;
  animate: boolean;
  unsealAction: () => Promise<void>;
  sealAction: () => Promise<void>;
}) {
  const router = useRouter();
  const [time, setTime] = useState(() => formatNow());
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const [sealMessageVisible, setSealMessageVisible] = useState(!animate);

  useEffect(() => {
    const id = setInterval(() => setTime(formatNow()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Reveal the message after the dial finishes its sweep.
  useEffect(() => {
    if (!animate) {
      setSealMessageVisible(true);
      return;
    }
    const t = setTimeout(() => setSealMessageVisible(true), 1100);
    return () => clearTimeout(t);
  }, [animate]);

  function deposit(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    startTransition(async () => {
      try {
        await depositText(t, "sealed");
        toast.success("Deposited.");
        setText("");
        router.refresh();
      } catch {
        toast.error("Couldn't save.");
      }
    });
  }

  function unseal() {
    startTransition(async () => {
      await unsealAction();
      router.push("/?just=unsealed");
    });
  }

  function seal() {
    startTransition(async () => {
      await sealAction();
      router.push("/sealed?just=sealed");
    });
  }

  return (
    <div className="relative min-h-[100vh] overflow-hidden bg-[#0c0e11]">
      {/* Subtle vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(224,185,99,0.06),_transparent_70%)]" />

      {/* Minimal sealed-mode header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <Link href="/" className="flex items-center gap-2.5">
          <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="9.5" stroke="#B5853A" strokeWidth="1.4" />
            <circle cx="11" cy="11" r="4" stroke="#B5853A" strokeWidth="1.4" />
          </svg>
          <span className="serif-h text-[20px] text-ink/70">The Vault</span>
        </Link>
        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 font-mono text-[11px] tracking-[0.24em] text-ink-mute">
          <ClosedLockTiny />
          <span>{sealed ? "SEALED" : "OPEN"}</span>
          <span>·</span>
          <span>{time}</span>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#3a322b] bg-vault-panel/60 text-brass-bright/70">
          T
        </div>
      </header>

      {/* Center stage */}
      <div className="relative z-10 mx-auto flex max-w-[640px] flex-col items-center px-4 pb-16 pt-8 md:pt-12">
        <VaultDial sealed={sealed} animate={animate} size={420} />

        <div
          className={clsx(
            "mt-10 flex flex-col items-center text-center transition-opacity duration-700",
            sealMessageVisible ? "opacity-100" : "opacity-0",
          )}
        >
          <span className="eyebrow text-ink-mute">
            {sealed ? "— The Vault is closed —" : "— The Vault is open —"}
          </span>
          <h1 className="serif-h mt-3 text-[32px] leading-[1.15] text-ink md:text-[44px]">
            {sealed ? (
              <>
                Everything&rsquo;s safe.
                <br />
                You can stop carrying it.
              </>
            ) : (
              <>Ready to close up?</>
            )}
          </h1>
          <p className="mt-5 max-w-[460px] text-ink-dim">
            {sealed
              ? `${itemCount} items in storage. You don’t need to do anything until tomorrow.`
              : `${itemCount} items in storage. Sealing closes today's surfaces. The deposit slot still works.`}
          </p>

          {/* Deposit slot — works while sealed */}
          {sealed && (
            <form
              onSubmit={deposit}
              className="mt-8 flex w-full items-center gap-2 rounded-sm border border-vault-line bg-vault-panel/40 px-4 py-2"
            >
              <MailSlotIcon />
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Deposit slot still works while sealed…"
                className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-mute"
              />
              <span className="hidden font-mono text-[10px] tracking-[0.2em] text-ink-mute md:inline">
                ⌘K · DEPOSIT
              </span>
            </form>
          )}

          {/* Actions */}
          <div className="mt-8 flex items-center gap-3">
            {sealed ? (
              <button
                onClick={unseal}
                disabled={pending}
                className="brass-button flex items-center gap-2 px-6 py-3 font-mono text-[10px] tracking-[0.24em] text-[#2a1c08] disabled:opacity-50"
              >
                <span aria-hidden>↑</span>
                OPEN VAULT NOW
              </button>
            ) : (
              <>
                <button
                  onClick={seal}
                  disabled={pending}
                  className="brass-button flex items-center gap-2 px-6 py-3 font-mono text-[10px] tracking-[0.24em] text-[#2a1c08] disabled:opacity-50"
                >
                  <span aria-hidden>↓</span>
                  SEAL THE VAULT
                </button>
                <Link
                  href="/"
                  className="rounded-sm border border-vault-line px-5 py-3 font-mono text-[10px] tracking-[0.24em] text-ink-mute hover:border-brass/40 hover:text-brass"
                  onClick={() => markPreferTodayOverDropLanding()}
                >
                  CANCEL
                </Link>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function formatNow() {
  const d = new Date();
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function ClosedLockTiny() {
  return (
    <svg width="11" height="13" viewBox="0 0 14 16" fill="none">
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

function MailSlotIcon() {
  return (
    <svg
      width="14"
      height="12"
      viewBox="0 0 14 12"
      fill="none"
      className="shrink-0 text-brass/60"
    >
      <rect
        x="0.75"
        y="0.75"
        width="12.5"
        height="10.5"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M1 3l6 4 6-4"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
      />
    </svg>
  );
}
