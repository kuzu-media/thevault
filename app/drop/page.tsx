import Link from "next/link";
import { getItemsByBox } from "@/lib/data";
import { getBoxes } from "@/lib/categories";
import { NewItemRow } from "@/components/new-item-row";
import { SortableList } from "@/components/sortable-list";
import { DropTriageRow } from "@/components/drop-triage-row";

export default async function DropPage() {
  const [list, boxes] = await Promise.all([
    getItemsByBox("DROP"),
    getBoxes(),
  ]);

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 md:px-10">
      <h1 className="serif-h text-[28px] leading-tight md:text-[36px]">
        The Drop
      </h1>
      <p className="mt-1 text-[12px] text-ink-mute">
        Triage each thought — pick a box, set time/flags/energy, send.
      </p>

      <div className="mt-6">
        <SortableList
          items={list.map((it) => ({
            id: it.id,
            content: <DropTriageRow item={it} boxes={boxes} />,
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
        . Edit the box list under{" "}
        <Link href="/settings/boxes" className="text-brass underline">
          Settings → Boxes
        </Link>
        .
      </p>
    </div>
  );
}
