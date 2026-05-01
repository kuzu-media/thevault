import Link from "next/link";

export default function OnboardingPage() {
  return (
    <div className="mx-auto max-w-[720px] px-10 py-16">
      <div className="eyebrow">— First run —</div>
      <h1 className="serif-h mt-2 text-[44px] leading-tight">
        Welcome to your vault.
      </h1>
      <p className="mt-3 text-ink-dim">
        Three quick questions, then the door opens.
      </p>

      <ol className="mt-10 space-y-6">
        <Step
          n={1}
          title="Migrate from the Sheet"
          body="One-time pull from the Google Sheet that's been your Vault. Nothing is changed in the sheet — read-only."
          cta="Run import"
        />
        <Step
          n={2}
          title="Set today's answers"
          body="The five morning questions you've been answering forever. Same questions, just typed in once instead of in a Word doc."
          cta="Open day inputs"
        />
        <Step
          n={3}
          title="Set up phone capture"
          body="An Apple Shortcut on your Action Button. Press, talk or type, deposit. Always lands in The Drop."
          cta="Set up Shortcut"
        />
      </ol>

      <div className="mt-12 flex justify-end">
        <Link
          href="/"
          className="brass-button px-6 py-2 font-mono text-[10px] tracking-[0.24em] text-[#2a1c08]"
        >
          OPEN THE VAULT →
        </Link>
      </div>
    </div>
  );
}

function Step({
  n,
  title,
  body,
  cta,
}: {
  n: number;
  title: string;
  body: string;
  cta: string;
}) {
  return (
    <li className="rounded-sm border border-vault-line bg-vault-panel/40 p-5">
      <div className="flex items-baseline gap-3">
        <span className="plaque">№ 0{n}</span>
        <h3 className="serif-h text-[22px]">{title}</h3>
      </div>
      <p className="mt-2 text-ink-dim">{body}</p>
      <button className="mt-4 rounded-sm border border-brass/40 px-3 py-1.5 font-mono text-[10px] tracking-wider text-brass hover:bg-brass/10">
        {cta}
      </button>
    </li>
  );
}
