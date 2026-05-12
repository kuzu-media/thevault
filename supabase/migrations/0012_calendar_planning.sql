-- Calendar planning: which project (box) each week is set to, plus optional
-- per-day overrides. Pure planning data — doesn't affect Today's schedule.
--
-- Storage shape: one row per week (week_start = Sunday) for the "this whole
-- week is QCOM" assignment, plus an exception row per overridden date. To
-- read a day: take the override box_key if it exists, else the week's
-- box_key, else nothing. This way changing a week's project flows through
-- to every non-overridden day automatically.

create table if not exists calendar_week_assignments (
  vault_id uuid not null references vaults(id) on delete cascade,
  week_start date not null,
  box_key text not null,
  created_at timestamptz not null default now(),
  modified_at timestamptz not null default now(),
  primary key (vault_id, week_start)
);

create table if not exists calendar_day_overrides (
  vault_id uuid not null references vaults(id) on delete cascade,
  date date not null,
  box_key text not null,
  created_at timestamptz not null default now(),
  modified_at timestamptz not null default now(),
  primary key (vault_id, date)
);

alter table calendar_week_assignments enable row level security;
alter table calendar_day_overrides enable row level security;

drop policy if exists "calendar_week_assignments: vault members" on calendar_week_assignments;
drop policy if exists "calendar_day_overrides: vault members" on calendar_day_overrides;

create policy "calendar_week_assignments: vault members" on calendar_week_assignments for all
  using (exists (
    select 1 from vault_members vm
    where vm.vault_id = calendar_week_assignments.vault_id and vm.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from vault_members vm
    where vm.vault_id = calendar_week_assignments.vault_id and vm.user_id = auth.uid()
  ));

create policy "calendar_day_overrides: vault members" on calendar_day_overrides for all
  using (exists (
    select 1 from vault_members vm
    where vm.vault_id = calendar_day_overrides.vault_id and vm.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from vault_members vm
    where vm.vault_id = calendar_day_overrides.vault_id and vm.user_id = auth.uid()
  ));

create index if not exists calendar_week_assignments_vault_week_idx
  on calendar_week_assignments (vault_id, week_start);
create index if not exists calendar_day_overrides_vault_date_idx
  on calendar_day_overrides (vault_id, date);
