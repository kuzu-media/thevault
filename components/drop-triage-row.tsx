"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import clsx from "clsx";
import { triageDropItem, softDeleteItem } from "@/lib/actions";
import { EditableText } from "@/components/editable-text";
import { FlagIcon, type FlagKind } from "@/components/flag-icons";
import type { Box, Destination, EnergyType } from "@/lib/categories";
import type { Item } from "@/lib/types";

// Drop row, two compact lines:
//
//   [edge]  [TILL|DRAWER]  Title (editable)              [Box ▼]
//           ⏱ 30m   energy / urgent / must               Dismiss · Send
//
// 4-px coloured left edge tracks the destination so a glance reads where
// each row will land. The toggle is the only place Tracy decides; the rest
// is metadata.

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
        "group relative overflow-hidden rounded-sm border bg-vault-panel/40 transition hover:bg-vault-panel/60",
        dest === "DRAWER" ? "border-rust/30" : "border-teal/30",
      )}
    >
      {/* Coloured left edge — the at-a-glance signal */}
      <div
        className={clsx(
          "absolute left-0 top-0 bottom-0 w-[4px]",
          dest === "DRAWER" ? "bg-rust" : "bg-teal",
        )}
      />

      {/* Line 1 — destination + title + box (the primary path) */}
      <div className="flex items-center gap-3 pl-6 pr-4 py-2.5">
        <DestSegment dest={dest} onChange={setDest} />
        <EditableText
          itemId={item.id}
          field="title"
          initial={item.title}
          className="min-w-0 flex-1 serif-h text-[15px]"
          placeholder="(no title)"
        />
        <select
          value={boxKey}
          onChange={(e) => setBoxKey(e.target.value)}
          className={clsx(
            "shrink-0 rounded-sm border px-2 py-1 font-mono text-[11px] outline-none transition focus:border-brass",
            boxKey
              ? "border-brass/50 text-brass"
              : "border-vault-line text-ink-mute",
          )}
        >
          <option value="" className="bg-vault-bg">
            — pick box —
          </option>
          {boxes.map((b) => (
            <option key={b.key} value={b.key} className="bg-vault-bg">
              {b.label}
            </option>
          ))}
        </select>
      </div>

      {/* Line 2 — metadata + actions, anchored right */}
      <div className="flex flex-wrap items-center gap-3 border-t border-vault-line/30 bg-vault-bg/20 pl-6 pr-3 py-1.5">
        <Minutes value={minutes} onChange={setMinutes} />

        {dest === "TILL" && (
          <select
            value={energy}
            onChange={(e) => setEnergy(e.target.value)}
            className={clsx(
              "shrink-0 rounded-sm border px-2 py-0.5 font-mono text-[10px] tracking-wider outline-none transition focus:border-brass",
              energy
                ? "border-brass/40 text-brass"
                : "border-vault-line text-ink-mute/70",
            )}
          >
            <option value="" className="bg-vault-bg">
              + energy
            </option>
            {energies.map((e) => (
              <option key={e.key} value={e.key} className="bg-vault-bg">
                {e.label}
              </option>
            ))}
          </select>
        )}

        {dest === "DRAWER" && (
          <div className="flex items-center gap-1">
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
        )}

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={dismiss}
            disabled={pending}
            title="Dismiss"
            className="rounded-sm px-2 py-1 font-mono text-[10px] tracking-wider text-ink-mute/60 transition hover:bg-rust/10 hover:text-rust"
          >
            DISMISS
          </button>
          <button
            onClick={send}
            disabled={pending || !boxKey}
            className="brass-button px-3 py-1 font-mono text-[10px] tracking-[0.18em] text-[#2a1c08] disabled:opacity-40"
          >
            {pending ? "..." : "→ SEND"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Compact two-button segmented control. Active half is filled with its
// destination color so it reads from across the screen.
function DestSegment({
  dest,
  onChange,
}: {
  dest: Destination;
  onChange: (next: Destination) => void;
}) {
  return (
    <div className="flex shrink-0 overflow-hidden rounded-sm border border-vault-line/60 bg-vault-bg/40">
      <SegmentButton
        active={dest === "TILL"}
        onClick={() => onChange("TILL")}
        accent="teal"
      >
        TILL
      </SegmentButton>
      <SegmentButton
        active={dest === "DRAWER"}
        onClick={() => onChange("DRAWER")}
        accent="rust"
      >
        DRAWER
      </SegmentButton>
    </div>
  );
}

function SegmentButton({
  active,
  onClick,
  accent,
  children,
}: {
  active: boolean;
  onClick: () => void;
  accent: "teal" | "rust";
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "px-2.5 py-1 font-mono text-[10px] tracking-[0.18em] transition",
        active && accent === "teal" && "bg-teal text-vault-bg",
        active && accent === "rust" && "bg-rust text-vault-bg",
        !active && "text-ink-mute/70 hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

// Minutes input with inline ⏱ glyph + unit suffix.
function Minutes({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <span
      className={clsx(
        "inline-flex shrink-0 items-baseline gap-1 rounded-sm border bg-vault-bg/40 px-1.5 py-0.5 transition focus-within:border-brass",
        value ? "border-brass/40" : "border-vault-line",
      )}
    >
      <span
        className={clsx(
          "font-mono text-[10px]",
          value ? "text-brass/70" : "text-ink-mute/60",
        )}
      >
        ⏱
      </span>
      <input
        type="number"
        min={0}
        max={1440}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="—"
        className="w-10 bg-transparent text-right font-mono text-[11px] text-ink outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden"
      />
      <span className="font-mono text-[9px] text-ink-mute/60">min</span>
    </span>
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
        "flex h-6 w-6 items-center justify-center rounded-sm border leading-none transition",
        on
          ? `border-current ${color}`
          : "border-vault-line text-ink-mute/40 hover:border-brass/40 hover:text-ink-mute",
      )}
    >
      <FlagIcon kind={kind} filled={on} size={12} />
    </button>
  );
}
