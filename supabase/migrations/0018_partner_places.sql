-- 1. What to do with a place that has no menu yet: show it with a "Menu coming soon" badge, or hide it.
alter table settings add column places_without_menu text not null default 'badge'
  check (places_without_menu in ('badge', 'hide'));

-- 2. The eight partner logos shown on the home page become real places, so each logo opens a page.
--    Names and descriptions come only from what is written on their logos. No menus or prices are invented.
insert into places (name, name_ne, slug, type, logo_url, description, is_active, sort_order)
select v.name, v.name_ne, v.slug, v.type::place_type, '/images/partners/' || v.slug || '.webp', v.description, true, v.sort_order
from (values
  ('Anzee''s Cafe & Bakery',  null,                'anzees-cafe-bakery',   'food',  'Cafe & Bakery',            2),
  ('The Cake Palace',          null,                'the-cake-palace',      'food',  'Bakery and coffee shop',   3),
  ('SAM Cafe & Restro',        null,                'sam-cafe-restro',      'food',  'Cafe & restro',            4),
  ('Youberry Restaurant',      null,                'youberry-restaurant',  'food',  'Restaurant',               5),
  ('Circle Café & Bar',        null,                'circle-cafe-bar',      'food',  'Café',                     6),
  ('Tiffin by Saze',           null,                'tiffin-by-saze',       'food',  'Tiffin by Saze',           7),
  ('Swad Restro',              'स्वाद रेस्ट्रो',     'swad-restro',          'food',  'Restro',                   8),
  ('Sweet Treats',             null,                'sweet-treats',         'gifts', 'Bakery, cake and gifts',   2)
) as v(name, name_ne, slug, type, description, sort_order)
where not exists (select 1 from places p where p.slug = v.slug);
