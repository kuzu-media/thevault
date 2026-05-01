import { getItemsByBox } from "@/lib/data";
import { fixtureItems } from "@/lib/fixtures";

export default async function TillPage() {
  const items = await getItemsByBox("TILL");
  const list = items.length ? items : fixtureItems.filter((i) => i.box === "TILL");

  const groups = new Map<string, typeof list>();
  for (const it of list) {
    const key = it.category ?? "Uncategorized";
    if (!groups.has(key)) groups.set(key, [] as any);
    groups.get(key)!.push(it as any);
  }

  return (
    <div className="mx-auto max-w-[1440px] px-10 py-8">
      <div className="eyebrow">— Counter station № 03 —</div>
      <h1 className="serif-h mt-2 text-[40px] leading-tight">The Till</h1>
      <p className="text-ink-dim">
        Energy-matched options for today. Pick what feels right; nothing here is an obligation.
      </p>

      {[...groups.entries()].map(([cat, rows]) => (
        <section key={cat} className="mt-8">
          <h2 className="eyebrow text-brass">— {cat} —</h2>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {rows.map((it: any) => (
              <div
                key={it.id}
                className="rounded-sm border border-vault-line bg-vault-panel/40 p-4 transition hover:border-brass/40"
              >
                <div className="eyebrow">
                  {it.energy ?? ""} · {it.minutes ?? "—"} min
                </div>
                <div className="mt-2 serif-h text-[18px]">{it.title}</div>
                <button className="mt-3 rounded-sm border border-brass/40 px-3 py-1 font-mono text-[10px] tracking-wider text-brass hover:bg-brass/10">
                  + Pick
                </button>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
