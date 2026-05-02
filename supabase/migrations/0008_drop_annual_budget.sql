-- Annual budget feature was a Cal-Newport-flavored holdover and isn't
-- generic. Removed from the UI and types; drop the columns so the
-- settings table stays honest.
alter table settings
  drop column if exists show_annual_budget,
  drop column if exists annual_hours;
