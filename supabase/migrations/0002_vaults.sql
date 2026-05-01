-- Multi-user vaults: each vault is shared by a small set of people.
-- Items / settings / day_inputs / captures key off vault_id; user_id stays
-- as a "created_by" audit field. RLS becomes "are you a member of this vault."

create table if not exists vaults (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'The Vault',
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create type vault_role as enum ('owner', 'editor');

create table if not exists vault_members (
  vault_id uuid references vaults(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role vault_role not null default 'editor',
  created_at timestamptz not null default now(),
  primary key (vault_id, user_id)
);

alter table vaults enable row level security;
alter table vault_members enable row level security;

-- See: a row is visible if you're a member.
create policy "vaults: members can read" on vaults for select
  using (exists (
    select 1 from vault_members vm
    where vm.vault_id = vaults.id and vm.user_id = auth.uid()
  ));

create policy "vaults: owner can update/delete" on vaults for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "vaults: any authed user can create" on vaults for insert
  with check (owner_id = auth.uid());

create policy "vault_members: see your own membership" on vault_members for select
  using (user_id = auth.uid()
    or exists (
      select 1 from vaults v
      where v.id = vault_members.vault_id and v.owner_id = auth.uid()
    ));

create policy "vault_members: owner can manage" on vault_members for all
  using (exists (
    select 1 from vaults v
    where v.id = vault_members.vault_id and v.owner_id = auth.uid()
  ))
  with check (exists (
    select 1 from vaults v
    where v.id = vault_members.vault_id and v.owner_id = auth.uid()
  ));

-- Add vault_id to existing tables.
alter table items add column if not exists vault_id uuid references vaults(id) on delete cascade;
alter table day_inputs add column if not exists vault_id uuid references vaults(id) on delete cascade;
alter table captures add column if not exists vault_id uuid references vaults(id) on delete cascade;

-- Settings goes from per-user to per-vault.
alter table settings drop constraint if exists settings_pkey;
alter table settings add column if not exists vault_id uuid references vaults(id) on delete cascade;

-- Backfill: one vault per existing user, they become owner, all their rows
-- get pointed at it. Idempotent.
do $$
declare
  u record;
  new_vault_id uuid;
begin
  for u in select id from auth.users loop
    -- Skip users who already have a vault.
    if not exists (select 1 from vaults where owner_id = u.id) then
      insert into vaults (name, owner_id)
        values ('The Vault', u.id)
        returning id into new_vault_id;
      insert into vault_members (vault_id, user_id, role)
        values (new_vault_id, u.id, 'owner');
      update items set vault_id = new_vault_id where user_id = u.id and vault_id is null;
      update day_inputs set vault_id = new_vault_id where user_id = u.id and vault_id is null;
      update captures set vault_id = new_vault_id where user_id = u.id and vault_id is null;
      update settings set vault_id = new_vault_id where user_id = u.id and vault_id is null;
    end if;
  end loop;
end $$;

-- Drop old user_id-based RLS policies BEFORE altering the columns they
-- reference (Postgres won't drop a column with a dependent policy).
drop policy if exists "items: own rows" on items;
drop policy if exists "settings: own row" on settings;
drop policy if exists "day_inputs: own rows" on day_inputs;
drop policy if exists "captures: own rows" on captures;

-- Now make vault_id required on items.
alter table items alter column vault_id set not null;

-- Settings becomes vault-keyed.
alter table settings alter column vault_id set not null;
alter table settings add primary key (vault_id);
alter table settings drop column user_id;

-- day_inputs becomes vault-keyed (one row per vault per date).
alter table day_inputs drop constraint if exists day_inputs_pkey;
alter table day_inputs alter column vault_id set not null;
alter table day_inputs add primary key (vault_id, date);
alter table day_inputs drop column user_id;

create policy "items: vault members" on items for all
  using (exists (
    select 1 from vault_members vm
    where vm.vault_id = items.vault_id and vm.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from vault_members vm
    where vm.vault_id = items.vault_id and vm.user_id = auth.uid()
  ));

create policy "settings: vault members" on settings for all
  using (exists (
    select 1 from vault_members vm
    where vm.vault_id = settings.vault_id and vm.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from vault_members vm
    where vm.vault_id = settings.vault_id and vm.user_id = auth.uid()
  ));

create policy "day_inputs: vault members" on day_inputs for all
  using (exists (
    select 1 from vault_members vm
    where vm.vault_id = day_inputs.vault_id and vm.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from vault_members vm
    where vm.vault_id = day_inputs.vault_id and vm.user_id = auth.uid()
  ));

create policy "captures: vault members" on captures for all
  using (exists (
    select 1 from vault_members vm
    where vm.vault_id = captures.vault_id and vm.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from vault_members vm
    where vm.vault_id = captures.vault_id and vm.user_id = auth.uid()
  ));

-- Helper: get the user's current vault. Returns the only vault if they have
-- one, or the most recently joined one otherwise. (App can override with a
-- cookie later for multi-vault users.)
create or replace function current_vault_id() returns uuid
  language sql stable security invoker
as $$
  select vm.vault_id
  from vault_members vm
  where vm.user_id = auth.uid()
  order by vm.created_at desc
  limit 1;
$$;

create index if not exists items_vault_idx on items (vault_id) where deleted_at is null;
