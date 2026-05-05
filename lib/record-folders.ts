import type { RecordType } from "@/lib/categories";

export type RecordFolderKey = "health" | "books" | "misc";

export const RECORD_FOLDERS: { key: RecordFolderKey; label: string }[] = [
  { key: "health", label: "Health" },
  { key: "books", label: "Books" },
  { key: "misc", label: "Misc" },
];

function normalizeForMatch(v: string): string {
  return v.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function isHealthRecord(record: RecordType): boolean {
  const key = normalizeForMatch(record.key);
  const label = normalizeForMatch(record.label);
  return (
    key.includes("LIFTING") ||
    label.includes("LIFTING") ||
    key.includes("MEASUREMENTS") ||
    key.includes("MEASURMENTS") ||
    label.includes("MEASUREMENTS") ||
    label.includes("MEASURMENTS")
  );
}

export function folderForRecord(record: RecordType): RecordFolderKey {
  if (isHealthRecord(record)) return "health";
  return "misc";
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
