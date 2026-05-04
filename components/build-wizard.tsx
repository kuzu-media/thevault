"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { toast } from "sonner";
import {
  formatEndOfDay12h,
  parseTimeOnDate,
  pickAtmCandidates,
} from "@/lib/daily-plan";
import { saveDayInputsPartial, pickFromAtm } from "@/lib/actions";
import { markPreferTodayOverDropLanding } from "@/lib/vault-nav-client";
import { TodayToggle } from "./today-toggle";
import type { DayInputs, Item } from "@/lib/types";
import { useShortcut } from "@/lib/shortcuts";
import { Kbd } from "./kbd";

const STEPS = [
  { n: 1, title: "Today" },
  { n: 2, title: "Counter" },
  { n: 3, title: "ATM" },
] as const;

export function BuildWizard({
  step,
  inputs,
  counterItems,
  atmItems,
  stressors,
  timeSensitive,
  mustDo,
}: {
  step: number;
  inputs: DayInputs;
  counterItems: Item[];
  atmItems: Item[];
  stressors: Item[];
  timeSensitive: Item[];
  mustDo: Item[];
}) {
  void counterItems;
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const total = STEPS.length;
  const isLast = step === total;

  function next() {
    router.push(`/build?step=${step + 1}`);
  }

  function prev() {
    if (step === 1) {
      markPreferTodayOverDropLanding();
      router.push("/");
    } else router.push(`/build?step=${step - 1}`);
  }

  function finish() {
    markPreferTodayOverDropLanding();
    router.push("/");
  }

  // Esc → back. Steps 5 + 6 advance with Enter (no input focus).
  useShortcut("escape", prev, {
    label: "Back / cancel",
    group: "Build day",
    options: { allowInInputs: true },
  });
  useShortcut(
    "enter",
    () => {
      if (step === 2) next();
      else if (step === 3) finish();
    },
    {
      label: "Continue",
      group: "Build day",
      options: { enabled: step === 2 || step === 3 },
    },
  );

  return (
    <div className="relative mx-auto flex min-h-[80vh] max-w-[640px] flex-col px-4 py-12 md:px-10">
      <Progress step={step} total={total} />

      <div className="mt-12 flex-1">
        {step === 1 && (
          <DaySetupStep
            inputs={inputs}
            date={inputs.date}
            onNext={next}
            pending={pending}
            startTransition={startTransition}
          />
        )}
        {step === 2 && (
          <ReviewStep
            stressors={stressors}
            timeSensitive={timeSensitive}
            mustDo={mustDo}
            onNext={next}
          />
        )}
        {step === 3 && (
          <AtmStep atm={atmItems} inputs={inputs} onFinish={finish} />
        )}
      </div>

      <div className="mt-8 flex items-center justify-between font-mono text-[10px] tracking-[0.18em] text-ink-mute">
        <button
          onClick={prev}
          className="flex items-center gap-2 hover:text-brass"
          disabled={pending}
        >
          <Kbd keys="escape" size="xs" />
          <span>← {step === 1 ? "CANCEL" : "BACK"}</span>
        </button>
        <Link
          href="/"
          className="hover:text-brass"
          onClick={() => markPreferTodayOverDropLanding()}
        >
          SKIP &amp; OPEN VAULT
        </Link>
      </div>
    </div>
  );
}

function Progress({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <div
          key={n}
          className={clsx(
            "h-[3px] flex-1 rounded-full transition",
            n < step
              ? "bg-brass"
              : n === step
                ? "bg-brass-bright"
                : "bg-vault-line",
          )}
        />
      ))}
    </div>
  );
}

