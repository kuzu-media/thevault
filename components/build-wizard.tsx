"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import {
  saveDayInputsPartial,
  pickFromTill,
  setItemState,
} from "@/lib/actions";
import type { DayInputs, Item, Energy } from "@/lib/types";

const STEPS = [
  { n: 1, title: "Hours" },
  { n: 2, title: "Creative" },
  { n: 3, title: "Problem-solving" },
  { n: 4, title: "End of day" },
  { n: 5, title: "What's heavy" },
  { n: 6, title: "From the till" },
] as const;

export function BuildWizard({
  step,
  inputs,
  drawer,
  till,
  stressors,
  timeSensitive,
  mustDo,
}: {
  step: number;
  inputs: DayInputs;
  drawer: Item[];
  till: Item[];
  stressors: Item[];
  timeSensitive: Item[];
  mustDo: Item[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const total = STEPS.length;
  const isLast = step === total;

  function next() {
    router.push(`/build?step=${step + 1}`);
  }

  function prev() {
    if (step === 1) router.push("/");
    else router.push(`/build?step=${step - 1}`);
  }

  function finish() {
    router.push("/");
  }

  return (
    <div className="relative mx-auto flex min-h-[80vh] max-w-[640px] flex-col px-4 py-12 md:px-10">
      <Progress step={step} total={total} />

      <div className="mt-12 flex-1">
        {step === 1 && (
          <HoursStep
            initial={inputs.hoursAvailable}
            date={inputs.date}
            onNext={next}
            pending={pending}
            startTransition={startTransition}
          />
        )}
        {step === 2 && (
          <EnergyStep
            initial={inputs.creative}
            date={inputs.date}
            onNext={next}
            pending={pending}
            startTransition={startTransition}
          />
        )}
        {step === 3 && (
          <ProbSolvStep
            initial={inputs.probSolv}
            tieInitial={inputs.tieBreak}
            creative={inputs.creative}
            date={inputs.date}
            onNext={next}
            pending={pending}
            startTransition={startTransition}
          />
        )}
        {step === 4 && (
          <EndOfDayStep
            initial={inputs.endOfDay}
            date={inputs.date}
            onNext={next}
            pending={pending}
            startTransition={startTransition}
          />
        )}
        {step === 5 && (
          <ReviewStep
            stressors={stressors}
            timeSensitive={timeSensitive}
            mustDo={mustDo}
            onNext={next}
          />
        )}
        {step === 6 && (
          <TillStep till={till} inputs={inputs} onFinish={finish} />
        )}
      </div>

      <div className="mt-8 flex items-center justify-between font-mono text-[10px] tracking-[0.18em] text-ink-mute">
        <button
          onClick={prev}
          className="hover:text-brass"
          disabled={pending}
        >
          ← {step === 1 ? "CANCEL" : "BACK"}
        </button>
        <Link href="/" className="hover:text-brass">
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

// ─── Step 1 — hours ─────────────────────────────────────────────────────────
function HoursStep({
  initial,
  date,
  onNext,
  pending,
  startTransition,
}: {
  initial: number;
  date: string;
  onNext: () => void;
  pending: boolean;
  startTransition: (fn: () => Promise<void>) => void;
}) {
  const [v, setV] = useState(initial);
  return (
    <Step
      title="How much time do you have today?"
      hint="For tasks and projects. Skip meetings, lunch, errands."
      pending={pending}
      onSubmit={() =>
        startTransition(async () => {
          await saveDayInputsPartial({ date, hours_available: v });
          onNext();
        })
      }
    >
      <NumberPlusMinus value={v} onChange={setV} suffix="hrs" min={0} max={16} step={0.5} />
    </Step>
  );
}

// ─── Step 2 — creative ─────────────────────────────────────────────────────
function EnergyStep({
  initial,
  date,
  onNext,
  pending,
  startTransition,
}: {
  initial: number;
  date: string;
  onNext: () => void;
  pending: boolean;
  startTransition: (fn: () => Promise<void>) => void;
}) {
  const [v, setV] = useState(initial);
  return (
    <Step
      title="How creative do you feel?"
      hint="One to five. Trust the gut."
      pending={pending}
      onSubmit={() =>
        startTransition(async () => {
          await saveDayInputsPartial({ date, creative: v as 1 | 2 | 3 | 4 | 5 });
          onNext();
        })
      }
    >
      <Tabs value={v} onChange={setV} labels={["barely", "low", "okay", "good", "lit"]} />
    </Step>
  );
}

// ─── Step 3 — prob-solv (+ tie-break if equal) ─────────────────────────────
function ProbSolvStep({
  initial,
  tieInitial,
  creative,
  date,
  onNext,
  pending,
  startTransition,
}: {
  initial: number;
  tieInitial: "CREATIVE" | "PROB-SOLV";
  creative: number;
  date: string;
  onNext: () => void;
  pending: boolean;
  startTransition: (fn: () => Promise<void>) => void;
}) {
  const [v, setV] = useState(initial);
  const [tie, setTie] = useState(tieInitial);
  const equal = v === creative;
  return (
    <Step
      title="How problem-solvy do you feel?"
      hint="Linear thinking, fixing-things energy."
      pending={pending}
      onSubmit={() =>
        startTransition(async () => {
          await saveDayInputsPartial({
            date,
            prob_solv: v as 1 | 2 | 3 | 4 | 5,
            tie_break: tie,
          });
          onNext();
        })
      }
    >
      <Tabs value={v} onChange={setV} labels={["barely", "low", "okay", "good", "sharp"]} />
      {equal && (
        <div className="mt-10">
          <p className="text-ink-dim">They tied. Which way today?</p>
          <div className="mt-3 flex gap-2">
            <ChoiceButton active={tie === "CREATIVE"} onClick={() => setTie("CREATIVE")}>
              Creative
            </ChoiceButton>
            <ChoiceButton active={tie === "PROB-SOLV"} onClick={() => setTie("PROB-SOLV")}>
              Problem-solving
            </ChoiceButton>
          </div>
        </div>
      )}
    </Step>
  );
}

// ─── Step 4 — end of day ────────────────────────────────────────────────────
function EndOfDayStep({
  initial,
  date,
  onNext,
  pending,
  startTransition,
}: {
  initial: string;
  date: string;
  onNext: () => void;
  pending: boolean;
  startTransition: (fn: () => Promise<void>) => void;
}) {
  const [v, setV] = useState(initial);
  return (
    <Step
      title="When does today end?"
      hint="Your end-of-work time. The schedule lands here."
      pending={pending}
      onSubmit={() =>
        startTransition(async () => {
          await saveDayInputsPartial({ date, end_of_day: v });
          onNext();
        })
      }
    >
      <input
        type="time"
        value={v}
        onChange={(e) => setV(e.target.value)}
        className="serif-h w-full rounded-sm border border-vault-line bg-vault-panel/60 px-6 py-4 text-center text-[36px] text-ink outline-none focus:border-brass"
      />
    </Step>
  );
}

// ─── Step 5 — admin review ─────────────────────────────────────────────────
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
          : "Skim. Set anything aside that isn't really today."
      }
      submitLabel="THESE LOOK RIGHT"
      onSubmit={onNext}
    >
      <Group label="Stressors" tone="rust">
        {stressors.length === 0 ? <Empty /> : stressors.map((it) => <Row key={it.id} item={it} />)}
      </Group>
      <Group label="Time-sensitive" tone="rust-soft">
        {timeSensitive.length === 0 ? <Empty /> : timeSensitive.map((it) => <Row key={it.id} item={it} />)}
      </Group>
      <Group label="Must-do" tone="brass">
        {mustDo.length === 0 ? <Empty /> : mustDo.map((it) => <Row key={it.id} item={it} />)}
      </Group>
    </Step>
  );
}

function Row({ item }: { item: Item }) {
  const [skipped, setSkipped] = useState(false);
  const [, startTransition] = useTransition();
  return (
    <div
      className={clsx(
        "flex items-center gap-3 rounded-sm border border-vault-line/60 bg-vault-panel/40 px-3 py-2",
        skipped && "opacity-40 line-through",
      )}
    >
      {item.area && (
        <span className="shrink-0 rounded-sm border border-brass/40 px-1.5 py-0.5 font-mono text-[9px] tracking-wider text-brass">
          {item.area}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate text-ink" title={item.title}>
        {item.title}
      </span>
      <span className="w-16 shrink-0 whitespace-nowrap text-right font-mono text-[11px] text-ink-mute">
        {item.minutes ?? "—"} min
      </span>
      <button
        onClick={() => {
          const next = !skipped;
          setSkipped(next);
          startTransition(async () => {
            await setItemState(item.id, next ? "skipped" : "upcoming");
          });
        }}
        className="w-[88px] shrink-0 whitespace-nowrap rounded-sm border border-vault-line px-2 py-0.5 font-mono text-[10px] tracking-wider text-ink-mute hover:border-rust hover:text-rust"
      >
        {skipped ? "BRING BACK" : "NOT TODAY"}
      </button>
    </div>
  );
}

function Group({
  label,
  tone,
  children,
}: {
  label: string;
  tone: "rust" | "rust-soft" | "brass";
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

// ─── Step 6 — Till picks ───────────────────────────────────────────────────
function TillStep({
  till,
  inputs,
  onFinish,
}: {
  till: Item[];
  inputs: DayInputs;
  onFinish: () => void;
}) {
  const matched = matchEnergy(till, inputs).slice(0, 8);
  const allHaveCategory = matched.some((m) => !!m.category);
  const groups = new Map<string, Item[]>();
  for (const it of matched) {
    const k = (it.category ?? "Pull") as string;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(it);
  }
  return (
    <Step
      title="Pull anything from the till?"
      hint="Energy-matched options for today. Pick what feels right — or none."
      submitLabel="OPEN THE VAULT"
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
                <TillRow key={it.id} item={it} />
              ))}
            </div>
          </div>
        ))
      )}
    </Step>
  );
}

