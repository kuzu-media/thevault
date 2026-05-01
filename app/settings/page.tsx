import { DEFAULT_SETTINGS } from "@/lib/types";
import { getSettings } from "@/lib/data";

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
      <h1 className="serif-h mt-2 text-[40px] leading-tight">How the vault behaves.</h1>

      <Group title="The day">
        <Field label="Default hours" value={`${s.defaultHours} hrs`} />
        <Field label="Default end of day" value={s.defaultEndOfDay} />
        <Field
          label="Stressor anchor threshold"
          value={`${s.stressorAnchorMinutes} min`}
          hint="Below this, admin anchors to end-of-day. At or above, admin runs first."
        />
      </Group>

      <Group title="Annual budget">
        <Field
          label="Show annual hours"
          value={s.showAnnualBudget ? "On" : "Off"}
          hint="Tracy's manifesto: 500 hours of deep work a year."
        />
        <Field label="Annual hours" value={`${s.annualHours} hrs`} />
      </Group>

      <Group title="Capture">
        <Field
          label="Capture token"
          value={row?.capture_token ? "•••• set" : "Not set"}
          hint="The bearer token the iPhone Shortcut sends to /api/capture."
        />
      </Group>
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
    <section className="mt-8">
      <h2 className="eyebrow">— {title} —</h2>
      <div className="mt-3 divide-y divide-vault-line rounded-sm border border-vault-line bg-vault-panel/40">
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-6 px-4 py-3">
      <div>
        <div className="text-ink">{label}</div>
        {hint && <div className="text-[12px] text-ink-mute">{hint}</div>}
      </div>
      <div className="font-mono text-[12px] text-brass">{value}</div>
    </div>
  );
}
