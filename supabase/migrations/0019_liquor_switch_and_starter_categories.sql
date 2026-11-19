-- Task 10: groceries, gifts and liquor structure.
-- 1. A switch for liquor (off until the shop is ready and licensed).
-- 2. Starter CATEGORIES only for groceries, gifts and liquor. No items and no prices are invented.
-- (The five placeholder items from the first seed are NOT touched here. See supabase/data/remove_placeholder_items.sql.)

alter table public.settings add column if not exists liquor_enabled boolean not null default false;

-- Make sure the three shelves exist (they do on the live site; this keeps a fresh database working too).
insert into public.places (name, slug, type, description, sort_order)
select v.name, v.slug, v.type::place_type, v.description, 1
from (values
  ('Chitto Mitho Grocery', 'grocery', 'grocery', 'Daily groceries'),
  ('Chitto Mitho Drinks',  'drinks',  'liquor',  'Beer, wine and spirits (18+)'),
  ('Gifts & Flowers',      'gifts',   'gifts',   'Bouquets, cakes and gift sets')
) as v(name, slug, type, description)
where not exists (select 1 from public.places p where p.slug = v.slug);

-- Starter categories. Existing ones keep their items; their order and Nepali name are tidied.
with wanted(slug, name, name_ne, sort_order) as (values
  ('grocery', 'Rice, Dal & Grains',      'चामल, दाल र अन्न',        1),
  ('grocery', 'Vegetables',              'तरकारी',                  2),
  ('grocery', 'Fruits',                  'फलफूल',                   3),
  ('grocery', 'Dairy & Eggs',            'दुग्धजन्य र अण्डा',       4),
  ('grocery', 'Meat & Fish',             'मासु र माछा',             5),
  ('grocery', 'Oil, Spices & Masala',    'तेल, मसला',               6),
  ('grocery', 'Noodles & Instant Food',  'नुडल्स र तयारी खाना',     7),
  ('grocery', 'Snacks & Biscuits',       'स्न्याक्स र बिस्कुट',     8),
  ('grocery', 'Drinks',                  'पेय पदार्थ',              9),
  ('grocery', 'Household',               'घरायसी सामान',            10),
  ('grocery', 'Personal Care',           'व्यक्तिगत सरसफाइ',        11),
  ('gifts',   'Cakes',                   'केक',                     1),
  ('gifts',   'Bouquets',                'गुच्छा',                  2),
  ('gifts',   'Chocolates & Sweets',     'चकलेट र मिठाई',           3),
  ('gifts',   'Gift Hampers',            'उपहार ह्याम्पर',          4),
  ('gifts',   'Balloons & Party',        'बेलुन र पार्टी सामग्री',  5),
  ('gifts',   'Others',                  'अन्य',                    6),
  ('drinks',  'Beer',                    'बियर',                    1),
  ('drinks',  'Whisky',                  'ह्विस्की',                2),
  ('drinks',  'Vodka',                   'भोद्का',                  3),
  ('drinks',  'Rum',                     'रम',                      4),
  ('drinks',  'Wine',                    'वाइन',                    5),
  ('drinks',  'Others',                  'अन्य',                    6)
),
upd as (
  update public.categories c
  set sort_order = w.sort_order, name_ne = coalesce(c.name_ne, w.name_ne)
  from wanted w
  join public.places p on p.slug = w.slug
  where c.place_id = p.id and lower(c.name) = lower(w.name)
  returning c.id
)
insert into public.categories (place_id, name, name_ne, sort_order)
select p.id, w.name, w.name_ne, w.sort_order
from wanted w
join public.places p on p.slug = w.slug
where not exists (select 1 from public.categories c where c.place_id = p.id and lower(c.name) = lower(w.name));
