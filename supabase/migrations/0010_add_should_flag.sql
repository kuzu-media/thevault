-- Add a third Counter flag for "should" items.
alter table items
  add column if not exists should boolean not null default false;
