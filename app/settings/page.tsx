import Link from "next/link";
import { DEFAULT_SETTINGS } from "@/lib/types";
import { getSettings } from "@/lib/data";
import { saveSettings } from "@/lib/actions";
import { CaptureTokenRow } from "@/components/capture-token-row";
import { NumberField, TextInput } from "@/components/ui";

export default async function SettingsPage() {
  const row = await getSettings();
  const s = row
    ? {
        stressorAnchorMinutes: row.stressor_anchor_minutes,
        defaultEndOfDay: row.default_end_of_day,
        defaultHours: Number(row.default_hours),
        showAnnualBudget: !!row.show_annual_budget,
        annualHours: row.annual_hours,
      }
    : DEFAULT_SETTINGS;

  return (
    <div className="mx-auto max-w-[800px] px-4 py-8 md:px-10">
      <h1 className="serif-h text-[28px] leading-tight md:text-[36px]">
        Settings.
      </h1>
      <p className="mt-1 text-[12px] text-ink-mute">
        How the vault behaves. Tabs below for members, boxes, and energies.
      </p>

      <div className="mt-4 flex flex-wrap gap-2 font-mono text-[10px] tracking-wider">
        <Link
          href="/settings"
          className="rounded-sm border border-brass bg-brass/10 px-3 py-1.5 text-brass"
        >
          GENERAL
        </Link>
        <Link
          href="/settings/members"
          className="rounded-sm border border-vault-line px-3 py-1.5 text-ink-mute transition hover:border-brass/40 hover:text-brass"
        >
          MEMBERS
        </Link>
        <Link
          href="/settings/boxes"
          className="rounded-sm border border-vault-line px-3 py-1.5 text-ink-mute transition hover:border-brass/40 hover:text-brass"
        >
          BOXES
        </Link>
        <Link
          href="/settings/energies"
          className="rounded-sm border border-vault-line px-3 py-1.5 text-ink-mute transition hover:border-brass/40 hover:text-brass"
        >
          ENERGIES
        </Link>
      </div>

      <form action={saveSettings} className="mt-8 space-y-6">
        <Group title="The day">
          <Row
            label="Default hours"
            hint="Used when the day-inputs row hasn't been set yet."
          >
            <NumberField
              name="default_hours"
              defaultValue={s.defaultHours}
              step="0.5"
              min="0"
              max="24"
              unit="hrs"
              width="w-[88px]"
            />
          </Row>
          <Row
            label="Default end of day"
            hint="Anchor time the schedule lands at."
          >
            <TextInput
              name="default_end_of_day"
              defaultValue={s.defaultEndOfDay}
              placeholder="16:30"
              className="w-[88px] text-right font-mono"
            />
          </Row>
          <Row
            label="Stressor anchor threshold"
            hint="Below this, admin anchors to end-of-day. At or above, admin runs first."
          >
            <NumberField
              name="stressor_anchor_minutes"
              defaultValue={s.stressorAnchorMinutes}
              min="0"
              max="480"
              unit="min"
              width="w-[88px]"
            />
          </Row>
        </Group>

        <Group title="Annual budget">
          <Row
            label="Show annual hours"
            hint="500 hours of deep work a year."
          >
            <label className="inline-flex cursor-pointer select-none items-center gap-2">
              <input
                type="checkbox"
                name="show_annual_budget"
                defaultChecked={s.showAnnualBudget}
                className="h-4 w-4 accent-[#b5853a]"
              />
              <span className="font-mono text-[10px] tracking-wider text-brass">
                ON
              </span>
            </label>
          </Row>
          <Row label="Annual hours">
            <NumberField
              name="annual_hours"
              defaultValue={s.annualHours}
              min="0"
              max="8760"
              unit="hrs"
              width="w-[88px]"
            />
          </Row>
        </Group>

        <div className="flex justify-end">
          <button
            type="submit"
            className="brass-button px-6 py-2 font-mono text-[10px] tracking-[0.24em] text-[#2a1c08]"
          >
            SAVE
          </button>
        </div>
      </form>

      <div className="mt-12">
        <Group title="Capture (Apple Shortcut)">
          <CaptureTokenRow token={row?.capture_token ?? null} />
        </Group>
      </div>
    </div>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="eyebrow">— {title} —</h2>
      <div className="mt-3 divide-y divide-vault-line/60 rounded-sm border border-vault-line/60 bg-vault-panel/30">
        {children}
      </div>
    </section>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="text-ink">{label}</div>
        {hint && (
          <div className="mt-0.5 text-[12px] text-ink-mute">{hint}</div>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
