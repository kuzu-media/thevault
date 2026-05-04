import Link from "next/link";
import clsx from "clsx";
import { getItemsByBox } from "@/lib/data";
import { getBoxes } from "@/lib/categories";
import { EditableText, EditableFlag } from "@/components/editable-text";
import { AreaPill } from "@/components/area-pill";
import { NewItemRow } from "@/components/new-item-row";
import { SortableList } from "@/components/sortable-list";
import { TodayToggle } from "@/components/today-toggle";
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

function coerceFilter(raw: string | undefined): Filter {
  const r = raw ?? "all";
  return VALID_FILTERS.includes(r as Filter) ? (r as Filter) : "all";
}

function applyFilter(items: Item[], f: Filter, area?: string): Item[] {
  switch (f) {
    case "stress":
      return items.filter((i) => i.urgent && i.must);
    case "urgent":
      return items.filter((i) => i.urgent);
    case "must":
      return items.filter((i) => i.must);
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

export default async function CounterPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; area?: string }>;
}) {
  const sp = await searchParams;
  const active = coerceFilter(sp.filter);
  const area = sp.area;
  const [all, boxes] = await Promise.all([
    getItemsByBox("COUNTER"),
    getBoxes(),
  ]);
  const filtered = applyFilter(all, active, area);
  const areas = boxes
    .filter((b) => all.some((it) => it.area === b.key))
    .map((b) => b.key);

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 md:px-10">
      <h1 className="serif-h text-[28px] leading-tight md:text-[36px]">
        The Counter
      </h1>
      <p className="mt-1 text-[13px] text-ink-dim">
        Obligations — what has to happen. Filter by stress, urgency, or area.
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
          <NewItemRow box="COUNTER" placeholder="+ New admin item" />
        </div>
        <SortableList
          items={filtered.map((it) => ({
            id: it.id,
            content: (
              <CounterRow
                item={it}
                boxes={boxes.map((b) => ({ key: b.key, label: b.label }))}
              />
            ),
          }))}
        />
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
  const onToday = (item.todayOrder ?? null) !== null;
  return (
    <div
      className={clsx(
        "flex min-w-0 items-center gap-3 rounded-sm border bg-vault-panel/40 px-3 py-2 transition",
        onToday
          ? "border-brass/40"
          : stressor
            ? "border-rust/30"
            : item.must || item.urgent
              ? "border-brass/30"
              : "border-vault-line/60",
      )}
    >
      {stressor || item.urgent || item.must ? (
        <div
          className={clsx(
            "w-1 shrink-0 self-stretch rounded-sm",
            stressor ? "bg-rust" : "bg-brass",
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
          className="text-rust"
        />
        <EditableFlag
          itemId={item.id}
          field="must"
          initial={item.must}
          kind="must"
          className="text-brass"
        />
      </div>
      <TodayToggle itemId={item.id} on={onToday} size="sm" />
    </div>
  );
}
