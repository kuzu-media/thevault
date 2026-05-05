"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import clsx from "clsx";

export function RecordTableTemplatePanel({ markdown }: { markdown: string }) {
  const [showRaw, setShowRaw] = useState(false);

  function copy() {
    void navigator.clipboard
      .writeText(markdown)
      .then(() =>
        toast.success("Copied. Open a record, tap EDIT, and paste."),
      )
      .catch(() => toast.error("Couldn't copy."));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={copy}
          className="rounded-sm border border-brass bg-brass/10 px-4 py-2 text-[13px] text-brass transition hover:bg-brass/20"
        >
          Copy table text
        </button>
        <button
          type="button"
          onClick={() => setShowRaw((v) => !v)}
          className={clsx(
            "rounded-sm border px-3 py-2 text-[12px] transition",
            showRaw
              ? "border-brass bg-brass/10 text-brass"
              : "border-vault-line text-ink-mute hover:border-brass/40 hover:text-brass",
          )}
        >
          {showRaw ? "Preview" : "Show source"}
        </button>
      </div>

      {showRaw ? (
        <pre className="overflow-x-auto rounded-sm border border-vault-line bg-vault-panel/40 p-4 font-mono text-[12px] leading-relaxed text-ink">
          {markdown}
        </pre>
      ) : (
        <article className="prose prose-invert prose-headings:font-serif max-w-none rounded-sm border border-vault-line bg-vault-panel/20 p-6 text-ink">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
        </article>
      )}
    </div>
  );
}
