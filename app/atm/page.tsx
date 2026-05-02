import clsx from "clsx";
import { getItemsByBox } from "@/lib/data";
import { EditableText } from "@/components/editable-text";
import { NewItemRow } from "@/components/new-item-row";
import { AtmPickButton } from "@/components/atm-pick-button";

export default async function AtmPage() {
  const list = await getItemsByBox("ATM");

  const groups = new Map<string, typeof list>();
  for (const it of list) {
    const key = it.category ?? "Other";
    if (!groups.has(key)) groups.set(key, [] as any);
    groups.get(key)!.push(it as any);
  }

  return (
    <div className="mx-auto max-w-[960px] px-4 py-8 md:px-10">
      <h1 className="serif-h text-[28px] leading-tight md:text-[36px]">
        The ATM
      </h1>
      <p className="mt-1 text-[12px] text-ink-mute">
        Withdraw what feels right. Nothing here is an obligation.
      </p>

      {[...groups.entries()].map(([cat, rows]) => (
        <section key={cat} className="mt-8">
          <h2 className="eyebrow">— {cat.toLowerCase()} —</h2>
          <div className="mt-3 space-y-2">
            {rows.map((it: any) => {
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

                  {/* Title + minutes */}
                  <div className="flex items-center gap-3">
                    <EditableText
                      itemId={it.id}
                      field="title"
                      initial={it.title}
                      className="min-w-0 flex-1 serif-h text-[15px]"
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

                  {/* Energy + pick */}
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
      ))}

      <div className="mt-10">
        <NewItemRow
          box="ATM"
          placeholder="+ New ATM option"
        />
      </div>
    </div>
  );
}
