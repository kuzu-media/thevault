import Link from "next/link";
import clsx from "clsx";
import { getItemsByBox } from "@/lib/data";
import { getBoxes } from "@/lib/categories";
import { EditableText } from "@/components/editable-text";
import { NewItemRow } from "@/components/new-item-row";
import { AtmPickButton } from "@/components/atm-pick-button";
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
  | "bycategory"
  | "byenergy";

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
  "byenergy",
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
  opts: { category?: string; energy?: string },
): Item[] {
  const { category, energy } = opts;
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
    case "byenergy": {
      if (!energy) return items;
      const e = energy.toUpperCase();
      return items.filter(
        (it) => (it.energy ?? "").toUpperCase() === e,
      );
    }
    case "all":
    default:
      return items;
  }
}

function filterSummary(
  f: AtmFilter,
  category?: string,
  energy?: string,
): string {
  if (f === "all") return "FILTER";
  if (f === "bycategory") {
    const c = category === "" ? "UNCATEGORIZED" : (category ?? "").toUpperCase();
    return `FILTER · ${c}`;
  }
  if (f === "byenergy") return `FILTER · ${(energy ?? "").toUpperCase()}`;
  return `FILTER · ${f.replace(/-/g, " ").toUpperCase()}`;
}

export default async function AtmPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; category?: string; energy?: string }>;
}) {
  const sp = await searchParams;
  let active = coerceFilter(sp.filter);
  let categoryDecoded = decodeCategoryParam(sp.category);
  const energyParam = sp.energy?.trim();
  if (active === "bycategory" && sp.category === undefined) {
    active = "all";
    categoryDecoded = undefined;
  }
  if (active === "byenergy" && !energyParam) {
    active = "all";
  }

  const [list, boxes] = await Promise.all([
    getItemsByBox("ATM"),
    getBoxes(),
  ]);
  const filtered = applyAtmFilter(list, active, {
    category: categoryDecoded,
    energy: energyParam,
  });

  const labelByKey = new Map(boxes.map((b) => [b.key, b.label]));

  const categoryKeys = [
    ...new Set(list.map((it) => it.category ?? "")),
  ].sort((a, b) => {
    if (a === "" && b !== "") return 1;
    if (a !== "" && b === "") return -1;
    return a.localeCompare(b);
  });

  const energyKeys = [
    ...new Set(
      list
        .map((it) => (it.energy ?? "").trim())
        .filter((e) => e.length > 0),
    ),
  ].sort((a, b) => a.localeCompare(b));

  const groups = new Map<string, Item[]>();
  for (const it of filtered) {
    const key = it.category ?? "";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(it);
  }

  function atmHref(f: AtmFilter, extra?: { category?: string; energy?: string }) {
    if (f === "all") return "/atm";
    const p = new URLSearchParams();
    p.set("filter", f);
    if (extra?.category !== undefined) {
      p.set(
        "category",
        extra.category === "" ? UNCATEGORIZED : extra.category,
      );
    }
    if (extra?.energy) p.set("energy", extra.energy);
    return `/atm?${p.toString()}`;
  }

  return (
    <div className="mx-auto max-w-[960px] px-4 py-8 md:px-10">
      <h1 className="serif-h text-[28px] leading-tight md:text-[36px]">
        The ATM
      </h1>
      <p className="mt-1 text-[13px] text-ink-dim">
        Pull out whatever you&apos;d like to work on today. Nothing here is
        an obligation. Filter by pick state, duration, category, or energy.
      </p>

      <details className="group mt-6" open>
        <summary className="cursor-pointer list-none font-mono text-[10px] tracking-[0.24em] text-ink-mute hover:text-brass">
          <span className="inline-block transition-transform group-open:rotate-90">
            ›
          </span>{" "}
          {filterSummary(active, categoryDecoded, energyParam)}
        </summary>
        <div className="mt-3 flex flex-wrap gap-2">
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

          {categoryKeys.length > 0 && (
            <>
              <span className="px-2 self-center text-ink-mute/40">·</span>
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
            </>
          )}

          {energyKeys.length > 0 && (
            <>
              <span className="px-2 self-center text-ink-mute/40">·</span>
              {energyKeys.map((en) => (
                <Link
                  key={en}
                  href={atmHref("byenergy", { energy: en })}
                  className={clsx(
                    "rounded-sm border px-3 py-1 font-mono text-[10px] tracking-wider transition",
                    active === "byenergy" &&
                      energyParam?.toUpperCase() === en.toUpperCase()
                      ? "border-brass bg-brass/10 text-brass"
                      : "border-vault-line text-ink-mute hover:border-brass/40 hover:text-brass",
                  )}
                >
                  {en}
                </Link>
              ))}
            </>
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
        [...groups.entries()].map(([cat, rows]) => {
          const label = labelByKey.get(cat) ?? "Uncategorized";
          const linkable = labelByKey.has(cat);
          return (
            <section key={cat || "__uncat__"} className="mt-8">
              <h2 className="eyebrow text-ink-mute">
                {linkable ? (
                  <Link
                    href={`/vault/${slugify(cat)}`}
                    className="transition hover:text-brass"
                    title={`Open the ${label} box`}
                  >
                    — {label} —
                  </Link>
                ) : (
                  <span>— {label} —</span>
                )}
              </h2>
              <div className="mt-3 space-y-2">
                {rows.map((it) => {
                  const picked = it.todayOrder !== null;
                  return (
                    <div
                      key={it.id}
                      className={clsx(
                        "group relative overflow-hidden rounded-sm border bg-vault-panel/30 px-4 py-3 transition hover:border-brass/40 hover:bg-vault-panel/50",
                        picked ? "border-teal/40" : "border-vault-line/60",
                      )}
                    >
                      {picked && (
                        <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-teal" />
                      )}

                      <div className="flex items-center gap-3">
                        <EditableText
                          itemId={it.id}
                          field="title"
                          initial={it.title}
                          className="min-w-0 flex-1 vault-task-title"
                          placeholder="(no title)"
                        />
                        <span className="inline-flex shrink-0 items-baseline gap-1 rounded-sm border border-vault-line/60 bg-vault-bg/40 px-2 py-0.5 transition focus-within:border-brass focus-within:bg-vault-bg/80">
                          <EditableText
                            itemId={it.id}
                            field="minutes"
                            initial={it.minutes}
                            className="w-12 bg-transparent text-right font-mono text-[12px]"
                            numeric
                            placeholder="—"
                          />
                          <span className="font-mono text-[10px] text-ink-mute/70">
                            min
                          </span>
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-mute">
                          {it.energy ?? "—"}
                        </span>
                        <AtmPickButton itemId={it.id} picked={picked} />
                      </div>
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
