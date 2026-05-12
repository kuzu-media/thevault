import type { RecordType } from "@/lib/categories";

export type RecordFolderKey =
  | "health"
  | "books"
  | "misc"
  | "ecom-ecoship"
  | "friends-family"
  | "home-garden"
  | "stonewater-books"
  | "leisure"
  | "writing"
  | "travel";

export const RECORD_FOLDERS: { key: RecordFolderKey; label: string }[] = [
  { key: "health", label: "HEALTH" },
  { key: "books", label: "BOOKS" },
  { key: "misc", label: "Misc" },
  { key: "ecom-ecoship", label: "ECOM & ECOSHIP" },
  { key: "friends-family", label: "FRIENDS & FAMILY" },
  { key: "home-garden", label: "HOME & GARDEN" },
  { key: "stonewater-books", label: "STONEWATER BOOKS" },
  { key: "leisure", label: "LEISURE" },
  { key: "writing", label: "WRITING" },
  { key: "travel", label: "TRAVEL" },
];

export function folderForRecord(record: RecordType): RecordFolderKey {
  return record.folder ?? "misc";
}

export function groupRecordsByFolder(records: RecordType[]): Record<RecordFolderKey, RecordType[]> {
  const grouped: Record<RecordFolderKey, RecordType[]> = {
    health: [],
    books: [],
    misc: [],
    "ecom-ecoship": [],
    "friends-family": [],
    "home-garden": [],
    "stonewater-books": [],
    leisure: [],
    writing: [],
    travel: [],
  };
  for (const r of records) grouped[folderForRecord(r)].push(r);
  return grouped;
}

export function slugifyRecordKey(key: string): string {
  return key.toLowerCase().replace(/_/g, "-").replace(/\//g, "-");
}
