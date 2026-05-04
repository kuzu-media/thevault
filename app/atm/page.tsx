import Link from "next/link";
import clsx from "clsx";
import { getItemsByBox } from "@/lib/data";
import { getBoxes } from "@/lib/categories";
import { EditableText } from "@/components/editable-text";
import { AreaPill } from "@/components/area-pill";
import { NewItemRow } from "@/components/new-item-row";
import { AtmPickButton } from "@/components/atm-pick-button";
import { DeleteItemButton } from "@/components/delete-item-button";
import type { Item } from "@/lib/types";

// Convert a BOX_KEY → slug for the vault drilldown URL.
function slugify(key: string): string {
  return key.toLowerCase().replace(/_/g, "-").replace(/\//g, "-");
}

type AtmFilter =
  | "all"
  | "picked"
  | "unpicked"
  | "quick"
  | "bycategory";

const FILTERS: { key: AtmFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "picked", label: "Picked for today" },
  { key: "unpicked", label: "Not picked" },
  { key: "quick", label: "Quick (5–15)" },
];

const VALID_FILTERS: readonly AtmFilter[] = [
  "all",
  "picked",
  "unpicked",
  "quick",
  "bycategory",
];

const UNCATEGORIZED = "__none__";

function coerceFilter(raw: string | undefined): AtmFilter {
  const r = raw ?? "all";
  return VALID_FILTERS.includes(r as AtmFilter) ? (r as AtmFilter) : "all";
}

function decodeCategoryParam(raw: string | undefined): string | undefined {
  if (raw === undefined) return undefined;
  return raw === UNCATEGORIZED ? "" : raw;
}

function applyAtmFilter(
  items: Item[],
  f: AtmFilter,
  opts: { category?: string },
): Item[] {
  const { category } = opts;
  switch (f) {
    case "picked":
      return items.filter((i) => (i.todayOrder ?? null) !== null);
    case "unpicked":
      return items.filter((i) => (i.todayOrder ?? null) === null);
    case "quick":
      return items.filter(
        (i) => (i.minutes ?? 0) >= 5 && (i.minutes ?? 0) <= 15,
      );
    case "bycategory": {
      if (category === undefined) return items;
      const want = category;
      return items.filter((i) => (i.category ?? "") === want);
    }
    case "all":
    default:
      return items;
  }
}

function filterSummary(f: AtmFilter, category?: string): string {
  if (f === "all") return "FILTER";
  if (f === "bycategory") {
    const c = category === "" ? "UNCATEGORIZED" : (category ?? "").toUpperCase();
    return `FILTER · ${c}`;
  }
  return `FILTER · ${f.replace(/-/g, " ").toUpperCase()}`;
}

