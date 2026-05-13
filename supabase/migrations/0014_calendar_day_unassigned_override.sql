-- Allow an explicit "no project" override for a single day. With box_key
-- nullable, an override row with NULL means "this day is intentionally
-- off/unassigned" — distinct from no override row at all (which inherits
-- from the week).

alter table calendar_day_overrides
  alter column box_key drop not null;
