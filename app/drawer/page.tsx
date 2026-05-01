import { getItemsByBox } from "@/lib/data";
import { fixtureItems } from "@/lib/fixtures";

const FILTERS = [
  "All",
  "Stress",
  "Urgent",
  "Must",
  "Today's",
  "Quick (5–15)",
  "By area",
];

export default async function DrawerPage() {
  const items = await getItemsByBox("DRAWER");
  const list = items.length ? items : fixtureItems.filter((i) => i.box === "DRAWER");

  return (
    <div className="mx-auto max-w-[1200px] px-10 py-8">
      <div className="eyebrow">— Counter station № 04 —</div>
      <h1 className="serif-h mt-2 text-[40px] leading-tight">The Drawer</h1>
      <p className="text-ink-dim">
        Admin obligations pulled onto the counter. Filter the way the macros used to.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map((f, i) => (
          <button
            key={f}
            className={
              "rounded-sm border px-3 py-1 font-mono text-[10px] tracking-wider " +
              (i === 0
                ? "border-brass bg-brass/10 text-brass"
                : "border-vault-line text-ink-mute hover:border-brass/40 hover:text-brass")
            }
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      <table className="mt-6 w-full text-left">
        <thead>
          <tr className="eyebrow text-ink-mute">
            <th className="py-2 font-normal">U</th>
            <th className="py-2 font-normal">M</th>
            <th className="py-2 font-normal">#</th>
            <th className="py-2 font-normal">Area</th>
            <th className="py-2 font-normal">Min</th>
            <th className="py-2 font-normal">Description</th>
          </tr>
        </thead>
        <tbody>
          {list.map((it) => (
            <tr
              key={it.id}
              className="border-t border-vault-line/40 hover:bg-vault-panel/40"
            >
              <td className="py-2 text-rust">{it.urgent ? "●" : ""}</td>
              <td className="py-2 text-brass">{it.must ? "■" : ""}</td>
              <td className="py-2 font-mono text-[11px] text-ink-mute">
                {it.todayOrder ?? ""}
              </td>
              <td className="py-2 font-mono text-[11px] text-brass">
                {it.area ?? ""}
              </td>
              <td className="py-2 font-mono text-[11px] text-ink-mute">
                {it.minutes ?? ""}
              </td>
              <td className="py-2">{it.title}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
