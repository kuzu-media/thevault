-- Tracy's energies are user-editable. Each energy has a destination
-- (TILL or DRAWER) — that's what decides where a Drop item lands.

alter table settings
  add column if not exists energies jsonb not null default '[]'::jsonb;
