"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import clsx from "clsx";
import { triageDropItem, softDeleteItem, updateItem } from "@/lib/actions";
import { EditableText } from "@/components/editable-text";
import type { Energy, Item } from "@/lib/types";

// Default destinations Tracy can send a Drop item to. Counter stations first
// (Drawer for admin obligations, Till for energy picks), then deposit boxes.
const DESTINATIONS: { value: string; label: string }[] = [
  { value: "DRAWER", label: "The Drawer" },
  { value: "TILL", label: "The Till" },
  { value: "PCS_IDEAS", label: "PCS Ideas" },
  { value: "SWB_PLAN", label: "SWB Plan" },
  { value: "PCS_DELEGATION", label: "PCS Delegation" },
  { value: "READ_RESEARCH", label: "Read & Research" },
  { value: "HEALTH_IDEAS", label: "Health Ideas" },
  { value: "MISC_IDEAS", label: "Misc Ideas" },
  { value: "RON", label: "Ron's Queue" },
];

const ENERGIES: { value: Energy; label: string }[] = [
  { value: "CREATIVE", label: "Creative" },
  { value: "PROB-SOLV", label: "Problem-solve" },
  { value: "LEISURE", label: "Leisure" },
  { value: "PHYSICAL", label: "Physical" },
  { value: "ADMIN", label: "Admin" },
];

export function DropTriageRow({ item }: { item: Item }) {
  const [box, setBox] = useState<string>("DRAWER");
  const [minutes, setMinutes] = useState<string>(
    item.minutes != null ? String(item.minutes) : "",
  );
  const [urgent, setUrgent] = useState(item.urgent);
  const [must, setMust] = useState(item.must);
  const [energy, setEnergy] = useState<Energy | "">(item.energy ?? "");
  const [pending, startTransition] = useTransition();

  function send() {
    startTransition(async () => {
      try {
        await triageDropItem(item.id, {
          box,
          minutes: minutes ? Number(minutes) : null,
          urgent,
          must,
          energy: energy || null,
        });
        toast.success(
          `Sent to ${DESTINATIONS.find((d) => d.value === box)?.label ?? box}.`,
        );
      } catch (e: any) {
        toast.error(e?.message ?? "Couldn't send.");
      }
    });
  }

  function dismiss() {
    if (!confirm("Dismiss this thought?")) return;
    startTransition(async () => {
      await softDeleteItem(item.id);
      toast.success("Dismissed.");
    });
  }

  return (
    <div className="space-y-2 rounded-sm border border-vault-line bg-vault-panel/40 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] tracking-wider text-brass">
          ▸ NEW
        </span>
        <EditableText
          itemId={item.id}
          field="title"
          initial={item.title}
          className="flex-1 serif-h text-[15px]"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FieldLabel>Send to</FieldLabel>
        <select
          value={box}
          onChange={(e) => setBox(e.target.value)}
          className="rounded-sm border border-vault-line bg-vault-bg/60 px-2 py-1 font-mono text-[11px] text-brass outline-none focus:border-brass"
        >
          {DESTINATIONS.map((d) => (
            <option key={d.value} value={d.value} className="bg-vault-bg">
              {d.label}
            </option>
          ))}
        </select>

        <FieldDivider />

        <FieldLabel>Min</FieldLabel>
        <input
          type="number"
          min={0}
          max={1440}
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          placeholder="—"
          className="w-16 rounded-sm border border-vault-line bg-vault-bg/60 px-2 py-1 text-right font-mono text-[11px] text-ink outline-none focus:border-brass"
        />

        <FieldDivider />

        <Toggle
          on={urgent}
          onChange={setUrgent}
          glyph="●"
          label="urgent"
          color="text-rust"
        />
        <Toggle
          on={must}
          onChange={setMust}
          glyph="■"
          label="must"
          color="text-brass"
        />

        <FieldDivider />

        <FieldLabel>Energy</FieldLabel>
        <select
          value={energy}
          onChange={(e) => setEnergy((e.target.value as Energy) || "")}
          className="rounded-sm border border-vault-line bg-vault-bg/60 px-2 py-1 font-mono text-[11px] text-brass outline-none focus:border-brass"
        >
          <option value="" className="bg-vault-bg">
            —
          </option>
          {ENERGIES.map((e) => (
            <option key={e.value} value={e.value} className="bg-vault-bg">
              {e.label}
            </option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={dismiss}
            disabled={pending}
            className="rounded-sm border border-vault-line px-3 py-1 font-mono text-[10px] tracking-wider text-ink-mute hover:border-rust hover:text-rust"
          >
            DISMISS
          </button>
          <button
            onClick={send}
            disabled={pending}
            className="brass-button px-4 py-1.5 font-mono text-[10px] tracking-[0.2em] text-[#2a1c08] disabled:opacity-50"
          >
            {pending ? "..." : "→ SEND"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-mute">
      {children}
    </span>
  );
}

function FieldDivider() {
  return <span className="text-ink-mute/30">·</span>;
}

function Toggle({
  on,
  onChange,
  glyph,
  label,
  color,
}: {
  on: boolean;
  onChange: (next: boolean) => void;
  glyph: string;
  label: string;
  color: string;
}) {
  return (
    <button
      onClick={() => onChange(!on)}
      title={label}
      className={clsx(
        "flex h-6 w-6 items-center justify-center rounded-sm border leading-none transition",
        on
          ? `border-current ${color}`
          : "border-vault-line text-ink-mute/40 hover:border-brass/40 hover:text-ink-mute",
      )}
    >
      {on ? glyph : "·"}
    </button>
  );
}

void updateItem; // keep import for potential row-level edits without resending
