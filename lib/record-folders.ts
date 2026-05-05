import type { RecordType } from "@/lib/categories";

export type RecordFolderKey = "health" | "books" | "misc";

export const RECORD_FOLDERS: { key: RecordFolderKey; label: string }[] = [
  { key: "health", label: "Health" },
  { key: "books", label: "Books" },
  { key: "misc", label: "Misc" },
];

export function folderForRecord(record: RecordType): RecordFolderKey {
  return record.folder ?? "misc";
}

export function groupRecordsByFolder(records: RecordType[]): Record<RecordFolderKey, RecordType[]> {
  const grouped: Record<RecordFolderKey, RecordType[]> = {
    health: [],
    books: [],
    misc: [],
  };
  for (const r of records) grouped[folderForRecord(r)].push(r);
  return grouped;
}

export function slugifyRecordKey(key: string): string {
  return key.toLowerCase().replace(/_/g, "-").replace(/\//g, "-");
}
