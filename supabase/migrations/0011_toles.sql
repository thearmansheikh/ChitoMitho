-- Toles (neighbourhoods / streets) offered as suggestions while a customer types their address.
-- Each can belong to one area (for example a ward, Dharan-9) or to none, meaning "suggest it everywhere".
-- The team adds them in Admin > Toles. Customers can always type any tole that is not listed.
create table toles (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  name_ne text,
  area_id uuid references areas (id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- The same tole name cannot be listed twice for the same area.
create unique index toles_unique_name_per_area
  on toles (lower(btrim(name)), coalesce(area_id, '00000000-0000-0000-0000-000000000000'::uuid));

alter table toles enable row level security;

create policy toles_public_read on toles for select to anon, authenticated using (is_active);
create policy toles_admin_all on toles for all to authenticated using (is_admin()) with check (is_admin());
