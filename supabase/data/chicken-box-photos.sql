-- Adds the dish photos (public/images/menu/the-chicken-box/) to The Chicken Box menu items.
-- Run after chicken-box.sql. Safe to run again.
with p as (select id from places where slug = 'the-chicken-box'),
m(cat, file) as (values
  ('Hot & Crispy Leg Pic','leg'),('Hot & Crispy Chest','chest'),('Crispy Hot Wings','wings'),
  ('Crispy Boneless Strips','strips'),('Crispy Chicken Popcorn','popcorn'),('Chicken Nuggets','nuggets'),
  ('Smoky Grilled Chicken','grilled'),('Burger','burger'),('Pizza','pizza'),('Maxican Tacos','tacos'),
  ('Dips','dips'),('French Fries','fries'))
update items i set image_url = '/images/menu/the-chicken-box/' || m.file || '.webp'
from categories c, m, p
where i.category_id = c.id and c.place_id = p.id and c.name = m.cat;

with p as (select id from places where slug = 'the-chicken-box')
update items i set image_url = '/images/menu/the-chicken-box/' ||
  case i.name when 'TCB Special Bucket' then 'bucket' else 'combo-' || substring(i.name from '[0-9]+$') end || '.webp'
from p
where i.place_id = p.id and (i.name like 'Combo - %' or i.name = 'TCB Special Bucket');