// ─── Step 1 — energies + end time (hours come from Settings → General) ─────
function DaySetupStep({
  inputs,
  date,
  onNext,
  pending,
  startTransition,
}: {
  inputs: DayInputs;
  date: string;
  onNext: () => void;
  pending: boolean;
  startTransition: (fn: () => Promise<void>) => void;
}) {
  const [creative, setCreative] = useState(inputs.creative);
  const [probSolv, setProbSolv] = useState(inputs.probSolv);
  const [tie, setTie] = useState(inputs.tieBreak);
  const [endOfDay, setEndOfDay] = useState(() => {
    try {
      return formatEndOfDay12h(inputs.endOfDay, date);
    } catch {
      return inputs.endOfDay;
    }
  });
  const equal = creative === probSolv;

  function submit() {
    let normalizedEnd: string;
    try {
      normalizedEnd = formatEndOfDay12h(endOfDay.trim(), date);
    } catch {
      toast.error("Couldn’t read that time — try 4:30 PM.");
      return;
    }
    startTransition(async () => {
      try {
        await saveDayInputsPartial({
          date,
          creative: creative as 1 | 2 | 3 | 4 | 5,
          prob_solv: probSolv as 1 | 2 | 3 | 4 | 5,
          tie_break: tie,
          end_of_day: normalizedEnd,
          reference_now: new Date().toISOString(),
        });
        onNext();
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Couldn't save.");
      }
    });
  }

  return (
    <Step
      title="Set the shape of today"
      hint="Two scores from 1–5 and when work should end. Your schedule window runs from right now until that end time."
      pending={pending}
      onSubmit={submit}
      submitLabel="NEXT"
    >
      <EnergyPicker
        label="Creative energy"
        value={creative}
        onChange={(n) => setCreative(n as DayInputs["creative"])}
      />
      <EnergyPicker
        label="Problem-solving energy"
        value={probSolv}
        onChange={(n) => setProbSolv(n as DayInputs["creative"])}
      />
      {equal && (
        <div className="mt-8">
          <p className="text-[13px] text-ink-dim">
            Same score — which way should today lean?
          </p>
          <div className="mt-3 flex gap-2">
            <ChoiceButton
              active={tie === "CREATIVE"}
              onClick={() => setTie("CREATIVE")}
            >
              Creative
            </ChoiceButton>
            <ChoiceButton
              active={tie === "PROB-SOLV"}
              onClick={() => setTie("PROB-SOLV")}
            >
              Problem-solving
            </ChoiceButton>
          </div>
        </div>
      )}
      <div className="mt-10">
        <p className="eyebrow">End of your work day</p>
        <input
          type="text"
          value={endOfDay}
          onChange={(e) => setEndOfDay(e.target.value)}
          placeholder="e.g. 4:30 PM"
          autoComplete="off"
          className="mt-3 w-full rounded-sm border border-vault-line bg-vault-panel/60 px-4 py-3 font-mono text-[18px] text-ink outline-none placeholder:text-ink-mute focus:border-brass"
        />
      </div>
    </Step>
  );
}

function EnergyPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="mt-8 first:mt-0">
      <p className="eyebrow">{label}</p>
      <p className="mt-1 text-[12px] text-ink-dim">1 = flat · 5 = strong</p>
      <div className="mt-3 flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={clsx(
              "flex-1 rounded-sm border py-4 font-mono text-[20px] transition",
              n === value
                ? "border-brass bg-brass/10 text-brass-bright"
                : "border-vault-line/60 text-ink-mute hover:border-brass/40 hover:text-brass",
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Step 2 — admin review ─────────────────────────────────────────────────
function ReviewStep({
  stressors,
  timeSensitive,
  mustDo,
  onNext,
}: {
  stressors: Item[];
  timeSensitive: Item[];
  mustDo: Item[];
  onNext: () => void;
}) {
  const total =
    stressors.length + timeSensitive.length + mustDo.length;
  return (
    <Step
      title="What's already on the counter?"
      hint={
        total === 0
          ? "Nothing pulled up. Today is yours."
          : "Tap + TODAY on the ones you want to schedule. Anything you don't add stays in the Counter for another day."
      }
      submitLabel="ON TO THE ATM →"
      onSubmit={onNext}
    >
      <Group label="Stressors" tone="rust">
        {stressors.length === 0 ? <Empty /> : stressors.map((it) => <Row key={it.id} item={it} />)}
      </Group>
      <Group label="Time-sensitive" tone="amber">
        {timeSensitive.length === 0 ? <Empty /> : timeSensitive.map((it) => <Row key={it.id} item={it} />)}
      </Group>
      <Group label="Must-do" tone="sky">
        {mustDo.length === 0 ? <Empty /> : mustDo.map((it) => <Row key={it.id} item={it} />)}
      </Group>
    </Step>
  );
}

function Row({ item }: { item: Item }) {
  const onToday = (item.todayOrder ?? null) !== null;
  return (
    <div
      className={clsx(
        "flex items-center gap-3 rounded-sm border bg-vault-panel/40 px-3 py-2 transition",
        onToday ? "border-brass/40" : "border-vault-line/60",
      )}
    >
      {item.area && (
        <span className="shrink-0 rounded-sm border border-brass/40 px-1.5 py-0.5 font-mono text-[9px] tracking-wider text-brass">
          {item.area}
        </span>
      )}
      <span
        className={clsx(
          "vault-task-title min-w-0 flex-1 truncate",
          onToday ? "text-ink" : "text-ink-mute",
        )}
        title={item.title}
      >
        {item.title}
      </span>
      <span className="w-16 shrink-0 whitespace-nowrap text-right font-mono text-[11px] text-ink-mute">
        {item.minutes ?? "—"} min
      </span>
      <TodayToggle itemId={item.id} on={onToday} size="sm" />
    </div>
  );
}

