"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { toast } from "sonner";
import { formatEndOfDay12h } from "@/lib/daily-plan";
import { saveDayInputsPartial, pickFromAtm } from "@/lib/actions";
import { markPreferTodayOverDropLanding } from "@/lib/vault-nav-client";
import { DropTriageRow } from "@/components/drop-triage-row";
import { TodayToggle } from "./today-toggle";
import type { DayInputs, Item } from "@/lib/types";
import type { Box, EnergyType } from "@/lib/categories";
import { useShortcut } from "@/lib/shortcuts";
import { Kbd } from "./kbd";

const STEPS = [
  { n: 1, title: "End Time" },
  { n: 2, title: "Drop" },
  { n: 3, title: "Counter" },
  { n: 4, title: "ATM" },
] as const;

export function BuildWizard({
  step,
  inputs,
  dropItems,
  counterItems,
  atmItems,
  boxes,
  energies,
  stressors,
  timeSensitive,
  mustDo,
  otherAdmin,
}: {
  step: number;
  inputs: DayInputs;
  dropItems: Item[];
  counterItems: Item[];
  atmItems: Item[];
  boxes: Box[];
  energies: EnergyType[];
  stressors: Item[];
  timeSensitive: Item[];
  mustDo: Item[];
  otherAdmin: Item[];
}) {
  void counterItems;
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const total = STEPS.length;
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

  // Esc → back. Enter advances on steps without editable text fields.
  useShortcut("escape", prev, {
    label: "Back / cancel",
    group: "Build day",
    options: { allowInInputs: true },
  });
  useShortcut(
    "enter",
    () => {
      if (step === 3) next();
      else if (step === 4) finish();
    },
    {
      label: "Continue",
      group: "Build day",
      options: { enabled: step === 3 || step === 4 },
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
          <DropStep dropItems={dropItems} boxes={boxes} energies={energies} onNext={next} />
        )}
        {step === 3 && (
          <ReviewStep
            stressors={stressors}
            timeSensitive={timeSensitive}
            mustDo={mustDo}
            otherAdmin={otherAdmin}
            onNext={next}
          />
        )}
        {step === 4 && (
          <AtmStep atm={atmItems} onFinish={finish} />
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

// Step 1: end-of-day time only.
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
  const [endOfDay, setEndOfDay] = useState(() => {
    try {
      return formatEndOfDay12h(inputs.endOfDay, date);
    } catch {
      return inputs.endOfDay;
    }
  });
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
      title="When does your day end?"
      hint="Set your end-of-day time first. Next, you will clear The Drop before choosing Counter and ATM items for today."
      pending={pending}
      onSubmit={submit}
      submitLabel="NEXT"
    >
      <div className="mt-2">
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

function DropStep({
  dropItems,
  boxes,
  energies,
  onNext,
}: {
  dropItems: Item[];
  boxes: Box[];
  energies: EnergyType[];
  onNext: () => void;
}) {
  const router = useRouter();
  useEffect(() => {
    function onAdvance() {
      router.refresh();
    }
    window.addEventListener("vault:drop-advance", onAdvance);
    return () => window.removeEventListener("vault:drop-advance", onAdvance);
  }, [router]);

  const hasDrop = dropItems.length > 0;

  return (
    <Step
      title="Clear The Drop first"
      hint={
        hasDrop
          ? "For each Drop item, choose ATM or Counter, set minutes and box/area, then send it (or delete it)."
          : "The Drop is clear. Continue to choose what is already on your Counter."
      }
      submitLabel="ON TO THE COUNTER →"
      onSubmit={onNext}
      submitDisabled={hasDrop}
    >
      {hasDrop ? (
        <div className="space-y-2">
          {dropItems.map((item) => (
            <DropTriageRow
              key={item.id}
              item={item}
              boxes={boxes}
              energies={energies}
            />
          ))}
          <p className="pt-2 text-[12px] text-ink-mute">
            Finish triaging or deleting all Drop items to continue.
          </p>
        </div>
      ) : (
        <p className="rounded-sm border border-dashed border-vault-line/60 px-4 py-5 text-center text-ink-mute">
          No pending items in The Drop.
        </p>
      )}
    </Step>
  );
}

// Step 3: Counter review.
function ReviewStep({
  stressors,
  timeSensitive,
  mustDo,
  otherAdmin,
  onNext,
}: {
  stressors: Item[];
  timeSensitive: Item[];
  mustDo: Item[];
  otherAdmin: Item[];
  onNext: () => void;
}) {
  const total =
    stressors.length + timeSensitive.length + mustDo.length + otherAdmin.length;
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
      <Group label="Everything else" tone="brass">
        {otherAdmin.length === 0 ? <Empty /> : otherAdmin.map((it) => <Row key={it.id} item={it} />)}
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

// Step 4: ATM box-first withdrawals.
function AtmStep({
  atm,
  onFinish,
}: {
  atm: Item[];
  onFinish: () => void;
}) {
  const categories = Array.from(
    new Set(
      atm
        .map((item) => item.category?.trim())
        .filter((category): category is string => Boolean(category)),
    ),
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(
    categories[0] ?? "",
  );
  const visible =
    selectedCategory.length > 0
      ? atm.filter((item) => item.category === selectedCategory)
      : [];
  const groups = new Map<string, Item[]>();
  for (const it of visible) {
    const k = (it.category ?? "Pull") as string;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(it);
  }
  return (
    <Step
      title="Withdraw anything from the ATM?"
      hint="Choose a box first, then mark ATM tasks for today."
      submitLabel="BUILD THE DAY"
      onSubmit={onFinish}
    >
      {categories.length === 0 ? (
        <p className="rounded-sm border border-dashed border-vault-line/60 px-4 py-6 text-center text-ink-mute">
          No ATM boxes found yet.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={clsx(
                  "rounded-sm border px-3 py-2 text-[12px] transition",
                  category === selectedCategory
                    ? "border-brass bg-brass/10 text-brass-bright"
                    : "border-vault-line/60 text-ink-mute hover:border-brass/40 hover:text-brass",
                )}
              >
                {category}
              </button>
            ))}
          </div>
          {[...groups.entries()].map(([cat, rows]) => (
            <div key={cat} className="mt-5">
              <h3 className="eyebrow">— {cat.toLowerCase()} —</h3>
              <div className="mt-2 space-y-2">
                {rows.map((it) => (
                  <AtmRow key={it.id} item={it} />
                ))}
              </div>
            </div>
          ))}
        </>
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
  submitDisabled = false,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
  onSubmit: () => void;
  submitLabel?: string;
  pending?: boolean;
  submitDisabled?: boolean;
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
          disabled={pending || submitDisabled}
          className="brass-button px-8 py-3 font-mono text-[10px] tracking-[0.24em] text-[#2a1c08] disabled:opacity-50"
        >
          {pending ? "SAVING…" : submitLabel}
        </button>
      </div>
    </div>
  );
}

