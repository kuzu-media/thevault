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

/** Matches documents-settings-editor `deriveKey`. */
export function deriveDocumentKey(label: string): string {
  return label
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_/-]/g, "")
    .slice(0, 40);
}

export function documentHrefForKey(key: string): string {
  return `/documents/${slugifyDocumentKey(key)}`;
}

export const FIFTY_FD_DOCUMENT_LABEL =
  "Next Steps in all areas: 50 First Dates Tape";

export function fiftyFdDocumentHref(
  documents: { key: string; label: string }[],
): string {
  const label = FIFTY_FD_DOCUMENT_LABEL;
  const doc = documents.find(
    (d) => d.label.trim().toLowerCase() === label.toLowerCase(),
  );
  return documentHrefForKey(doc?.key ?? deriveDocumentKey(label));
}
