-- User-facing name is "Documents"; column was added as `records` in 0007.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'settings'
      and column_name = 'records'
  ) then
    alter table public.settings rename column records to documents;
  end if;
end $$;
