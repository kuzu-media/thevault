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
        Add a table to a record
      </h1>
      <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-ink-dim">
        A <strong className="font-medium text-ink/90">record</strong> is any
        notes page you open from the Records screen (for example &ldquo;Scratch
        pad&rdquo; or &ldquo;Reading list&rdquo;). Each record has two modes:{" "}
        <strong className="font-medium text-ink/90">READ</strong> shows your
        note nicely formatted, and{" "}
        <strong className="font-medium text-ink/90">EDIT</strong> is the big
        box where you type. When you paste the starter text below into EDIT and
        switch back to READ, the app turns those typed lines into a real table
        with rows and columns.
      </p>

      <ol className="mt-6 max-w-2xl list-decimal space-y-2 pl-5 text-[14px] leading-relaxed text-ink">
        <li>
          Tap <strong className="font-medium text-ink/90">Copy table text</strong>{" "}
          under the preview. That puts the starter on your clipboard (same idea
          as copying from Notes or email).
        </li>
        <li>
          Open the record where you want the table — use a shortcut below, or
          go back to{" "}
          <Link href="/records" className="text-brass underline-offset-2 hover:underline">
            Records
          </Link>{" "}
          and tap a tile.
        </li>
        <li>
          Tap <strong className="font-medium text-ink/90">EDIT</strong> at the
          top of that page.
        </li>
        <li>
          Click inside the text area, paste (⌘V on Mac, Ctrl+V on Windows), and
          edit the words in the cells if you like.
        </li>
        <li>
          Tap <strong className="font-medium text-ink/90">READ</strong> — you
          should see a proper table. Your note saves when you leave the text box
          or click away, same as usual.
        </li>
      </ol>

      <p className="mt-5 max-w-2xl text-[13px] text-ink-mute">
        The preview below is exactly how the table will look in READ after you
        paste the hidden starter text into EDIT.{" "}
        <span className="font-mono text-[11px] text-ink-dim">Show source</span>{" "}
        is only there if you are curious what the typed characters look like
        (lines with <span className="font-mono">|</span> symbols).
      </p>

      <div className="mt-8">
        <RecordTableTemplatePanel markdown={RECORD_TABLE_MARKDOWN} />
      </div>

      {records.length > 0 && (
        <>
          <div className="mt-10 eyebrow text-ink-mute">
            — Jump to a record (step 2) —
          </div>
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
