import { getItemsByBox } from "@/lib/data";
import { fixtureItems } from "@/lib/fixtures";
import type { BoxKey } from "@/lib/types";

const TITLES: Record<string, string> = {
  "swb-plan": "SWB Plan",
  "pcs-delegation": "PCS Delegation",
  "pcs-ideas": "PCS Ideas",
  "read-research": "Read & Research",
  "health-ideas": "Health Ideas",
  "misc-ideas": "Misc Ideas",
  ron: "Ron's Queue",
};

export default async function BoxPage({
  params,
}: {
  params: Promise<{ box: string }>;
}) {
  const { box } = await params;
  const key = box.toUpperCase().replace(/-/g, "_") as BoxKey;
  const items = await getItemsByBox(key);
  const list = items.length ? items : fixtureItems.filter((i) => i.box === key);
  const title = TITLES[box] ?? box.replace(/-/g, " ");

  return (
    <div className="mx-auto max-w-[1200px] px-10 py-8">
      <div className="eyebrow">— Deposit box —</div>
      <h1 className="serif-h mt-2 text-[40px] leading-tight capitalize">
        {title}
      </h1>

      <div className="mt-6 space-y-2">
        {list.length === 0 && (
          <div className="rounded-sm border border-dashed border-vault-line p-6 text-center text-ink-mute">
            Nothing in this box yet.
          </div>
        )}
        {list.map((it) => (
          <div
            key={it.id}
            className="flex items-center gap-4 rounded-sm border border-vault-line bg-vault-panel/40 px-4 py-3"
          >
            {it.potential && (
              <span className="font-mono text-[10px] text-brass">
                {"★".repeat(it.potential)}
                {"☆".repeat(5 - it.potential)}
              </span>
            )}
            {it.minutes && (
              <span className="font-mono text-[10px] text-ink-mute">
                {it.minutes}m
              </span>
            )}
            {it.person && (
              <span className="rounded-sm border border-brass/40 px-1.5 py-0.5 font-mono text-[9px] tracking-wider text-brass">
                {it.person}
              </span>
            )}
            <span className="flex-1">{it.title}</span>
            <button className="rounded-sm border border-brass/40 px-2 py-1 font-mono text-[10px] tracking-wider text-brass hover:bg-brass/10">
              → Docket
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
