import Link from "next/link";
import { getRecords } from "@/lib/categories";
import { RECORD_TABLE_MARKDOWN } from "@/lib/record-table-template";
import { RecordTableTemplatePanel } from "@/components/record-table-template-panel";

function slugify(key: string): string {
  return key.toLowerCase().replace(/_/g, "-").replace(/\//g, "-");
}

export default async function RecordNewTablePage() {
  const records = await getRecords();

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 md:px-10">
      <Link
        href="/records"
        className="text-[12px] text-ink-mute transition hover:text-brass"
      >
        ← Records
      </Link>
      <h1 className="serif-h mt-4 text-[28px] leading-tight md:text-[36px]">
        Table template
      </h1>
      <p className="mt-2 max-w-xl text-[13px] text-ink-dim">
        Copy the markdown below, open a record, switch to{" "}
        <span className="font-mono text-[11px] text-ink-mute">EDIT</span>, and
        paste where you want the table. Records use GitHub-flavored markdown
        (pipe tables).
      </p>

      <div className="mt-8">
        <RecordTableTemplatePanel markdown={RECORD_TABLE_MARKDOWN} />
      </div>

      {records.length > 0 && (
        <>
          <div className="mt-10 eyebrow text-ink-mute">— Open a record —</div>
          <ul className="mt-3 flex flex-wrap gap-2 text-[13px]">
            {records.map((r) => (
              <li key={r.key}>
                <Link
                  href={`/records/${slugify(r.key)}`}
                  className="rounded-sm border border-vault-line px-3 py-1.5 text-ink-mute transition hover:border-brass/40 hover:text-brass"
                >
                  {r.label}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
