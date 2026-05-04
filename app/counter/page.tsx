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

      <details className="group mt-6">
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

function CounterRow({
  item,
  boxes,
}: {
  item: Item;
  boxes: { key: string; label: string }[];
}) {
  const stressor = item.urgent && item.must;
  return (
    <div
      className={clsx(
        "group relative overflow-hidden rounded-sm border bg-vault-panel/30 px-4 py-3 transition hover:border-brass/40 hover:bg-vault-panel/50",
        stressor
          ? "border-rust/30"
          : item.must || item.urgent
            ? "border-brass/30"
            : "border-vault-line/60",
      )}
    >
      {/* Left edge — rust if stressor, brass if flagged, none otherwise.
          4px wide so a glance down the list reads the heaviest items. */}
      {(stressor || item.urgent || item.must) && (
        <div
          className={clsx(
            "absolute left-0 top-0 bottom-0 w-[4px]",
            stressor ? "bg-rust" : "bg-brass",
          )}
        />
      )}

      {/* Line 1 — title + minutes + today toggle, the things she scans */}
      <div className="flex items-center gap-3">
        <EditableText
          itemId={item.id}
          field="title"
          initial={item.title}
          className="min-w-0 flex-1 vault-task-title"
          placeholder="(no title)"
        />
        <span className="inline-flex shrink-0 items-baseline gap-1 rounded-sm border border-vault-line/60 bg-vault-bg/40 px-2 py-0.5 transition focus-within:border-brass focus-within:bg-vault-bg/80">
          <EditableText
            itemId={item.id}
            field="minutes"
            initial={item.minutes}
            className="w-12 bg-transparent text-right font-mono text-[12px]"
            numeric
            placeholder="—"
          />
          <span className="font-mono text-[10px] text-ink-mute/70">min</span>
        </span>
        <TodayToggle
          itemId={item.id}
          on={(item.todayOrder ?? null) !== null}
          size="sm"
        />
      </div>

      {/* Line 2 — flags + box, the things she sets */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
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
        <span className="text-ink-mute/30">·</span>
        <AreaPill itemId={item.id} initial={item.area} options={boxes} />
      </div>
    </div>
  );
}
