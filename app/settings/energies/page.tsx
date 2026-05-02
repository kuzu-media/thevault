import Link from "next/link";
import { getEnergies } from "@/lib/categories";
import { EnergiesEditor } from "@/components/energies-editor";

export default async function EnergiesSettingsPage() {
  const initial = await getEnergies();

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-8 md:px-10">
      <div className="eyebrow">— Settings · energies —</div>
      <h1 className="serif-h mt-2 text-[36px] leading-tight md:text-[40px]">
        How energies route.
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
          className="rounded-sm border border-vault-line px-3 py-1 text-ink-mute hover:border-brass/40 hover:text-brass"
        >
          BOXES
        </Link>
        <Link
          href="/settings/energies"
          className="rounded-sm border border-brass bg-brass/10 px-3 py-1 text-brass"
        >
          ENERGIES
        </Link>
      </div>

      <p className="mt-6 text-ink-dim">
        Energies are how you label what kind of energy a task takes. Each
        energy decides where the item goes when you triage it from The Drop:
        TILL for energy-matched picks, DRAWER for admin obligations.
      </p>

      <EnergiesEditor initial={initial} />
    </div>
  );
}
