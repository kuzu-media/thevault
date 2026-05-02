"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import clsx from "clsx";
import { triageDropItem, softDeleteItem } from "@/lib/actions";
import { EditableText } from "@/components/editable-text";
import { FlagIcon, type FlagKind } from "@/components/flag-icons";
import type { Box, Destination, EnergyType } from "@/lib/categories";
import type { Item } from "@/lib/types";

// Drop row, three bands:
//   1. Title
//   2. Destination — TILL vs DRAWER, the load-bearing call (active card is
//        a solid colored panel; inactive is barely there)
//   3. Metadata + actions inline (Box, Min, energy/flags, Dismiss, Send)
//
// A 4-px coloured left edge tracks destination so a glance reads where it
// will land.

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
        dest === "DRAWER" ? "border-rust/40" : "border-teal/40",
      )}
    >
      {/* 4px coloured left edge — the at-a-glance signal */}
      <div
        className={clsx(
          "absolute left-0 top-0 bottom-0 w-[4px] transition-colors",
          dest === "DRAWER" ? "bg-rust" : "bg-teal",
        )}
      />

      {/* 1 — Title */}
      <div className="flex items-center gap-3 pl-6 pr-5 pt-3.5">
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

      {/* 2 — Destination as two large cards. Active card is a saturated
              panel; inactive is barely there so the choice reads at a glance. */}
      <div className="grid grid-cols-2 gap-2 pl-6 pr-5 pt-3">
        <DestCard
          active={dest === "TILL"}
          onClick={() => setDest("TILL")}
          label="TILL"
          hint="Pull when the energy fits"
          accent="teal"
        />
        <DestCard
          active={dest === "DRAWER"}
          onClick={() => setDest("DRAWER")}
          label="DRAWER"
          hint="I have to do this"
          accent="rust"
        />
      </div>

      {/* 3 — Metadata and actions on a single row. Borders fence the actions
              from the metadata so Send still reads as the punctuation. */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-vault-line/40 bg-vault-bg/20 pl-6 pr-5 py-2.5">
        <Field label="Box">
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
        </Field>

        <Field label="Min">
          <input
            type="number"
            min={0}
            max={1440}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            placeholder="—"
            className="w-16 rounded-sm border border-vault-line bg-vault-bg/60 px-2 py-1 text-right font-mono text-[11px] text-ink outline-none focus:border-brass"
          />
        </Field>

        {dest === "TILL" && (
          <Field label="Energy">
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
          </Field>
        )}

        {dest === "DRAWER" && (
          <Field label="Flags">
            <div className="flex items-center gap-1.5">
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
            </div>
          </Field>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={dismiss}
            disabled={pending}
            className="rounded-sm border border-vault-line px-3 py-1.5 font-mono text-[10px] tracking-wider text-ink-mute transition hover:border-rust hover:text-rust"
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
    </div>
  );
}

function DestCard({
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
        // Active: saturated panel + brass-bright label
        active && accent === "teal" && "border-teal bg-teal text-vault-bg",
        active && accent === "rust" && "border-rust bg-rust text-vault-bg",
        // Inactive: ghost outline, lots of muting
        !active &&
          "border-vault-line/50 bg-transparent text-ink-mute/60 hover:border-brass/40 hover:text-ink-mute",
      )}
    >
      <span
        className={clsx(
          "font-mono text-[11px] tracking-[0.24em]",
          active && "text-vault-bg/90",
        )}
      >
        {label}
      </span>
      <span
        className={clsx(
          "mt-0.5 text-[12px]",
          active ? "text-vault-bg/80" : "text-ink-mute/60",
        )}
      >
        {hint}
      </span>
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-1.5">
      <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-mute">
        {label}
      </span>
      {children}
    </label>
  );
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
