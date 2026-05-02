"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import clsx from "clsx";
import { triageDropItem, softDeleteItem } from "@/lib/actions";
import { EditableText } from "@/components/editable-text";
import { FlagIcon, type FlagKind } from "@/components/flag-icons";
import type {
  Box,
  Destination,
  EnergyType,
} from "@/lib/categories";
import type { Item } from "@/lib/types";

// Drop row layout, top to bottom:
//   1. Title (read it first)
//   2. Destination — TILL or DRAWER, two big tabs, the load-bearing call
//   3. Metadata — box + minutes + (energy | urgent/must) depending on dest
//   4. Actions — Dismiss / Send
//
// A coloured left-edge tracks the destination (teal for Till, rust for
// Drawer) so a glance tells Tracy what each row will become.

export function DropTriageRow({
  item,
  boxes,
  energies,
}: {
  item: Item;
  boxes: Box[];
  energies: EnergyType[];
}) {
  const [boxKey, setBoxKey] = useState<string>(
    item.area ?? item.category ?? "",
  );
  const [dest, setDest] = useState<Destination>(
    item.urgent || item.must ? "DRAWER" : "TILL",
  );
  const [minutes, setMinutes] = useState<string>(
    item.minutes != null ? String(item.minutes) : "",
  );
  const [energy, setEnergy] = useState<string>(item.energy ?? "");
  const [urgent, setUrgent] = useState(item.urgent);
  const [must, setMust] = useState(item.must);
  const [pending, startTransition] = useTransition();

  function send() {
    if (!boxKey) {
      toast.error("Pick a box first.");
      return;
    }
    startTransition(async () => {
      try {
        await triageDropItem(item.id, {
          box_key: boxKey,
          dest,
          minutes: minutes ? Number(minutes) : null,
          energy: dest === "TILL" ? energy || null : null,
          urgent: dest === "DRAWER" ? urgent : false,
          must: dest === "DRAWER" ? must : false,
        });
        const label = boxes.find((b) => b.key === boxKey)?.label ?? boxKey;
        toast.success(
          dest === "DRAWER"
            ? `Sent to The Drawer · ${label}.`
            : `Sent to The Till · ${label}.`,
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
    <div
      className={clsx(
        "relative overflow-hidden rounded-sm border bg-vault-panel/40 transition",
        dest === "DRAWER" ? "border-rust/30" : "border-teal/30",
      )}
    >
      {/* Coloured left edge — fast visual signal of where this lands */}
      <div
        className={clsx(
          "absolute left-0 top-0 bottom-0 w-[3px] transition-colors",
          dest === "DRAWER" ? "bg-rust/70" : "bg-teal/70",
        )}
      />

      {/* 1 — Title */}
      <div className="flex items-center gap-3 px-5 pt-4">
        <span className="font-mono text-[10px] tracking-wider text-brass">
          ▸ NEW
        </span>
        <EditableText
          itemId={item.id}
          field="title"
          initial={item.title}
          className="flex-1 serif-h text-[16px]"
        />
      </div>

      {/* 2 — Destination, the load-bearing call */}
      <div className="px-5 pt-3">
        <DestChoice dest={dest} onChange={setDest} />
      </div>

      {/* 3 — Metadata for the chosen destination */}
      <div className="flex flex-wrap items-center gap-2 px-5 pt-3">
        <FieldLabel>Box</FieldLabel>
        <select
          value={boxKey}
          onChange={(e) => setBoxKey(e.target.value)}
          className="rounded-sm border border-vault-line bg-vault-bg/60 px-2 py-1 font-mono text-[11px] text-brass outline-none focus:border-brass"
        >
          <option value="" className="bg-vault-bg">
            — pick —
          </option>
          {boxes.map((b) => (
            <option key={b.key} value={b.key} className="bg-vault-bg">
              {b.label}
            </option>
          ))}
        </select>

        <Sep />

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

        {dest === "TILL" && (
          <>
            <Sep />
            <FieldLabel>Energy</FieldLabel>
            <select
              value={energy}
              onChange={(e) => setEnergy(e.target.value)}
              className="rounded-sm border border-vault-line bg-vault-bg/60 px-2 py-1 font-mono text-[11px] text-brass outline-none focus:border-brass"
            >
              <option value="" className="bg-vault-bg">
                — optional —
              </option>
              {energies.map((e) => (
                <option key={e.key} value={e.key} className="bg-vault-bg">
                  {e.label}
                </option>
              ))}
            </select>
          </>
        )}

        {dest === "DRAWER" && (
          <>
            <Sep />
            <FlagToggle
              on={urgent}
              onChange={setUrgent}
              kind="urgent"
              label="Urgent"
              color="text-rust"
            />
            <FlagToggle
              on={must}
              onChange={setMust}
              kind="must"
              label="Must"
              color="text-brass"
            />
          </>
        )}
      </div>

      {/* 4 — Actions */}
      <div className="mt-3 flex items-center justify-end gap-2 border-t border-vault-line/40 bg-vault-bg/30 px-5 py-2.5">
        <button
          onClick={dismiss}
          disabled={pending}
          className="rounded-sm border border-vault-line px-3 py-1 font-mono text-[10px] tracking-wider text-ink-mute hover:border-rust hover:text-rust"
        >
          DISMISS
        </button>
        <button
          onClick={send}
          disabled={pending || !boxKey}
          className="brass-button px-4 py-1.5 font-mono text-[10px] tracking-[0.2em] text-[#2a1c08] disabled:opacity-50"
        >
          {pending ? "..." : "→ SEND"}
        </button>
      </div>
    </div>
  );
}

function DestChoice({
  dest,
  onChange,
}: {
  dest: Destination;
  onChange: (next: Destination) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <DestButton
        active={dest === "TILL"}
        onClick={() => onChange("TILL")}
        label="TILL"
        hint="Pull when the energy fits"
        accent="teal"
      />
      <DestButton
        active={dest === "DRAWER"}
        onClick={() => onChange("DRAWER")}
        label="DRAWER"
        hint="I have to do this"
        accent="rust"
      />
    </div>
  );
}

function DestButton({
  active,
  onClick,
  label,
  hint,
  accent,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint: string;
  accent: "teal" | "rust";
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex flex-col items-start rounded-sm border px-3 py-2 text-left transition",
        active && accent === "teal" && "border-teal bg-teal/10",
        active && accent === "rust" && "border-rust bg-rust/10",
        !active &&
          "border-vault-line bg-vault-bg/40 text-ink-mute hover:border-brass/40",
      )}
    >
      <span
        className={clsx(
          "font-mono text-[10px] tracking-[0.24em]",
          active && accent === "teal" && "text-teal",
          active && accent === "rust" && "text-rust",
          !active && "text-ink-mute",
        )}
      >
        {label}
      </span>
      <span
        className={clsx(
          "mt-0.5 text-[12px]",
          active ? "text-ink" : "text-ink-mute/70",
        )}
      >
        {hint}
      </span>
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-mute">
      {children}
    </span>
  );
}

function Sep() {
  return <span className="text-ink-mute/30">·</span>;
}

function FlagToggle({
  on,
  onChange,
  kind,
  label,
  color,
}: {
  on: boolean;
  onChange: (next: boolean) => void;
  kind: FlagKind;
  label: string;
  color: string;
}) {
  return (
    <button
      onClick={() => onChange(!on)}
      title={label}
      className={clsx(
        "flex h-7 w-7 items-center justify-center rounded-sm border leading-none transition",
        on
          ? `border-current ${color}`
          : "border-vault-line text-ink-mute/50 hover:border-brass/40 hover:text-ink-mute",
      )}
    >
      <FlagIcon kind={kind} filled={on} />
    </button>
  );
}
