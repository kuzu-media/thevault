// Records hub — folder view for configured records.

import Link from "next/link";
import { getRecords } from "@/lib/categories";
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
          <RecordFolderCard
            key={folder.key}
            title={folder.label}
            count={grouped[folder.key].length}
            href={`/records/folders/${folder.key}`}
          />
        ))}
        <NewRecordTile href="/settings/records" label="+ New record" />
      </div>
    </div>
  );
}

function RecordFolderCard({
  title,
  count,
  href,
}: {
  title: string;
  count: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group relative h-[170px] w-full rounded-sm border border-[#d4be8f] bg-[#f7edcf] shadow-[inset_0_0_0_1px_rgba(212,190,143,0.35)] transition hover:border-[#c8aa73] hover:bg-[#f6e8c1] sm:w-[320px]"
    >
      <div className="absolute right-4 top-[-1px] rounded-b-md rounded-t-sm border border-[#d4be8f] bg-[#f3e4be] px-5 py-1.5 shadow-[inset_0_0_0_1px_rgba(212,190,143,0.35)]">
        <span className="font-serif text-[32px] tracking-wide text-[#4b3a24]">
          {title.toUpperCase()}
        </span>
      </div>
      <div className="absolute inset-0 rounded-sm bg-[linear-gradient(180deg,rgba(255,255,255,0.2),rgba(0,0,0,0.02))]" />
      <div className="absolute bottom-3 right-4 font-mono text-[10px] tracking-[0.16em] text-[#6f5a37]/80">
        {count} RECORD{count === 1 ? "" : "S"}
      </div>
    </Link>
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
