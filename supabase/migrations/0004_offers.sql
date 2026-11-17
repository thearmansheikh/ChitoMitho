-- Offers shown on the home page as coupon tickets. A row can carry an optional promo code.
create table offers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  title_ne text,
  body text,
  body_ne text,
  code text unique check (code is null or code = upper(code)),
  min_order_npr numeric(10, 2) check (min_order_npr is null or min_order_npr >= 0),
  starts_on date,
  ends_on date,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table offers enable row level security;

-- Visitors see only active offers inside their dates (Nepal date).
create policy offers_public_read on offers for select to anon, authenticated
  using (
    is_active
    and (starts_on is null or starts_on <= (now() at time zone 'Asia/Kathmandu')::date)
    and (ends_on is null or ends_on >= (now() at time zone 'Asia/Kathmandu')::date)
  );

create policy offers_admin_all on offers for all to authenticated using (is_admin()) with check (is_admin());

-- A switched-off example so the team can edit and turn it on. Nothing is promised to customers until then.
insert into offers (title, title_ne, body, body_ne, code, is_active, sort_order)
values (
  'Free delivery on your first order',
  'पहिलो अर्डरमा निःशुल्क डेलिभरी',
  'Order on the website and mention the code on WhatsApp.',
  'वेबसाइटबाट अर्डर गर्नुहोस् र व्हाट्सएपमा कोड भन्नुहोस्।',
  'FIRST',
  false,
  1
);
