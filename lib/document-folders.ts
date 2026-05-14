import type { DocumentType } from "@/lib/categories";

export type DocumentFolderKey =
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

export const DOCUMENT_FOLDERS: { key: DocumentFolderKey; label: string }[] = [
  { key: "health", label: "HEALTH" },
  { key: "books", label: "BOOKS" },
  { key: "misc", label: "MISC" },
  { key: "ecom-ecoship", label: "ECOM & ECOSHIP" },
  { key: "friends-family", label: "FRIENDS & FAMILY" },
  { key: "home-garden", label: "HOME & GARDEN" },
  { key: "stonewater-books", label: "STONEWATER BOOKS" },
  { key: "leisure", label: "LEISURE" },
  { key: "writing", label: "WRITING" },
  { key: "travel", label: "TRAVEL" },
];

export function folderForDocument(doc: DocumentType): DocumentFolderKey {
  return doc.folder ?? "misc";
}

export function groupDocumentsByFolder(
  documents: DocumentType[],
): Record<DocumentFolderKey, DocumentType[]> {
  const grouped: Record<DocumentFolderKey, DocumentType[]> = {
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
  for (const d of documents) grouped[folderForDocument(d)].push(d);
  return grouped;
}

export function slugifyDocumentKey(key: string): string {
  return key.toLowerCase().replace(/_/g, "-").replace(/\//g, "-");
}
