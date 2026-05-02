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

      <div className="mt-3 flex gap-3 font-mono text-[10px] tracking-wider">
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
      </div>

      <p className="mt-6 text-ink-dim">
        Your boxes are the categories Tracy can file a thought into from The
        Drop. Each box sends to either The Till (non-admin / energy-matched)
        or The Drawer (admin obligations).
      </p>

      <BoxesEditor initial={initial} />
    </div>
  );
}
