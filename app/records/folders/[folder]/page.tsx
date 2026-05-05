import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecords } from "@/lib/categories";
import { BoxCard } from "@/components/box-card";
import {
  RECORD_FOLDERS,
  groupRecordsByFolder,
  slugifyRecordKey,
  type RecordFolderKey,
} from "@/lib/record-folders";

const VALID_FOLDERS = new Set<RecordFolderKey>(
  RECORD_FOLDERS.map((f) => f.key),
);

export default async function RecordsFolderPage({
  params,
}: {
  params: Promise<{ folder: string }>;
}) {
  const { folder } = await params;
  if (!VALID_FOLDERS.has(folder as RecordFolderKey)) notFound();

  const folderKey = folder as RecordFolderKey;
  const records = await getRecords();
  const grouped = groupRecordsByFolder(records);
  const inFolder = grouped[folderKey];
  const folderMeta = RECORD_FOLDERS.find((f) => f.key === folderKey)!;

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 md:px-10">
      <div className="eyebrow">— Records Folder —</div>
      <h1 className="serif-h mt-2 text-[28px] leading-tight md:text-[36px]">
        {folderMeta.label}
      </h1>
      <p className="mt-1 text-[13px] text-ink-dim">
        {inFolder.length > 0
          ? `Open a record in ${folderMeta.label}.`
          : `No records in ${folderMeta.label} yet.`}
      </p>

      <div className="mt-4">
        <Link
          href="/records"
          className="rounded-sm border border-vault-line px-3 py-1 font-mono text-[10px] tracking-[0.18em] text-ink-mute transition hover:border-brass/40 hover:text-brass"
        >
          ← BACK TO FOLDERS
        </Link>
      </div>

      {inFolder.length > 0 ? (
        <div className="mt-8 flex flex-wrap gap-4">
          {inFolder.map((r) => (
            <BoxCard
              key={r.key}
              title={r.label}
              meta={r.meta || "reference"}
              href={`/records/${slugifyRecordKey(r.key)}`}
            />
          ))}
        </div>
      ) : (
        <p className="mt-8 text-[13px] text-ink-mute">
          Add records from Settings, then they&apos;ll appear here.
        </p>
      )}
    </div>
  );
}
