"use client";

import { toast } from "sonner";
import { RECORD_TABLE_MARKDOWN } from "@/lib/record-table-template";

export function CopyTableMarkdownButton() {
  function copy() {
    void navigator.clipboard
      .writeText(RECORD_TABLE_MARKDOWN)
      .then(() =>
        toast.success("Copied. Open a record, tap EDIT, and paste."),
      )
      .catch(() => toast.error("Couldn't copy."));
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="w-fit rounded-sm border border-vault-line bg-vault-panel/40 px-3 py-1.5 text-[12px] text-ink-mute transition hover:border-brass/40 hover:text-brass"
    >
      Copy table markdown
    </button>
  );
}
