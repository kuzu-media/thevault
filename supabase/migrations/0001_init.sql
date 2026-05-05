-- The Vault — initial schema
-- Single user (Tracy). RLS allows access only to authenticated rows.

create extension if not exists "pgcrypto";

-- Items: every task, idea, log entry, note row across the vault.
create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  box text not null,
  title text not null,
  area text,
  minutes int,
  urgent boolean not null default false,
  must boolean not null default false,
  should boolean not null default false,
  today_order int,
  atm_order int,
  energy text,
  category text,
  potential int check (potential between 1 and 5),
  person text,
  tag text,
  notes text,
  body text,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  actual_start timestamptz,
  actual_end timestamptz,
  state text,
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  modified_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists items_user_box_idx on items (user_id, box) where deleted_at is null;
create index if not exists items_user_today_idx on items (user_id, today_order) where deleted_at is null;
create index if not exists items_user_scheduled_idx on items (user_id, scheduled_start) where deleted_at is null;

-- Settings: one row per user.
create table if not exists settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stressor_anchor_minutes int not null default 91,
  default_end_of_day text not null default '16:30',
  default_hours numeric not null default 7,
  capture_token text,
  show_annual_budget boolean not null default false,
  annual_hours int not null default 500,
  boxes jsonb not null default '[]'::jsonb,
  modified_at timestamptz not null default now()
);

-- Day inputs: Tracy's 5 morning answers, one row per day.
create table if not exists day_inputs (
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  hours_available numeric not null,
  creative int not null check (creative between 1 and 5),
  prob_solv int not null check (prob_solv between 1 and 5),
  tie_break text not null,
  end_of_day text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, date)
);

-- Capture log: every Apple Shortcut / Mail Slot deposit.
create table if not exists captures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  raw text not null,
  source text not null,
  created_at timestamptz not null default now(),
  item_id uuid references items(id) on delete set null
);

alter table items enable row level security;
alter table settings enable row level security;
alter table day_inputs enable row level security;
alter table captures enable row level security;

create policy "items: own rows" on items for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "settings: own row" on settings for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "day_inputs: own rows" on day_inputs for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "captures: own rows" on captures for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Auto-stamp modified_at on items / settings.
create or replace function tick_modified_at() returns trigger as $$
begin
  new.modified_at = now();
  return new;
end;
$$ language plpgsql;

create trigger items_modified before update on items
  for each row execute function tick_modified_at();
create trigger settings_modified before update on settings
  for each row execute function tick_modified_at();
