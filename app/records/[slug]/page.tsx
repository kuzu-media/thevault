// Record detail — markdown body for one configured record category.
//
// The slug must match a record key in settings.records (case-insensitive,
// hyphen ↔ underscore). Anything else 404s with a deep link back to the
// records editor. Items are stored in the items table with box = the
// record's key and a markdown body; we surface the most-recent item so
// this stays one-record-per-slug. Later we can fan out to multiple
// entries if Tracy wants them.

import Link from "next/link";
import { getItemsByBox } from "@/lib/data";
import { getRecords } from "@/lib/categories";
import { RecordsEditor } from "@/components/records-editor";
import type { BoxKey } from "@/lib/types";

function slugToKey(slug: string): string {
  return slug.toUpperCase().replace(/-/g, "_");
}

export default async function RecordPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const records = await getRecords();
  const key = slugToKey(slug);
  const meta = records.find((r) => r.key === key);

  if (!meta) {
    return (
      <div className="mx-auto max-w-[640px] px-10 py-16 text-center">
        <div className="eyebrow">— Record not found —</div>
        <h1 className="serif-h mt-2 text-[28px]">Nothing filed here.</h1>
        <p className="mt-2 text-[13px] text-ink-mute">
          No record category called{" "}
          <span className="font-mono text-brass">{key}</span>.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link
            href="/vault"
            className="rounded-sm border border-vault-line px-4 py-2 font-mono text-[10px] tracking-[0.18em] text-ink-mute hover:border-brass/40 hover:text-brass"
          >
            ← BACK TO VAULT
          </Link>
          <Link
            href="/settings/records"
            className="rounded-sm border border-brass/40 px-4 py-2 font-mono text-[10px] tracking-[0.18em] text-brass hover:bg-brass/10"
          >
            + ADD A RECORD
          </Link>
        </div>
      </div>
    );
  }

  const items = await getItemsByBox(key as BoxKey);
  const record = items[0];

  return (
    <div className="mx-auto max-w-[800px] px-10 py-8">
      <div className="eyebrow">— Record —</div>
      <h1 className="serif-h mt-2 text-[40px] leading-tight">{meta.label}</h1>
      {meta.meta && (
        <p className="mt-1 text-[12px] text-ink-mute">{meta.meta}</p>
      )}
      <div className="mt-8">
        <RecordsEditor
          box={key}
          initial={record?.body ?? ""}
          title={meta.label}
        />
      </div>
    </div>
  );
}
