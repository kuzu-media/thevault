import { getItemsByBox } from "@/lib/data";
import { getBoxes } from "@/lib/categories";
import { TriageChips } from "@/components/triage-chips";
import { EditableText } from "@/components/editable-text";
import { NewItemRow } from "@/components/new-item-row";
import type { BoxKey } from "@/lib/types";

export default async function BoxPage({
  params,
}: {
  params: Promise<{ box: string }>;
}) {
  const { box } = await params;
  const key = box.toUpperCase().replace(/-/g, "_") as BoxKey;
  const [list, configuredBoxes] = await Promise.all([
    getItemsByBox(key),
    getBoxes(),
  ]);
  const title =
    configuredBoxes.find((b) => b.key === key)?.label ?? prettify(key);

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 md:px-10">
      <div className="eyebrow">— Deposit box —</div>
      <h1 className="serif-h mt-2 text-[36px] leading-tight md:text-[40px]">
        {title}
      </h1>

      <div className="mt-6 space-y-2">
        <NewItemRow box={key} placeholder={`+ New in ${title}`} />
        {list.map((it) => (
          <div
            key={it.id}
            className="flex flex-wrap items-start gap-3 rounded-sm border border-vault-line bg-vault-panel/40 px-4 py-3"
          >
            {it.potential && (
              <span
                className="shrink-0 font-mono text-[11px] tracking-wider text-brass"
                title={`Potential: ${it.potential}/5`}
              >
                {"★".repeat(it.potential)}
                <span className="text-brass/30">
                  {"★".repeat(5 - it.potential)}
                </span>
              </span>
            )}
            <span className="flex shrink-0 items-baseline gap-1 font-mono text-[10px] text-ink-mute">
              <EditableText
                itemId={it.id}
                field="minutes"
                initial={it.minutes}
                className="w-10 text-right"
                numeric
                placeholder="—"
              />
              <span>min</span>
            </span>
            {it.person && (
              <span className="shrink-0 rounded-sm border border-brass/30 px-1.5 py-0.5 font-mono text-[9px] tracking-wider text-brass">
                {it.person}
              </span>
            )}
            <p
              className="min-w-[200px] flex-1 whitespace-pre-wrap break-words text-ink"
              title={it.title}
            >
              {it.title}
            </p>
            <TriageChips
              itemId={it.id}
              targets={[
                { label: "→ Docket", box: "COUNTER" },
                { label: "→ Drop", box: "DROP" },
              ]}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function prettify(key: string): string {
  return key
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}
