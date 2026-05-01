import { getItemsByBox } from "@/lib/data";
import { RecordsEditor } from "@/components/records-editor";
import type { BoxKey } from "@/lib/types";

const SLUG_TO_BOX: Record<string, { box: BoxKey; title: string }> = {
  measurements: { box: "MEASUREMENTS", title: "Measurements" },
  lifting: { box: "LIFTING", title: "Lifting" },
  "pcs-misc": { box: "PCS_MISC", title: "PCS Misc" },
  notes: { box: "NOTES", title: "Notes" },
};

export default async function RecordPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meta = SLUG_TO_BOX[slug];
  if (!meta) return <div className="p-10">Record not found.</div>;
  const items = await getItemsByBox(meta.box);
  const record = items[0];

  return (
    <div className="mx-auto max-w-[800px] px-10 py-8">
      <div className="eyebrow">— Record —</div>
      <h1 className="serif-h mt-2 text-[40px] leading-tight">{meta.title}</h1>
      <div className="mt-8">
        <RecordsEditor box={meta.box} initial={record?.body ?? ""} title={meta.title} />
      </div>
    </div>
  );
}
