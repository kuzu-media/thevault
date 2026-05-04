import Link from "next/link";
import clsx from "clsx";
import { getItemsByBox } from "@/lib/data";
import { getBoxes } from "@/lib/categories";
import { EditableText, EditableFlag } from "@/components/editable-text";
import { AreaPill } from "@/components/area-pill";
import { NewItemRow } from "@/components/new-item-row";
import {
  CounterSectionedLists,
  type CounterSectionGroup,
} from "@/components/counter-sectioned-lists";
import type { SortableItem } from "@/components/sortable-list";
import { TodayToggle } from "@/components/today-toggle";
import { DeleteItemButton } from "@/components/delete-item-button";
import type { Item } from "@/lib/types";

type Filter =
  | "all"
  | "stress"
  | "urgent"
  | "must"
  | "quick"
  | "byarea";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "stress", label: "Stress" },
  { key: "urgent", label: "Urgent" },
  { key: "must", label: "Must" },
  { key: "quick", label: "Quick (5–15)" },
];

const VALID_FILTERS: readonly Filter[] = [
  "all",
  "stress",
  "urgent",
  "must",
  "quick",
  "byarea",
];

/** Next may pass a single string or repeated keys as `string[]`. */
function firstQuery(
  v: string | string[] | undefined,
): string | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

function coerceFilter(raw: string | undefined): Filter {
  const r = raw ?? "all";
  return VALID_FILTERS.includes(r as Filter) ? (r as Filter) : "all";
}

/**
 * Filter semantics match the row chrome on the Counter:
 *   Stress  → both flags (rust “stressor” strip)
 *   Urgent  → urgent only, not must (amber strip)
 *   Must    → must only, not urgent (sky strip)
 * Items with both flags appear only under Stress (and All), not under Urgent or Must.
 */
function applyFilter(items: Item[], f: Filter, area?: string): Item[] {
  switch (f) {
    case "stress":
      return items.filter((i) => i.urgent && i.must);
    case "urgent":
      return items.filter((i) => i.urgent && !i.must);
    case "must":
      return items.filter((i) => i.must && !i.urgent);
    case "quick":
      return items.filter(
        (i) => (i.minutes ?? 0) >= 5 && (i.minutes ?? 0) <= 15,
      );
    case "byarea":
      return area ? items.filter((i) => i.area === area) : items;
    case "all":
    default:
      return items;
  }
}

/** Preserve `filtered` iteration order within each triage bucket. */
function partitionCounterItemsPreservingOrder(items: Item[]) {
  const stress: Item[] = [];
  const urgent: Item[] = [];
  const must: Item[] = [];
  const plain: Item[] = [];
  for (const it of items) {
    if (it.urgent && it.must) stress.push(it);
    else if (it.urgent && !it.must) urgent.push(it);
    else if (it.must && !it.urgent) must.push(it);
    else plain.push(it);
  }
  return { stress, urgent, must, plain };
}