function Group({
  label,
  tone,
  children,
}: {
  label: string;
  tone: "rust" | "rust-soft" | "brass" | "sky" | "amber";
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5">
      <div className="flex items-center gap-2">
        <span
          className={clsx(
            "h-2 w-2",
            tone === "rust"
              ? "rounded-full bg-rust"
              : tone === "rust-soft"
                ? "rounded-full bg-rust/50"
                : tone === "amber"
                  ? "rounded-full bg-amber-500"
                  : tone === "sky"
                    ? "rounded-sm bg-sky-600"
                    : "rounded-sm bg-brass",
          )}
        />
        <h3 className="eyebrow">{label}</h3>
      </div>
      <div className="mt-2 space-y-2">{children}</div>
    </div>
  );
}

function Empty() {
  return <div className="text-[12px] italic text-ink-mute">(nothing here)</div>;
}

// ─── Step 3 — ATM withdrawals ────────────────────────────────────────────────
function AtmStep({
  atm,
  inputs,
  onFinish,
}: {
  atm: Item[];
  inputs: DayInputs;
  onFinish: () => void;
}) {
  const matched = pickAtmCandidates(atm, inputs).slice(0, 8);
  const allHaveCategory = matched.some((m) => !!m.category);
  const groups = new Map<string, Item[]>();
  for (const it of matched) {
    const k = (it.category ?? "Pull") as string;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(it);
  }
  return (
    <Step
      title="Withdraw anything from the ATM?"
      hint="Energy-matched options for today. Pick what feels right — or none."
      submitLabel="BUILD THE DAY"
      onSubmit={onFinish}
    >
      {matched.length === 0 ? (
        <p className="rounded-sm border border-dashed border-vault-line/60 px-4 py-6 text-center text-ink-mute">
          Nothing matches today's energy. That&rsquo;s fine.
        </p>
      ) : (
        [...groups.entries()].map(([cat, rows]) => (
          <div key={cat} className="mt-5">
            {allHaveCategory && (
              <h3 className="eyebrow">— {cat.toLowerCase()} —</h3>
            )}
            <div className="mt-2 space-y-2">
              {rows.map((it) => (
                <AtmRow key={it.id} item={it} />
              ))}
            </div>
          </div>
        ))
      )}
    </Step>
  );
}

function AtmRow({ item }: { item: Item }) {
  const [picked, setPicked] = useState(item.todayOrder !== null);
  const [, startTransition] = useTransition();
  return (
    <button
      onClick={() => {
        const next = !picked;
        setPicked(next);
        startTransition(async () => {
          await pickFromAtm(item.id, next);
        });
      }}
      className={clsx(
        "flex w-full items-center justify-between gap-3 rounded-sm border px-4 py-2.5 text-left transition",
        picked
          ? "border-brass bg-brass/10"
          : "border-vault-line/60 bg-vault-panel/40 hover:border-brass/40",
      )}
    >
      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] tracking-wider text-ink-mute">
          {(item.energy ?? "").toLowerCase()}
        </span>
        <span className="text-ink">{item.title}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-[11px] text-ink-mute">
          {item.minutes ?? "—"} min
        </span>
        <span
          className={clsx(
            "h-5 w-5 rounded-sm border",
            picked
              ? "border-brass bg-brass"
              : "border-brass/40",
          )}
        />
      </div>
    </button>
  );
}

// ─── Step shell ────────────────────────────────────────────────────────────
function Step({
  title,
  hint,
  children,
  onSubmit,
  submitLabel = "NEXT",
  pending = false,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
  onSubmit: () => void;
  submitLabel?: string;
  pending?: boolean;
}) {
  return (
    <div>
      <h1 className="serif-h text-[28px] leading-tight md:text-[36px]">
        {title}
      </h1>
      <p className="mt-2 text-ink-dim">{hint}</p>
      <div className="mt-10">{children}</div>
      <div className="mt-12 flex justify-end">
        <button
          onClick={onSubmit}
          disabled={pending}
          className="brass-button px-8 py-3 font-mono text-[10px] tracking-[0.24em] text-[#2a1c08] disabled:opacity-50"
        >
          {pending ? "SAVING…" : submitLabel}
        </button>
      </div>
    </div>
  );
}

function ChoiceButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex-1 rounded-sm border px-4 py-3 transition",
        active
          ? "border-brass bg-brass/10 text-brass"
          : "border-vault-line/60 text-ink-mute hover:border-brass/40",
      )}
    >
      {children}
    </button>
  );
}
