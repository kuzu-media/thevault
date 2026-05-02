import Link from "next/link";
import { getRecords } from "@/lib/categories";
import { saveRecordConfig } from "@/lib/actions";
import { BoxesEditor } from "@/components/boxes-editor";

export default async function RecordsSettingsPage() {
  const initial = await getRecords();

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-8 md:px-10">
      <div className="eyebrow">— Settings · records —</div>
      <h1 className="serif-h mt-2 text-[36px] leading-tight md:text-[40px]">
        Long-form reference categories.
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
          className="rounded-sm border border-brass bg-brass/10 px-3 py-1 text-brass"
        >
          RECORDS
        </Link>
        <Link
          href="/settings/energies"
          className="rounded-sm border border-vault-line px-3 py-1 text-ink-mute hover:border-brass/40 hover:text-brass"
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
        Records are text-first reference — Notes, Measurements, Read &amp;
        Research, Health Ideas. Distinct from boxes (which hold task-shaped
        items). Each record gets a markdown page at{" "}
        <span className="font-mono text-brass">/records/&lt;slug&gt;</span>.
      </p>

      <BoxesEditor
        initial={initial}
        onSave={saveRecordConfig}
        singular="RECORD"
        plural="RECORDS"
        labelPlaceholder="Label (e.g. Notes)"
        metaPlaceholder="Subtitle, e.g. Measurements & doses"
      />
    </div>
  );
}
