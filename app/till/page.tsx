import { getItemsByBox } from "@/lib/data";
import { EditableText } from "@/components/editable-text";
import { NewItemRow } from "@/components/new-item-row";
import { TillPickButton } from "@/components/till-pick-button";

export default async function TillPage() {
  const list = await getItemsByBox("TILL");

  const groups = new Map<string, typeof list>();
  for (const it of list) {
    const key = it.category ?? "Other";
    if (!groups.has(key)) groups.set(key, [] as any);
    groups.get(key)!.push(it as any);
  }

  return (
    <div className="mx-auto max-w-[960px] px-4 py-8 md:px-10">
      <h1 className="serif-h text-[28px] leading-tight md:text-[36px]">
        The Till
      </h1>
      <p className="mt-1 text-[12px] text-ink-mute">
        Pick what feels right. Nothing here is an obligation.
      </p>

      {[...groups.entries()].map(([cat, rows]) => (
        <section key={cat} className="mt-8">
          <h2 className="eyebrow">— {cat.toLowerCase()} —</h2>
          <div className="mt-3 space-y-2">
            {rows.map((it: any) => (
              <div
                key={it.id}
                className="flex flex-wrap items-center gap-3 rounded-sm border border-vault-line/60 bg-vault-panel/40 px-4 py-2.5 hover:border-brass/30"
              >
                <span className="font-mono text-[10px] tracking-wider text-ink-mute">
                  {(it.energy ?? "").toLowerCase()}
                </span>
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
                <TillPickButton
                  itemId={it.id}
                  picked={it.todayOrder !== null}
                />
              </div>
            ))}
          </div>
        </section>
      ))}

      <div className="mt-10">
        <NewItemRow
          box="TILL"
          placeholder="+ New till option"
          defaults={{ energy: "CREATIVE" }}
        />
      </div>
    </div>
  );
}
