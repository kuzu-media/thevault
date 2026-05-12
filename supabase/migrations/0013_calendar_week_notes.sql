-- Per-week notes on the calendar planning surface. A week row can now exist
-- with a note only (no project), or a project only, or both. Reading: ignore
-- rows where both fields are empty.

alter table calendar_week_assignments
  add column if not exists note text;

alter table calendar_week_assignments
  alter column box_key drop not null;
