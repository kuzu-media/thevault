"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import clsx from "clsx";
import { triageDropItem, softDeleteItem } from "@/lib/actions";
import { EditableText } from "@/components/editable-text";
import { FlagIcon, type FlagKind } from "@/components/flag-icons";
import {
  destinationForEnergy,
  type Box,
  type Destination,
  type EnergyType,
} from "@/lib/categories";
import type { Item } from "@/lib/types";

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
  const [minutes, setMinutes] = useState<string>(
    item.minutes != null ? String(item.minutes) : "",
  );
  const [urgent, setUrgent] = useState(item.urgent);
  const [must, setMust] = useState(item.must);
  const [energy, setEnergy] = useState<string>(item.energy ?? "");
  const [pending, startTransition] = useTransition();

  const dest: Destination | null = energy
    ? destinationForEnergy(energies, energy)
    : null;
  const adminLike =
    !!energy && energies.find((e) => e.key === energy)?.dest === "DRAWER";

  function send() {
    if (!boxKey) {
      toast.error("Pick a box first.");
      return;
    }
    if (!energy) {
      toast.error("Pick an energy — that decides Till vs Drawer.");
      return;
    }
    startTransition(async () => {
      try {
        await triageDropItem(item.id, {
          box_key: boxKey,
          energy,
          minutes: minutes ? Number(minutes) : null,
          urgent,
          must,
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
        {dest && (
          <span
            className={clsx(
              "rounded-sm border px-2 py-0.5 font-mono text-[9px] tracking-[0.18em]",
              dest === "DRAWER"
                ? "border-rust/40 text-rust"
                : "border-teal/60 text-teal",
            )}
          >
            → {dest}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
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

        <FieldDivider />

        <FieldLabel>Energy</FieldLabel>
        <select
          value={energy}
          onChange={(e) => setEnergy(e.target.value)}
          className={clsx(
            "rounded-sm border bg-vault-bg/60 px-2 py-1 font-mono text-[11px] outline-none focus:border-brass",
            adminLike
              ? "border-rust/40 text-rust"
              : "border-vault-line text-brass",
          )}
        >
          <option value="" className="bg-vault-bg">
            — pick —
          </option>
          {energies.map((e) => (
            <option key={e.key} value={e.key} className="bg-vault-bg">
              {e.label}
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
          kind="urgent"
          label="Urgent"
          color="text-rust"
        />
        <Toggle
          on={must}
          onChange={setMust}
          kind="must"
          label="Must"
          color="text-brass"
        />

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
            disabled={pending || !boxKey || !energy}
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