function TillRow({ item }: { item: Item }) {
  const [picked, setPicked] = useState(item.todayOrder !== null);
  const [, startTransition] = useTransition();
  return (
    <button
      onClick={() => {
        const next = !picked;
        setPicked(next);
        startTransition(async () => {
          await pickFromTill(item.id, next);
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

function matchEnergy(till: Item[], inputs: DayInputs): Item[] {
  const sum = inputs.creative + inputs.probSolv;
  const lowEnergy = sum < 6;
  let creative = inputs.creative > inputs.probSolv;
  let probSolv = inputs.creative < inputs.probSolv;
  if (inputs.creative === inputs.probSolv) {
    creative = inputs.tieBreak === "CREATIVE";
    probSolv = inputs.tieBreak === "PROB-SOLV";
  }
  const avail = inputs.hoursAvailable * 60;
  return till.filter((it) => {
    const m = it.minutes ?? 0;
    if (!m || m > avail) return false;
    const e = (it.energy as Energy | null) ?? null;
    if (lowEnergy && (e === "LEISURE" || e === "PHYSICAL")) return true;
    if (creative && e === "CREATIVE") return true;
    if (probSolv && e === "PROB-SOLV") return true;
    return false;
  });
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

// ─── Inputs ────────────────────────────────────────────────────────────────
function NumberPlusMinus({
  value,
  onChange,
  suffix,
  min = 0,
  max = 24,
  step = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="flex items-center justify-center gap-6">
      <button
        onClick={() => onChange(Math.max(min, value - step))}
        className="flex h-12 w-12 items-center justify-center rounded-full border border-brass/40 text-[24px] text-brass/80 hover:border-brass hover:bg-brass/10 hover:text-brass"
      >
        −
      </button>
      <div className="serif-h flex items-baseline gap-2 text-[64px] text-ink">
        <span>{value}</span>
        {suffix && <span className="text-[16px] text-ink-mute">{suffix}</span>}
      </div>
      <button
        onClick={() => onChange(Math.min(max, value + step))}
        className="flex h-12 w-12 items-center justify-center rounded-full border border-brass/40 text-[24px] text-brass/80 hover:border-brass hover:bg-brass/10 hover:text-brass"
      >
        +
      </button>
    </div>
  );
}

function Tabs({
  value,
  onChange,
  labels,
}: {
  value: number;
  onChange: (n: number) => void;
  labels: string[];
}) {
  return (
    <div className="flex gap-2">
      {labels.map((label, i) => {
        const n = i + 1;
        const active = n === value;
        return (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={clsx(
              "flex flex-1 flex-col items-center gap-2 rounded-sm border px-2 py-4 transition",
              active
                ? "border-brass bg-brass/10 text-brass"
                : "border-vault-line/60 text-ink-mute hover:border-brass/40 hover:text-brass",
            )}
          >
            <span className="serif-h text-[24px]">{n}</span>
            <span className="font-mono text-[9px] uppercase tracking-wider">
              {label}
            </span>
          </button>
        );
      })}
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
