"use client";
import { useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import clsx from "clsx";
import { saveRecord } from "@/lib/actions";

export function RecordsEditor({
  box,
  initial,
  title,
}: {
  box: string;
  initial: string;
  title: string;
}) {
  const [body, setBody] = useState(initial);
  const [mode, setMode] = useState<"read" | "edit">(
    initial.trim() ? "read" : "edit",
  );
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function save() {
    startTransition(async () => {
      await saveRecord(box, body, title);
      setSavedAt(Date.now());
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 font-mono text-[10px] tracking-wider">
        <button
          onClick={() => setMode("read")}
          className={clsx(
            "rounded-sm border px-3 py-1",
            mode === "read"
              ? "border-brass bg-brass/10 text-brass"
              : "border-vault-line text-ink-mute hover:border-brass/40 hover:text-brass",
          )}
        >
          READ
        </button>
        <button
          onClick={() => setMode("edit")}
          className={clsx(
            "rounded-sm border px-3 py-1",
            mode === "edit"
              ? "border-brass bg-brass/10 text-brass"
              : "border-vault-line text-ink-mute hover:border-brass/40 hover:text-brass",
          )}
        >
          EDIT
        </button>
        <span className="ml-auto text-ink-mute">
          {pending && "saving…"}
          {!pending &&
            savedAt &&
            `saved ${new Date(savedAt).toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            })}`}
        </span>
      </div>

      {mode === "read" ? (
        <article className="prose prose-invert prose-headings:font-serif max-w-none text-ink">
          {body.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
          ) : (
            <p className="italic text-ink-mute">
              Empty record. Switch to EDIT to start writing.
            </p>
          )}
        </article>
      ) : (
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onBlur={save}
          rows={24}
          spellCheck
          className="w-full rounded-sm border border-vault-line bg-vault-panel/40 p-4 font-mono text-[13px] leading-relaxed text-ink outline-none focus:border-brass"
          placeholder="# Start writing in markdown…"
        />
      )}
    </div>
  );
}
