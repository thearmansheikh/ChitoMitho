-- Holiday closures: a date range when the shop does not take orders (festivals, holidays, rest days).
-- On those dates the site behaves as if orders are paused, then reopens by itself the day after.
create table closures (
  id uuid primary key default gen_random_uuid(),
  starts_on date not null,
  ends_on date not null,
  reason text not null,
  message text,
  message_ne text,
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);

alter table closures enable row level security;

-- Visitors only need to read the closures; only admins change them.
create policy closures_public_read on closures for select to anon, authenticated using (true);
create policy closures_admin_all on closures for all to authenticated using (is_admin()) with check (is_admin());
