import Link from "next/link";
import { getSettings } from "@/lib/data";
import { saveBoxConfig } from "@/lib/actions";
import { BoxesEditor } from "@/components/boxes-editor";

export default async function BoxesSettingsPage() {
  const row = await getSettings();
  const initial =
    Array.isArray(row?.boxes) && row?.boxes.length
      ? row.boxes
      : DEFAULT_BOXES;

  return (
    <div className="mx-auto max-w-[800px] px-6 py-8 md:px-10">
      <div className="eyebrow">— Settings · boxes —</div>
      <h1 className="serif-h mt-2 text-[36px] leading-tight md:text-[40px]">
        How the vault is organized.
      </h1>

      <div className="mt-3 flex gap-3 font-mono text-[10px] tracking-wider">
        <Link
          href="/settings"
          className="rounded-sm border border-vault-line px-3 py-1 text-ink-mute hover:border-brass/40 hover:text-brass"
        >
          GENERAL
        </Link>
        <Link
          href="/settings/members"
          className="rounded-sm border border-vault-line px-3 py-1 text-ink-mute hover:border-brass/40 hover:text-brass"
        >
          MEMBERS
        </Link>
        <Link
          href="/settings/boxes"
          className="rounded-sm border border-brass bg-brass/10 px-3 py-1 text-brass"
        >
          BOXES
        </Link>
      </div>

      <p className="mt-6 text-ink-dim">
        Add, rename, or recolor a deposit box. The four Counter stations (Drop /
        Docket / Till / Drawer) are fixed.
      </p>

      <BoxesEditor initial={initial} />
    </div>
  );
}

const DEFAULT_BOXES = [
  { key: "SWB_PLAN", title: "SWB Plan", meta: "Strategic rows", color: "#b5853a" },
  { key: "PCS_DELEGATION", title: "PCS Delegation", meta: "For Ron", color: "#b5853a" },
  { key: "PCS_IDEAS", title: "PCS Ideas", meta: "Work ideas", color: "#b5853a" },
  { key: "READ_RESEARCH", title: "Read & Research", meta: "URLs & refs", color: "#b5853a" },
  { key: "HEALTH_IDEAS", title: "Health Ideas", meta: "Aspirational", color: "#b5853a" },
  { key: "MISC_IDEAS", title: "Misc Ideas", meta: "Aspirational", color: "#b5853a" },
  { key: "RON", title: "Ron's Queue", meta: "Delegation", color: "#b5853a" },
];
