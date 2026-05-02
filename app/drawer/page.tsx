import Link from "next/link";
import clsx from "clsx";
import { getItemsByBox } from "@/lib/data";
import { getBoxes } from "@/lib/categories";
import { EditableText, EditableFlag } from "@/components/editable-text";
import { AreaPill } from "@/components/area-pill";
import { NewItemRow } from "@/components/new-item-row";
import { SortableList } from "@/components/sortable-list";
import type { Item } from "@/lib/types";

type Filter =
  | "all"
  | "stress"
  | "urgent"
  | "must"
  | "today"
  | "quick"
  | "byarea";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "stress", label: "Stress" },
  { key: "urgent", label: "Urgent" },
  { key: "must", label: "Must" },
  { key: "today", label: "Today's" },
  { key: "quick", label: "Quick (5–15)" },
];

function applyFilter(items: Item[], f: Filter, area?: string): Item[] {
  switch (f) {
    case "stress":
      return items.filter((i) => i.urgent && i.must);
    case "urgent":
      return items.filter((i) => i.urgent);
    case "must":
      return items.filter((i) => i.must);
    case "today":
      return items.filter((i) => (i.todayOrder ?? null) !== null);
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

export default async function DrawerPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; area?: string }>;
}) {
  const sp = await searchParams;
  const active = (sp.filter ?? "all") as Filter;
  const area = sp.area;
  const [all, boxes] = await Promise.all([
    getItemsByBox("DRAWER"),
    getBoxes(),
  ]);
  const filtered = applyFilter(all, active, area);
  // Any box can hold Drawer items (when paired with an admin-energy), so
  // the area pill shows the full box list.
  const areas = boxes.map((b) => b.key);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 md:px-10">
      <h1 className="serif-h text-[28px] leading-tight md:text-[36px]">
        The Drawer
      </h1>

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
              href={f.key === "all" ? "/drawer" : `/drawer?filter=${f.key}`}
              className={clsx(
                "rounded-sm border px-3 py-1 font-mono text-[10px] tracking-wider",
                active === f.key
                  ? "border-brass bg-brass/10 text-brass"
                  : "border-vault-line text-ink-mute hover:border-brass/40 hover:text-brass",
              )}
            >
              {f.label}
            </Link>
          ))}
          {areas.map((a) => (
            <Link
              key={a}
              href={`/drawer?filter=byarea&area=${encodeURIComponent(a)}`}
              className={clsx(
                "rounded-sm border px-3 py-1 font-mono text-[10px] tracking-wider",
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
        <SortableList
          items={filtered.map((it) => ({
            id: it.id,
            content: (
              <div className="flex flex-wrap items-center gap-3 rounded-sm border border-vault-line/60 bg-vault-panel/40 px-4 py-2.5 hover:border-brass/30">
                <EditableFlag
                  itemId={it.id}
                  field="urgent"
                  initial={it.urgent}
                  kind="urgent"
                  className="text-rust"
                />
                <EditableFlag
                  itemId={it.id}
                  field="must"
                  initial={it.must}
                  kind="must"
                  className="text-brass"
                />
                <AreaPill
                  itemId={it.id}
                  initial={it.area}
                  options={boxes}
                />
                <EditableText
                  itemId={it.id}
                  field="title"
                  initial={it.title}
                  className="min-w-0 flex-1"
                />
                <span className="flex items-baseline gap-1 font-mono text-[11px] text-ink-mute">
                  <EditableText
                    itemId={it.id}
                    field="minutes"
                    initial={it.minutes}
                    className="w-12 text-right"
                    numeric
                    placeholder="—"
                  />
                  <span>min</span>
                </span>
              </div>
            ),
          }))}
        />
        <div className="mt-2">
          <NewItemRow box="DRAWER" placeholder="+ New admin item" />
        </div>
      </div>
    </div>
  );
}
