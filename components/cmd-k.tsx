"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { depositText } from "@/lib/actions";
import { useShortcut } from "@/lib/shortcuts";
import { Kbd } from "./kbd";

export function CmdK() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useShortcut("mod+k", () => setOpen((v) => !v), {
    label: "Open mail slot",
    group: "Capture",
    options: { allowInInputs: true },
  });
  useShortcut("escape", () => setOpen(false), {
    label: "",
    options: { enabled: open, allowInInputs: true },
  });

  // `n` from anywhere also opens the mail slot.
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("vault:open-cmdk", onOpen);
    return () => window.removeEventListener("vault:open-cmdk", onOpen);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  function submit() {
    const t = text.trim();
    if (!t) return;
    startTransition(async () => {
      try {
        await depositText(t, "cmdk");
        toast.success("Deposited.");
        setText("");
        setOpen(false);
      } catch {
        toast.error("Couldn't save.");
      }
    });
  }

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-vault-bg/80 backdrop-blur"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="mt-32 w-full max-w-[600px] rounded-sm border border-brass/40 bg-vault-panel/95 p-5 shadow-2xl">
        <div className="eyebrow">— Mail slot · ⌘K —</div>
        <textarea
          ref={inputRef}
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Drop a thought…"
          className="mt-3 w-full bg-transparent text-ink outline-none placeholder:text-ink-mute serif-h text-[18px]"
        />
        <div className="mt-3 flex items-center justify-between font-mono text-[10px] tracking-wider text-ink-mute">
          <span className="flex items-center gap-2">
            {pending ? (
              "saving…"
            ) : (
              <>
                <Kbd keys="enter" size="xs" /> deposit
                <span className="opacity-50">·</span>
                <Kbd keys="escape" size="xs" /> close
              </>
            )}
          </span>
          <button
            onClick={submit}
            disabled={pending}
            className="brass-button px-4 py-1.5 text-[10px] tracking-[0.24em] text-[#2a1c08] disabled:opacity-50"
          >
            DEPOSIT
          </button>
        </div>
      </div>
    </div>
  );
}
