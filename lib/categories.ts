// Tracy's category & area list. Drives the Drop triage dropdown and the
// Drawer area pills.
//
// The Drop sends to The Till for non-admin categories (energy-matched picks)
// and The Drawer for admin areas (obligations / business / life areas).

export type CategoryDest = "TILL" | "DRAWER";

export type Category = {
  key: string;
  label: string;
  dest: CategoryDest;
};

// Till categories — energy-matched picks. The `category` column holds
// the key on the row; energy is set independently.
export const TILL_CATEGORIES: Category[] = [
  { key: "PLD", label: "PLD", dest: "TILL" },
  { key: "CC", label: "CC", dest: "TILL" },
  { key: "NP", label: "NP", dest: "TILL" },
  { key: "HG", label: "HG", dest: "TILL" },
  { key: "READ/WATCH", label: "Read / Watch", dest: "TILL" },
  { key: "LEISURE", label: "Leisure", dest: "TILL" },
  { key: "PHYSICAL", label: "Physical", dest: "TILL" },
  { key: "PEOPLE", label: "People", dest: "TILL" },
];

// Drawer areas — admin obligations. The `area` column holds the key.
export const DRAWER_AREAS: Category[] = [
  { key: "PCS", label: "PCS", dest: "DRAWER" },
  { key: "QCOM", label: "Qcom", dest: "DRAWER" },
  { key: "SWB", label: "SWB", dest: "DRAWER" },
  { key: "ECOSHIP", label: "Ecoship", dest: "DRAWER" },
  { key: "ADVERT", label: "Advert", dest: "DRAWER" },
  { key: "HOME", label: "Home", dest: "DRAWER" },
  { key: "FF", label: "FF", dest: "DRAWER" },
  { key: "HEALTH", label: "Health", dest: "DRAWER" },
  { key: "TRAVEL", label: "Travel", dest: "DRAWER" },
];

export const ALL_CATEGORIES: Category[] = [
  ...TILL_CATEGORIES,
  ...DRAWER_AREAS,
];

export function destinationFor(key: string): CategoryDest {
  return DRAWER_AREAS.some((c) => c.key === key) ? "DRAWER" : "TILL";
}
