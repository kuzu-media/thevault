import { getRecords } from "@/lib/categories";
import { saveRecordConfig } from "@/lib/actions";
import { RecordsSettingsEditor } from "@/components/records-settings-editor";
import { SettingsSubnav } from "@/components/settings-subnav";

export default async function RecordsSettingsPage() {
  const initial = await getRecords();

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-8 md:px-10">
      <div className="eyebrow">— Settings · records —</div>
      <h1 className="serif-h mt-2 text-[36px] leading-tight md:text-[40px]">
        Long-form reference categories.
      </h1>

      <div className="mt-3">
        <SettingsSubnav />
      </div>

      <p className="mt-6 text-[18px] text-ink-dim">
        Records are text-first reference — Notes, Measurements, Read &amp;
        Research, Health Ideas. Distinct from boxes (which hold task-shaped
        items). Each record gets a markdown page at{" "}
        <span className="font-mono text-brass">/records/&lt;slug&gt;</span>.
      </p>

      <RecordsSettingsEditor
        initial={initial}
        onSave={saveRecordConfig}
      />
    </div>
  );
}
