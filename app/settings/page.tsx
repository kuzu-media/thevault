import Link from "next/link";
import { DEFAULT_SETTINGS } from "@/lib/types";
import { getSettings } from "@/lib/data";
import { saveSettings, rotateCaptureToken } from "@/lib/actions";
import { CaptureTokenRow } from "@/components/capture-token-row";

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
    <div className="mx-auto max-w-[800px] px-10 py-8">
      <div className="eyebrow">— Settings —</div>
      <h1 className="serif-h mt-2 text-[40px] leading-tight">
        How the vault behaves.
      </h1>

      <div className="mt-3 flex flex-wrap gap-3 font-mono text-[10px] tracking-wider">
        <Link
          href="/settings"
          className="rounded-sm border border-brass bg-brass/10 px-3 py-1 text-brass"
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
          className="rounded-sm border border-vault-line px-3 py-1 text-ink-mute hover:border-brass/40 hover:text-brass"
        >
          BOXES
        </Link>
        <Link
          href="/settings/energies"
          className="rounded-sm border border-vault-line px-3 py-1 text-ink-mute hover:border-brass/40 hover:text-brass"
        >
          ENERGIES
        </Link>
      </div>

      <form action={saveSettings} className="mt-8 space-y-8">
        <Group title="The day">
          <Row
            label="Default hours"
            hint="Used when the day-inputs row hasn't been set yet."
          >
            <input
              type="number"
              step="0.5"
              min="0"
              max="24"
              name="default_hours"
              defaultValue={s.defaultHours}
              className="w-24 rounded-sm border border-vault-line bg-vault-panel/60 px-2 py-1 text-right font-mono text-[12px] text-brass outline-none focus:border-brass"
            />
          </Row>
          <Row label="Default end of day">
            <input
              type="text"
              name="default_end_of_day"
              defaultValue={s.defaultEndOfDay}
              placeholder="16:30"
              className="w-24 rounded-sm border border-vault-line bg-vault-panel/60 px-2 py-1 text-right font-mono text-[12px] text-brass outline-none focus:border-brass"
            />
          </Row>
          <Row
            label="Stressor anchor threshold"
            hint="Below this, admin anchors to end-of-day. At or above, admin runs first."
          >
            <input
              type="number"
              min="0"
              max="480"
              name="stressor_anchor_minutes"
              defaultValue={s.stressorAnchorMinutes}
              className="w-24 rounded-sm border border-vault-line bg-vault-panel/60 px-2 py-1 text-right font-mono text-[12px] text-brass outline-none focus:border-brass"
            />
          </Row>
        </Group>

        <Group title="Annual budget">
          <Row
            label="Show annual hours"
            hint="Tracy's manifesto: 500 hours of deep work a year."
          >
            <label className="inline-flex cursor-pointer items-center gap-2">
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
            <input
              type="number"
              min="0"
              max="8760"
              name="annual_hours"
              defaultValue={s.annualHours}
              className="w-24 rounded-sm border border-vault-line bg-vault-panel/60 px-2 py-1 text-right font-mono text-[12px] text-brass outline-none focus:border-brass"
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
      <div className="mt-3 divide-y divide-vault-line rounded-sm border border-vault-line bg-vault-panel/40">
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
    <div className="flex items-start justify-between gap-6 px-4 py-3">
      <div>
        <div className="text-ink">{label}</div>
        {hint && <div className="text-[12px] text-ink-mute">{hint}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}
