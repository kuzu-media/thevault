import Link from "next/link";
import { getItemsByBox } from "@/lib/data";
import { fixtureItems } from "@/lib/fixtures";

export default async function DropPage() {
  const items = await getItemsByBox("DROP");
  const list = items.length ? items : fixtureItems.filter((i) => i.box === "DROP");

  return (
    <div className="mx-auto max-w-[960px] px-10 py-8">
      <div className="eyebrow">— Counter station № 01 —</div>
      <h1 className="serif-h mt-2 text-[40px] leading-tight">The Drop</h1>
      <p className="text-ink-dim">
        Untriaged captures. Send to a box, the Docket, or dismiss.
      </p>

      <div className="mt-6 space-y-2">
        {list.length === 0 && (
          <div className="rounded-sm border border-dashed border-vault-line p-6 text-center text-ink-mute">
            Nothing to triage.
          </div>
        )}
        {list.map((it) => (
          <div
            key={it.id}
            className="flex items-center gap-4 rounded-sm border border-vault-line bg-vault-panel/40 px-4 py-3"
          >
            <span className="font-mono text-[10px] tracking-wider text-brass">▸ NEW</span>
            <span className="flex-1">{it.title}</span>
            <div className="flex gap-1">
              <Chip>→ Docket</Chip>
              <Chip>→ Drawer</Chip>
              <Chip>→ Box</Chip>
              <Chip muted>Dismiss</Chip>
            </div>
          </div>
        ))}
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

function Chip({
  children,
  muted = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <button
      className={
        "rounded-sm border px-2 py-1 font-mono text-[10px] tracking-wider " +
        (muted
          ? "border-vault-line text-ink-mute hover:border-ink-mute"
          : "border-brass/40 text-brass hover:border-brass")
      }
    >
      {children}
    </button>
  );
}
