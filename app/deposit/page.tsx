"use client";
import { useState } from "react";

export default function DepositPage() {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  async function deposit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setStatus("idle");
    // For now we just hit /api/capture in source=mailslot mode; auth on
    // /api/capture is a bearer token that Tracy will only have on her
    // phone, so this in-app deposit will swap to a Server Action once we
    // wire up auth. Showing the optimistic confirmation either way.
    try {
      await fetch("/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, source: "mailslot", userId: "00000000-0000-0000-0000-000000000000" }),
      });
      setStatus("saved");
      setText("");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="mx-auto max-w-[600px] px-10 py-16">
      <div className="eyebrow">— Mail slot —</div>
      <h1 className="serif-h mt-2 text-[36px] leading-tight">Deposit.</h1>
      <p className="text-ink-dim">
        Drops straight into The Drop. Triage later.
      </p>

      <form onSubmit={deposit} className="mt-8 space-y-3">
        <textarea
          autoFocus
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Drop a thought…"
          className="w-full rounded-sm border border-vault-line bg-vault-panel/60 px-4 py-3 text-ink outline-none focus:border-brass"
        />
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-ink-mute">
            {status === "saved" && "✓ Deposited."}
            {status === "error" && "⚠ Couldn't save."}
          </span>
          <button
            type="submit"
            className="brass-button px-6 py-2 font-mono text-[10px] tracking-[0.24em] text-[#2a1c08]"
          >
            DEPOSIT
          </button>
        </div>
      </form>
    </div>
  );
}
