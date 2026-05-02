import Link from "next/link";
import { getItemsByBox } from "@/lib/data";
import { getBoxes, getEnergies } from "@/lib/categories";
import { NewItemRow } from "@/components/new-item-row";
import { SortableList } from "@/components/sortable-list";
import { DropTriageRow } from "@/components/drop-triage-row";

export default async function DropPage() {
  const [list, boxes, energies] = await Promise.all([
    getItemsByBox("DROP"),
    getBoxes(),
    getEnergies(),
  ]);

  const ready = boxes.length > 0 && energies.length > 0;

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 md:px-10">
      <h1 className="serif-h text-[28px] leading-tight md:text-[36px]">
        The Drop
      </h1>
      <p className="mt-1 text-[12px] text-ink-mute">
        {ready
          ? "Triage each thought — pick a box, set time/flags/energy, send."
          : "Untriaged captures. Set up your boxes and energies before triaging."}
      </p>

      {!ready && (
        <div className="mt-6 rounded-sm border border-dashed border-brass/40 bg-vault-panel/30 p-6">
          <h3 className="serif-h text-[18px] text-ink">
            Set up your vault first.
          </h3>
          <p className="mt-1 text-[13px] text-ink-dim">
            Triage needs at least one box (where things go) and one energy
            (which decides ATM vs Counter).
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {boxes.length === 0 && (
              <Link
                href="/settings/boxes"
                className="brass-button px-4 py-2 font-mono text-[10px] tracking-[0.18em] text-[#2a1c08]"
              >
                + ADD BOXES
              </Link>
            )}
            {energies.length === 0 && (
              <Link
                href="/settings/energies"
                className="brass-button px-4 py-2 font-mono text-[10px] tracking-[0.18em] text-[#2a1c08]"
              >
                + ADD ENERGIES
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="mt-6">
        <SortableList
          items={list.map((it) => ({
            id: it.id,
            content: (
              <DropTriageRow item={it} boxes={boxes} energies={energies} />
            ),
          }))}
        />
        <div className="mt-3">
          <NewItemRow box="DROP" placeholder="+ Drop a thought" />
        </div>
      </div>

      <p className="mt-6 text-[11px] text-ink-mute">
        New captures land here from the iPhone Shortcut, Siri, or the{" "}
        <Link href="/deposit" className="text-brass underline">
          Mail Slot
        </Link>
        . Edit boxes and energies under{" "}
        <Link href="/settings/boxes" className="text-brass underline">
          Settings
        </Link>
        .
      </p>
    </div>
  );
}
