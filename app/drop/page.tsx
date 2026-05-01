import Link from "next/link";
import { getItemsByBox } from "@/lib/data";
import { TriageChips } from "@/components/triage-chips";
import { EditableText } from "@/components/editable-text";
import { NewItemRow } from "@/components/new-item-row";
import { SortableList } from "@/components/sortable-list";

export default async function DropPage() {
  const list = await getItemsByBox("DROP");

  return (
    <div className="mx-auto max-w-[960px] px-6 py-8 md:px-10">
      <h1 className="serif-h text-[28px] leading-tight md:text-[36px]">
        The Drop
      </h1>
      <p className="mt-1 text-[12px] text-ink-mute">
        Untriaged captures. Drag to reorder, send to a box, or dismiss.
      </p>

      <div className="mt-6">
        <SortableList
          items={list.map((it) => ({
            id: it.id,
            content: (
              <div className="flex items-center gap-4 rounded-sm border border-vault-line bg-vault-panel/40 px-4 py-3">
                <span className="font-mono text-[10px] tracking-wider text-brass">
                  ▸ NEW
                </span>
                <EditableText
                  itemId={it.id}
                  field="title"
                  initial={it.title}
                  className="flex-1"
                />
                <TriageChips
                  itemId={it.id}
                  targets={[
                    { label: "→ Docket", box: "DRAWER" },
                    { label: "→ Till", box: "TILL" },
                    { label: "→ PCS Ideas", box: "PCS_IDEAS" },
                    { label: "→ Misc Ideas", box: "MISC_IDEAS" },
                  ]}
                />
              </div>
            ),
          }))}
        />
        <div className="mt-2">
          <NewItemRow box="DROP" placeholder="+ Drop a thought" />
        </div>
      </div>

      <p className="mt-6 text-[11px] text-ink-mute">
        New captures land here from the iPhone Shortcut, Siri, or the{" "}
        <Link href="/deposit" className="text-brass underline">
          Mail Slot
        </Link>
        .
      </p>
    </div>
  );
}
