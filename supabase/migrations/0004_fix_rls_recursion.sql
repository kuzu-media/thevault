-- The original policies on vaults and vault_members reference each other,
-- which triggers Postgres's "infinite recursion detected in policy" error
-- the moment we read or write either table from an authed session.
--
-- Fix: pull the membership check into a SECURITY DEFINER function. It runs
-- with the function-owner's privileges, so it doesn't re-trigger RLS, which
-- breaks the cycle.

create or replace function public.is_vault_member(v uuid, u uuid default auth.uid())
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from vault_members where vault_id = v and user_id = u
  );
$$;

create or replace function public.is_vault_owner(v uuid, u uuid default auth.uid())
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from vaults where id = v and owner_id = u
  );
$$;

revoke all on function public.is_vault_member(uuid, uuid) from public;
revoke all on function public.is_vault_owner(uuid, uuid) from public;
grant execute on function public.is_vault_member(uuid, uuid) to authenticated;
grant execute on function public.is_vault_owner(uuid, uuid) to authenticated;

-- Replace the recursive policies on vaults / vault_members.
drop policy if exists "vaults: members can read" on vaults;
drop policy if exists "vaults: owner can update/delete" on vaults;
drop policy if exists "vaults: any authed user can create" on vaults;
drop policy if exists "vault_members: see your own membership" on vault_members;
drop policy if exists "vault_members: owner can manage" on vault_members;

create policy "vaults: members can read" on vaults for select
  using (public.is_vault_member(id));

create policy "vaults: owner can update" on vaults for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "vaults: owner can delete" on vaults for delete
  using (owner_id = auth.uid());

create policy "vaults: any authed user can create" on vaults for insert
  with check (owner_id = auth.uid());

-- vault_members: a user can see their own membership rows; an owner can see
-- and manage all rows for vaults they own. Both checks now go through the
-- security-definer functions so they don't recurse.
create policy "vault_members: read own or as owner" on vault_members for select
  using (user_id = auth.uid() or public.is_vault_owner(vault_id));

create policy "vault_members: insert as owner" on vault_members for insert
  with check (
    public.is_vault_owner(vault_id)
    -- Allow the very first row (owner adding themselves) too, since the
    -- vault was just created and is_vault_owner already returns true.
  );

create policy "vault_members: update as owner" on vault_members for update
  using (public.is_vault_owner(vault_id))
  with check (public.is_vault_owner(vault_id));

create policy "vault_members: delete as owner" on vault_members for delete
  using (public.is_vault_owner(vault_id));

-- Also rebuild the items / settings / day_inputs / captures policies on
-- top of is_vault_member, both for clarity and to short-circuit recursion
-- if any future schema reads from vault_members in a policy expression.
drop policy if exists "items: vault members" on items;
drop policy if exists "settings: vault members" on settings;
drop policy if exists "day_inputs: vault members" on day_inputs;
drop policy if exists "captures: vault members" on captures;

create policy "items: vault members" on items for all
  using (public.is_vault_member(vault_id))
  with check (public.is_vault_member(vault_id));

create policy "settings: vault members" on settings for all
  using (public.is_vault_member(vault_id))
  with check (public.is_vault_member(vault_id));

create policy "day_inputs: vault members" on day_inputs for all
  using (public.is_vault_member(vault_id))
  with check (public.is_vault_member(vault_id));

create policy "captures: vault members" on captures for all
  using (public.is_vault_member(vault_id))
  with check (public.is_vault_member(vault_id));
