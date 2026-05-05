-- Google Calendar → Drop: OAuth refresh tokens (service-role only) + settings row per vault.

create table if not exists google_calendar_secrets (
  vault_id uuid primary key references vaults(id) on delete cascade,
  refresh_token text not null
);

alter table google_calendar_secrets enable row level security;
-- No policies: JWT clients cannot read OAuth secrets; service_role bypasses RLS.

create table if not exists google_calendar_connections (
  vault_id uuid primary key references vaults(id) on delete cascade,
  calendar_id text not null default 'primary',
  timezone text not null default 'America/Los_Angeles',
  connected_by uuid references auth.users(id) on delete set null,
  connected_at timestamptz not null default now(),
  modified_at timestamptz not null default now()
);

create index if not exists google_calendar_connections_modified_idx
  on google_calendar_connections (modified_at);

create table if not exists calendar_drop_imports (
  vault_id uuid not null references vaults(id) on delete cascade,
  google_event_id text not null,
  imported_for_date date not null,
  item_id uuid not null references items(id) on delete cascade,
  primary key (vault_id, google_event_id, imported_for_date)
);

create index if not exists calendar_drop_imports_vault_date_idx
  on calendar_drop_imports (vault_id, imported_for_date);

alter table google_calendar_connections enable row level security;
alter table calendar_drop_imports enable row level security;

-- Idempotent re-run
drop policy if exists "google_calendar_connections: vault members select" on google_calendar_connections;
drop policy if exists "google_calendar_connections: vault members insert" on google_calendar_connections;
drop policy if exists "google_calendar_connections: vault members update" on google_calendar_connections;
drop policy if exists "google_calendar_connections: vault members delete" on google_calendar_connections;

create policy "google_calendar_connections: vault members select"
  on google_calendar_connections for select
  using (exists (
    select 1 from vault_members vm
    where vm.vault_id = google_calendar_connections.vault_id and vm.user_id = auth.uid()
  ));

create policy "google_calendar_connections: vault members insert"
  on google_calendar_connections for insert
  with check (exists (
    select 1 from vault_members vm
    where vm.vault_id = google_calendar_connections.vault_id and vm.user_id = auth.uid()
  ));

create policy "google_calendar_connections: vault members update"
  on google_calendar_connections for update
  using (exists (
    select 1 from vault_members vm
    where vm.vault_id = google_calendar_connections.vault_id and vm.user_id = auth.uid()
  ));

create policy "google_calendar_connections: vault members delete"
  on google_calendar_connections for delete
  using (exists (
    select 1 from vault_members vm
    where vm.vault_id = google_calendar_connections.vault_id and vm.user_id = auth.uid()
  ));
