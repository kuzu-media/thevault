// Records hub — folder view for configured records.

import Link from "next/link";
import { getRecords } from "@/lib/categories";
import { BoxCard } from "@/components/box-card";
import { CopyTableMarkdownButton } from "@/components/copy-table-markdown-button";
import { RECORD_FOLDERS, groupRecordsByFolder } from "@/lib/record-folders";

export default async function RecordsHubPage() {
  const records = await getRecords();
  const grouped = groupRecordsByFolder(records);

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 md:px-10">
      <h1 className="serif-h text-[28px] leading-tight md:text-[36px]">
        Records
      </h1>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <p className="text-[13px] text-ink-dim">
          Reference folders — open a folder to see the records inside.
        </p>
        <CopyTableMarkdownButton />
      </div>

      <div className="mt-10 eyebrow text-ink-mute">— Open a folder —</div>
      <div className="mt-4 flex flex-wrap gap-4">
        {RECORD_FOLDERS.map((folder) => (
          <BoxCard
            key={folder.key}
            title={folder.label}
            meta={`${grouped[folder.key].length} record${grouped[folder.key].length === 1 ? "" : "s"}`}
            href={`/records/folders/${folder.key}`}
          />
        ))}
        <NewRecordTile href="/settings/records" label="+ New record" />
      </div>
    </div>
  );
}

function NewRecordTile({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex h-[140px] w-full flex-col items-center justify-center gap-1 rounded-sm border border-dashed border-vault-line text-ink-mute transition hover:border-brass/40 hover:text-brass sm:w-[240px]"
    >
      <span className="serif-h text-[16px]">{label}</span>
    </Link>
  );
}
