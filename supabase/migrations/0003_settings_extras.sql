-- Settings: sealed flag persisted across refreshes.
alter table settings add column if not exists sealed boolean default false;
update settings set sealed = false where sealed is null;
alter table settings alter column sealed set not null;