export default async function CounterPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; area?: string }>;
}) {
  const sp = await searchParams;
  const active = coerceFilter(firstQuery(sp.filter));
  const area = firstQuery(sp.area);
  const [all, boxes] = await Promise.all([
    getItemsByBox("COUNTER"),
    getBoxes(),
  ]);
  const filtered = applyFilter(all, active, area);
  const areas = boxes
    .filter((b) => all.some((it) => it.area === b.key))
    .map((b) => b.key);

  const boxOpts = boxes.map((b) => ({ key: b.key, label: b.label }));
  const { stress, urgent, must, plain } =
    partitionCounterItemsPreservingOrder(filtered);

  const counterGroups: CounterSectionGroup[] = [];
  if (stress.length > 0) {
    counterGroups.push({
      key: "stress",
      title: "Stressors",
      items: stress.map(
        (it): SortableItem => ({
          id: it.id,
          content: <CounterRow item={it} boxes={boxOpts} />,
        }),
      ),
    });
  }
  if (urgent.length > 0) {
    counterGroups.push({
      key: "urgent",
      title: "Other Urgent",
      items: urgent.map(
        (it): SortableItem => ({
          id: it.id,
          content: <CounterRow item={it} boxes={boxOpts} />,
        }),
      ),
    });
  }
  if (must.length > 0) {
    counterGroups.push({
      key: "must",
      title: "Other Must-Do",
      items: must.map(
        (it): SortableItem => ({
          id: it.id,
          content: <CounterRow item={it} boxes={boxOpts} />,
        }),
      ),
    });
  }
  if (plain.length > 0) {
    counterGroups.push({
      key: "plain",
      title: "Other",
      items: plain.map(
        (it): SortableItem => ({
          id: it.id,
          content: <CounterRow item={it} boxes={boxOpts} />,
        }),
      ),
    });
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 md:px-10">
      <h1 className="serif-h text-[28px] leading-tight md:text-[36px]">
        The Counter
      </h1>
      <p className="mt-1 text-[13px] text-ink-dim">
        Obligations — what has to happen. Filter by stress lane, urgent-only,
        must-only, minutes, or area.
      </p>

      <details className="group mt-6" open>
        <summary className="cursor-pointer list-none font-mono text-[10px] tracking-[0.24em] text-ink-mute hover:text-brass">
          <span className="inline-block transition-transform group-open:rotate-90">
            ›
          </span>{" "}
          {active === "all" ? "FILTER" : `FILTER · ${active.toUpperCase()}`}
        </summary>
        <div className="mt-3 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Link
              key={f.key}
              href={f.key === "all" ? "/counter" : `/counter?filter=${f.key}`}
              className={clsx(
                "rounded-sm border px-3 py-1 font-mono text-[10px] tracking-wider transition",
                active === f.key
                  ? "border-brass bg-brass/10 text-brass"
                  : "border-vault-line text-ink-mute hover:border-brass/40 hover:text-brass",
              )}
            >
              {f.label}
            </Link>
          ))}
          {areas.length > 0 && (
            <span className="px-2 self-center text-ink-mute/40">·</span>
          )}
          {areas.map((a) => (
            <Link
              key={a}
              href={`/counter?filter=byarea&area=${encodeURIComponent(a)}`}
              className={clsx(
                "rounded-sm border px-3 py-1 font-mono text-[10px] tracking-wider transition",
                active === "byarea" && area === a
                  ? "border-brass bg-brass/10 text-brass"
                  : "border-vault-line text-ink-mute hover:border-brass/40 hover:text-brass",
              )}
            >
              {a}
            </Link>
          ))}
        </div>
      </details>

      <div className="mt-6">
        <div className="mb-3">
          <NewItemRow box="COUNTER" placeholder="+ New counter item" />
        </div>
        {filtered.length === 0 ? (
          <p className="mt-4 text-[13px] text-ink-mute">
            {active === "all"
              ? "Nothing on the Counter yet."
              : "No items match this filter."}
          </p>
        ) : (
          <CounterSectionedLists
            listKey={`${active}:${area ?? ""}`}
            syncSignature={counterGroups
              .map(
                (g) =>
                  `${g.key}:${g.items.map((i) => i.id).join(",")}`,
              )
              .join("|")}
            groups={counterGroups}
          />
        )}
      </div>
    </div>
  );
}

/** Matches ATM row `AreaPill` chip sizing. */
const COUNTER_AREA_PILL_CLASS =
  "!max-h-7 max-w-[5.75rem] shrink-0 !py-0.5 !pl-1.5 !pr-1 !text-[9px] !leading-tight border-brass/40 bg-vault-bg/20";

function CounterRow({
  item,
  boxes,
}: {
  item: Item;
  boxes: { key: string; label: string }[];
}) {
  const stressor = item.urgent && item.must;
  const mustOnly = item.must && !item.urgent;
  const urgentOnly = item.urgent && !item.must;
  const onToday = (item.todayOrder ?? null) !== null;
  return (
    <div
      className={clsx(
        "flex min-w-0 items-center gap-3 rounded-sm border bg-vault-panel/40 px-3 py-2 transition",
        onToday
          ? "border-brass/40"
          : stressor
            ? "border-rust/30"
            : mustOnly
              ? "border-sky-600/35"
              : urgentOnly
                ? "border-amber-500/45"
                : "border-vault-line/60",
      )}
    >
      {stressor || item.urgent || item.must ? (
        <div
          className={clsx(
            "w-1 shrink-0 self-stretch rounded-sm",
            stressor
              ? "bg-rust"
              : mustOnly
                ? "bg-sky-600"
                : "bg-amber-500",
          )}
          aria-hidden
        />
      ) : null}
      <AreaPill
        itemId={item.id}
        initial={item.area}
        options={boxes}
        className={COUNTER_AREA_PILL_CLASS}
      />
      <EditableText
        itemId={item.id}
        field="title"
        initial={item.title}
        className={clsx(
          "vault-task-title min-w-0 flex-1 truncate",
          onToday ? "text-ink" : "text-ink-mute",
        )}
        placeholder="(no title)"
      />
      <span className="flex w-16 shrink-0 items-baseline justify-end gap-0.5 whitespace-nowrap font-mono text-[11px] text-ink-mute">
        <EditableText
          itemId={item.id}
          field="minutes"
          initial={item.minutes}
          className="w-10 bg-transparent px-0 text-right text-[11px]"
          numeric
          placeholder="—"
        />
        <span>min</span>
      </span>
      <div className="flex shrink-0 items-center gap-1">
        <EditableFlag
          itemId={item.id}
          field="urgent"
          initial={item.urgent}
          kind="urgent"
          className="text-amber-700"
        />
        <EditableFlag
          itemId={item.id}
          field="must"
          initial={item.must}
          kind="must"
          className="text-sky-600"
        />
      </div>
      <TodayToggle itemId={item.id} on={onToday} size="sm" />
      <DeleteItemButton itemId={item.id} />
    </div>
  );
}
