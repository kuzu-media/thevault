import Link from "next/link";
import { getBoxes } from "@/lib/categories";
import { BoxesEditor } from "@/components/boxes-editor";

export default async function BoxesSettingsPage() {
  const initial = await getBoxes();

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-8 md:px-10">
      <div className="eyebrow">— Settings · boxes —</div>
      <h1 className="serif-h mt-2 text-[36px] leading-tight md:text-[40px]">
        How the vault is organized.
      </h1>

      <div className="mt-3 flex flex-wrap gap-3 font-mono text-[10px] tracking-wider">
        <Link
          href="/settings"
          className="rounded-sm border border-vault-line px-3 py-1 text-ink-mute hover:border-brass/40 hover:text-brass"
        >
          GENERAL
        </Link>
        <Link
          href="/settings/members"
          className="rounded-sm border border-vault-line px-3 py-1 text-ink-mute hover:border-brass/40 hover:text-brass"
        >
          MEMBERS
        </Link>
        <Link
          href="/settings/boxes"
          className="rounded-sm border border-brass bg-brass/10 px-3 py-1 text-brass"
        >
          BOXES
        </Link>
        <Link
          href="/settings/energies"
          className="rounded-sm border border-vault-line px-3 py-1 text-ink-mute hover:border-brass/40 hover:text-brass"
        >
          ENERGIES
        </Link>
      </div>

      <p className="mt-6 text-ink-dim">
        Your boxes are the categories you file thoughts into from The Drop —
        life areas, businesses, projects. The same box can hold Counter items
        (obligations) and ATM items (energy-matched pulls).
      </p>
      <p className="mt-1 text-[12px] text-ink-mute">
        The <strong>label</strong> is what you see in dropdowns. The{" "}
        <strong>meta</strong> is an optional subtitle (shown under the label
        on box cards). The <strong>key</strong> auto-derives from the label
        as you type — only edit it directly if you really need to.
      </p>

      <BoxesEditor initial={initial} />
    </div>
  );
}
