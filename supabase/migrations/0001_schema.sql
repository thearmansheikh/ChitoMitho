-- Chitto Mitho: schema, RLS and storage

create extension if not exists "pgcrypto";

-- ───────── Enums ─────────
create type place_type as enum ('food', 'grocery', 'liquor', 'gifts');
create type area_group as enum ('dharan', 'itahari', 'biratnagar', 'nearby');

-- ───────── Admins ─────────
-- Only users listed here are admins. Sign-ups should also be disabled in
-- Supabase Auth settings; create team users from the dashboard, then add them
-- with:  insert into admins (user_id) select id from auth.users where email = '...';
create table admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

-- ───────── Tables ─────────
create table places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_ne text,
  slug text not null unique,
  type place_type not null,
  logo_url text,
  description text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references places (id) on delete cascade,
  name text not null,
  name_ne text,
  sort_order int not null default 0
);
create index categories_place_idx on categories (place_id);

create table items (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references places (id) on delete cascade,
  category_id uuid references categories (id) on delete set null,
  name text not null,
  name_ne text,
  description text,
  price_npr numeric(10, 2) not null check (price_npr >= 0),
  image_url text,
  is_available boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index items_place_idx on items (place_id);
create index items_category_idx on items (category_id);

create table areas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_ne text,
  area_group area_group not null,
  is_active boolean not null default true,
  sort_order int not null default 0
);

-- Single-row settings table (id is always 1)
create table settings (
  id int primary key default 1 check (id = 1),
  whatsapp_number text not null,
  phone_numbers text[] not null default '{}',
  open_time time not null default '10:00',
  close_time time not null default '22:00',
  timezone text not null default 'Asia/Kathmandu',
  orders_paused boolean not null default false,
  pause_message text,
  announcement text,
  liquor_age_text text
);

-- Counts only; never store customer name or phone here.
create table order_clicks (
  id uuid primary key default gen_random_uuid(),
  service text not null check (service in ('food', 'grocery', 'liquor', 'gifts', 'parcel', 'anything')),
  place_id uuid references places (id) on delete set null,
  items_total_npr numeric(10, 2),
  area_id uuid references areas (id) on delete set null,
  created_at timestamptz not null default now()
);
create index order_clicks_created_idx on order_clicks (created_at desc);

-- ───────── Row Level Security ─────────
alter table admins enable row level security;
alter table places enable row level security;
alter table categories enable row level security;
alter table items enable row level security;
alter table areas enable row level security;
alter table settings enable row level security;
alter table order_clicks enable row level security;

-- Admins table: an admin can see only their own row; no client writes.
create policy admins_self_read on admins for select to authenticated using (user_id = auth.uid());

-- Public read
create policy places_public_read on places for select to anon, authenticated using (is_active);
create policy categories_public_read on categories for select to anon, authenticated
  using (exists (select 1 from places p where p.id = place_id and p.is_active));
create policy items_public_read on items for select to anon, authenticated
  using (is_available and exists (select 1 from places p where p.id = place_id and p.is_active));
create policy areas_public_read on areas for select to anon, authenticated using (is_active);
create policy settings_public_read on settings for select to anon, authenticated using (true);

-- Public insert on order_clicks only
create policy order_clicks_public_insert on order_clicks for insert to anon, authenticated with check (true);

-- Admin full access (also lets admins read inactive/sold-out rows and order_clicks)
create policy places_admin_all on places for all to authenticated using (is_admin()) with check (is_admin());
create policy categories_admin_all on categories for all to authenticated using (is_admin()) with check (is_admin());
create policy items_admin_all on items for all to authenticated using (is_admin()) with check (is_admin());
create policy areas_admin_all on areas for all to authenticated using (is_admin()) with check (is_admin());
create policy settings_admin_all on settings for all to authenticated using (is_admin()) with check (is_admin());
create policy order_clicks_admin_all on order_clicks for all to authenticated using (is_admin()) with check (is_admin());

-- ───────── Storage ─────────
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy media_public_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'media');
create policy media_admin_write on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and is_admin());
create policy media_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'media' and is_admin());
create policy media_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'media' and is_admin());
