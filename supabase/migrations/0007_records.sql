-- Records are user-configured, like boxes. They're text-first storage
-- categories (Notes, Measurements, Read & Research…) — distinct from the
-- task-shaped Boxes, separately editable from Settings → Records.
alter table settings
  add column if not exists records jsonb not null default '[]'::jsonb;
