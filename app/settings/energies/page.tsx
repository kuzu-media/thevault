import Link from "next/link";
import { getEnergies } from "@/lib/categories";
import { EnergiesEditor } from "@/components/energies-editor";

export default async function EnergiesSettingsPage() {
  const initial = await getEnergies();

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-8 md:px-10">
      <div className="eyebrow">— Settings · energies —</div>
      <h1 className="serif-h mt-2 text-[36px] leading-tight md:text-[40px]">
        Energies.
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
          href="/settings/records"
          className="rounded-sm border border-vault-line px-3 py-1 text-ink-mute hover:border-brass/40 hover:text-brass"
        >
          RECORDS
        </Link>
        <Link
          href="/settings/energies"
          className="rounded-sm border border-brass bg-brass/10 px-3 py-1 text-brass"
        >
          ENERGIES
        </Link>
        <Link
          href="/settings/connect"
          className="rounded-sm border border-vault-line px-3 py-1 text-ink-mute hover:border-brass/40 hover:text-brass"
        >
          CONNECT
        </Link>
      </div>

      <p className="mt-6 text-ink-dim">
        Energies label how a task feels — they live on ATM items, used by
        the daily plan to match what you can pull today. Counter items don't
        use energy; they go by urgency and must-do flags.
      </p>
      <p className="mt-1 text-[12px] text-ink-mute">
        The <strong>label</strong> is what you see in dropdowns. The{" "}
        <strong>key</strong> auto-derives from the label as you type — only
        edit it directly if you really need to.
      </p>

      <EnergiesEditor initial={initial} />
    </div>
  );
}
