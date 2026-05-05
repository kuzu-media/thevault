// Records hub — one tile per configured record (settings.records), each
// linking to /records/<slug> for the markdown surface.

import Link from "next/link";
import { getRecords } from "@/lib/categories";
import { BoxCard } from "@/components/box-card";

export default async function RecordsHubPage() {
  const records = await getRecords();

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 md:px-10">
      <h1 className="serif-h text-[28px] leading-tight md:text-[36px]">
        Records
      </h1>
      <p className="mt-1 text-[13px] text-ink-dim">
        Reference — long-form notes and lists, one page per record.
      </p>

      <div className="mt-10 eyebrow text-ink-mute">— Open a record —</div>
      <div className="mt-4 flex flex-wrap gap-4">
        {records.map((r) => (
          <BoxCard
            key={r.key}
            title={r.label}
            meta={r.meta || "reference"}
            href={`/records/${slugify(r.key)}`}
          />
        ))}
        <NewRecordTile href="/records/new-table" label="+ New Table" />
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

function slugify(key: string): string {
  return key.toLowerCase().replace(/_/g, "-").replace(/\//g, "-");
}
