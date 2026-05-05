"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { toast } from "sonner";
import { formatEndOfDay12h, parseTimeOnDate } from "@/lib/daily-plan";
import { saveDayInputsPartial, applyAtmBoxBudgets } from "@/lib/actions";
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
    },
    {
      label: "Continue",
      group: "Build day",
      options: { enabled: step === 3 },
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
    let hoursAvailable: number;
    try {
      normalizedEnd = formatEndOfDay12h(endOfDay.trim(), date);
      const end = parseTimeOnDate(normalizedEnd, date);
      const ms = end.getTime() - Date.now();
      hoursAvailable = Math.round(Math.max(0, Math.min(24, ms / 3_600_000)) * 100) / 100;
    } catch {
      toast.error("Couldn’t read that time — try 4:30 PM.");
      return;
    }
    startTransition(async () => {
      try {
        await saveDayInputsPartial({
          date,
          hours_available: hoursAvailable,
          end_of_day: normalizedEnd,
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
  inputs,
  onFinish,
}: {
  atm: Item[];
  inputs: DayInputs;
  onFinish: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const categories = Array.from(
    new Set(
      atm
        .map((item) => item.category?.trim())
        .filter((category): category is string => Boolean(category)),
    ),
  );
  const [selected, setSelected] = useState<string[]>(categories.slice(0, 1));
  const [hoursByCategory, setHoursByCategory] = useState<Record<string, string>>(
    () =>
      categories.reduce(
        (acc, c) => ({
          ...acc,
          [c]:
            c === categories[0]
              ? String(Math.max(0, Math.round(inputs.hoursAvailable * 100) / 100))
              : "0",
        }),
        {} as Record<string, string>,
      ),
  );

  function toggleCategory(category: string) {
    setSelected((prev) => {
      const exists = prev.includes(category);
      if (exists) return prev.filter((c) => c !== category);
      if (prev.length >= 2) return prev;
      const next = [...prev, category];
      // Default split: evenly divide available hours when 2 boxes selected.
      if (next.length === 2) {
        const each = (inputs.hoursAvailable / 2).toFixed(2);
        setHoursByCategory((h) => ({ ...h, [next[0]]: each, [next[1]]: each }));
      }
      return next;
    });
  }

  function estimateFill(category: string, hours: number) {
    const budget = Math.max(0, Math.round(hours * 60));
    const items = atm
      .filter((item) => item.category === category && (item.minutes ?? 0) > 0)
      .sort((a, b) => {
        const ao = a.atmOrder ?? Number.MAX_SAFE_INTEGER;
        const bo = b.atmOrder ?? Number.MAX_SAFE_INTEGER;
        return ao === bo ? a.createdAt.localeCompare(b.createdAt) : ao - bo;
      });
    let used = 0;
    let picked = 0;
    for (const it of items) {
      const m = it.minutes ?? 0;
      if (m <= 0) continue;
      if (used + m > budget) continue;
      used += m;
      picked += 1;
      if (used >= budget) break;
    }
    return { used, picked };
  }

  const totalAllocated = selected.reduce(
    (sum, c) => sum + Number(hoursByCategory[c] || 0),
    0,
  );

  function submit() {
    if (selected.length === 0) {
      toast.error("Pick at least one ATM box.");
      return;
    }
    const payload = selected.map((category) => ({
      category,
      hours: Number(hoursByCategory[category] || 0),
    }));
    if (!payload.some((p) => p.hours > 0)) {
      toast.error("Set at least one box budget above 0 hours.");
      return;
    }
    startTransition(async () => {
      try {
        await applyAtmBoxBudgets(payload);
        onFinish();
      } catch (e: any) {
        toast.error(e?.message ?? "Couldn't apply ATM box budgets.");
      }
    });
  }

  return (
    <Step
      title="Pick 1-2 ATM boxes"
      hint="Choose up to two boxes, set hours for each, then we'll auto-fill tasks in block order from those boxes."
      submitLabel="BUILD THE DAY"
      onSubmit={submit}
      pending={pending}
    >
      {categories.length === 0 ? (
        <p className="rounded-sm border border-dashed border-vault-line/60 px-4 py-6 text-center text-ink-mute">
          No ATM boxes found yet.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => toggleCategory(category)}
                className={clsx(
                  "rounded-sm border px-3 py-2 text-[12px] transition",
                  selected.includes(category)
                    ? "border-brass bg-brass/10 text-brass-bright"
                    : "border-vault-line/60 text-ink-mute hover:border-brass/40 hover:text-brass",
                )}
              >
                {category}
              </button>
            ))}
          </div>

          {selected.length > 0 && (
            <div className="space-y-3">
              {selected.map((category) => {
                const hours = Number(hoursByCategory[category] || 0);
                const { used, picked } = estimateFill(category, hours);
                return (
                  <div
                    key={category}
                    className="rounded-sm border border-vault-line/60 bg-vault-panel/40 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-mono text-[11px] tracking-wider text-ink">
                        {category}
                      </p>
                      <label className="flex items-center gap-2 font-mono text-[10px] text-ink-mute">
                        HOURS
                        <input
                          type="number"
                          min={0}
                          max={24}
                          step={0.25}
                          value={hoursByCategory[category] ?? "0"}
                          onChange={(e) =>
                            setHoursByCategory((h) => ({
                              ...h,
                              [category]: e.target.value,
                            }))
                          }
                          className="w-20 rounded-sm border border-vault-line bg-vault-bg/60 px-2 py-1 text-right text-[11px] text-ink outline-none focus:border-brass"
                        />
                      </label>
                    </div>
                    <p className="mt-2 text-[12px] text-ink-dim">
                      Estimated fill: {picked} task{picked === 1 ? "" : "s"} ·{" "}
                      {used} min
                    </p>
                  </div>
                );
              })}
              <div className="rounded-sm border border-vault-line/50 bg-vault-bg/30 px-3 py-2 text-[12px] text-ink-dim">
                Total allocated: {totalAllocated.toFixed(2)}h
                {totalAllocated > inputs.hoursAvailable && (
                  <span className="text-rust">
                    {" "}
                    (above available {inputs.hoursAvailable.toFixed(2)}h)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Step>
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