export default async function AtmPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; category?: string }>;
}) {
  const sp = await searchParams;
  let active = coerceFilter(sp.filter);
  let categoryDecoded = decodeCategoryParam(sp.category);
  if (active === "bycategory" && sp.category === undefined) {
    active = "all";
    categoryDecoded = undefined;
  }

  const [list, boxes] = await Promise.all([
    getItemsByBox("ATM"),
    getBoxes(),
  ]);
  const filtered = applyAtmFilter(list, active, {
    category: categoryDecoded,
  });

  const labelByKey = new Map(boxes.map((b) => [b.key, b.label]));

  const categoryKeys = [
    ...new Set(list.map((it) => it.category ?? "")),
  ].sort((a, b) => {
    if (a === "" && b !== "") return 1;
    if (a !== "" && b === "") return -1;
    return a.localeCompare(b);
  });

  const groups = new Map<string, Item[]>();
  for (const it of filtered) {
    const key = it.category ?? "";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(it);
  }

  function atmHref(f: AtmFilter, extra?: { category?: string }) {
    if (f === "all") return "/atm";
    const p = new URLSearchParams();
    p.set("filter", f);
    if (extra?.category !== undefined) {
      p.set(
        "category",
        extra.category === "" ? UNCATEGORIZED : extra.category,
      );
    }
    return `/atm?${p.toString()}`;
  }

  return (
    <div className="mx-auto max-w-[960px] px-4 py-8 md:px-10">
      <h1 className="serif-h text-[28px] leading-tight md:text-[36px]">
        The ATM
      </h1>
      <p className="mt-1 text-[13px] text-ink-dim">
        Pull out whatever you&apos;d like to work on today. Nothing here is
        an obligation. Filter by pick state, duration, or category.
      </p>

      <details className="group mt-6" open>
        <summary className="cursor-pointer list-none font-mono text-[10px] tracking-[0.24em] text-ink-mute hover:text-brass">
          <span className="inline-block transition-transform group-open:rotate-90">
            ›
          </span>{" "}
          {filterSummary(active, categoryDecoded)}
        </summary>
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <Link
                key={f.key}
                href={atmHref(f.key)}
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
          </div>

          {categoryKeys.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categoryKeys.map((cat) => {
                const chipLabel =
                  cat === ""
                    ? "Uncategorized"
                    : labelByKey.get(cat) ?? cat;
                const hrefCat = cat === "" ? UNCATEGORIZED : cat;
                return (
                  <Link
                    key={cat || "__empty__"}
                    href={atmHref("bycategory", { category: cat })}
                    className={clsx(
                      "rounded-sm border px-3 py-1 font-mono text-[10px] tracking-wider transition",
                      active === "bycategory" && categoryDecoded === cat
                        ? "border-brass bg-brass/10 text-brass"
                        : "border-vault-line text-ink-mute hover:border-brass/40 hover:text-brass",
                    )}
                    title={hrefCat}
                  >
                    {chipLabel}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </details>

      <div className="mt-6">
        <NewItemRow box="ATM" placeholder="+ New ATM option" />
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 rounded-sm border border-dashed border-vault-line/60 px-4 py-6 text-center text-ink-mute">
          Nothing matches this filter.
        </p>
      ) : (
        [...groups.entries()].map(([cat, rows], gi) => {
          const label = labelByKey.get(cat) ?? "Uncategorized";
          const linkable = labelByKey.has(cat);
          return (
            <section
              key={cat || "__uncat__"}
              className={gi === 0 ? "mt-6" : "mt-5"}
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 shrink-0 rounded-sm bg-brass"
                  aria-hidden
                />
                <h2 className="eyebrow">
                  {linkable ? (
                    <Link
                      href={`/vault/${slugify(cat)}`}
                      className="transition hover:text-brass"
                      title={`Open the ${label} box`}
                    >
                      {label}
                    </Link>
                  ) : (
                    label
                  )}
                </h2>
              </div>
              <div className="mt-2 space-y-2">
                {rows.map((it) => {
                  const picked = it.todayOrder !== null;
                  return (
                    <div
                      key={it.id}
                      title={
                        [it.energy, it.title].filter(Boolean).join(" · ") ||
                        undefined
                      }
                      className={clsx(
                        "flex items-center gap-3 rounded-sm border bg-vault-panel/40 px-3 py-2 transition",
                        picked ? "border-brass/40" : "border-vault-line/60",
                      )}
                    >
                      <AreaPill
                        itemId={it.id}
                        initial={it.category}
                        field="category"
                        options={boxes.map((b) => ({
                          key: b.key,
                          label: b.label,
                        }))}
                        className="!max-h-7 max-w-[5.75rem] shrink-0 !py-0.5 !pl-1.5 !pr-1 !text-[9px] !leading-tight border-brass/40 bg-vault-bg/20"
                      />
                      <EditableText
                        itemId={it.id}
                        field="title"
                        initial={it.title}
                        className={clsx(
                          "vault-task-title min-w-0 flex-1 truncate",
                          picked ? "text-ink" : "text-ink-mute",
                        )}
                        placeholder="(no title)"
                      />
                      <span className="flex w-16 shrink-0 items-baseline justify-end gap-0.5 whitespace-nowrap font-mono text-[11px] text-ink-mute">
                        <EditableText
                          itemId={it.id}
                          field="minutes"
                          initial={it.minutes}
                          className="w-10 bg-transparent px-0 text-right text-[11px]"
                          numeric
                          placeholder="—"
                        />
                        <span>min</span>
                      </span>
                      <AtmPickButton
                        itemId={it.id}
                        picked={picked}
                        size="compact"
                      />
                      <DeleteItemButton itemId={it.id} />
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
