-- Sample data. Replace with real partners, menus and prices from the admin page.

insert into settings (id, whatsapp_number, phone_numbers, open_time, close_time, liquor_age_text)
values (1, '9805338257', array['9705468562', '9805338257'], '10:00', '22:00',
        'You must be 18 or older. ID will be checked at the door.')
on conflict (id) do nothing;

insert into areas (name, name_ne, area_group, sort_order) values
  ('Bhanu Chowk', 'भानु चोक', 'dharan', 1),
  ('BP Chowk', 'बीपी चोक', 'dharan', 2),
  ('Putali Line', 'पुतली लाइन', 'dharan', 3),
  ('Bajhogara', 'बझोगरा', 'dharan', 4),
  ('Itahari', 'इटहरी', 'itahari', 1),
  ('Biratnagar', 'विराटनगर', 'biratnagar', 1),
  ('Duhabi', 'दुहबी', 'nearby', 1),
  ('Inaruwa', 'इनरुवा', 'nearby', 2);

-- Places
insert into places (name, slug, type, description, sort_order) values
  ('Olive Cafe', 'olive-cafe', 'food', 'Momo, coffee and snacks', 1),
  ('Circle Cafe', 'circle-cafe', 'food', 'Burgers, pizza and drinks', 2),
  ('Siblings', 'siblings', 'food', 'Meals and fast food', 3),
  ('Chitto Mitho Grocery', 'grocery', 'grocery', 'Daily groceries', 1),
  ('Chitto Mitho Drinks', 'drinks', 'liquor', 'Beer, wine and spirits (18+)', 1),
  ('Gifts & Flowers', 'gifts', 'gifts', 'Bouquets, cakes and gift sets', 1);

-- Categories
insert into categories (place_id, name, name_ne, sort_order)
select p.id, c.name, c.name_ne, c.sort_order
from places p
join (values
  ('olive-cafe', 'Momo', 'मोमो', 1),
  ('olive-cafe', 'Drinks', 'पेय', 2),
  ('circle-cafe', 'Burgers', 'बर्गर', 1),
  ('siblings', 'Meals', 'खाना', 1),
  ('grocery', 'Rice & Grains', 'चामल र अन्न', 1),
  ('grocery', 'Vegetables', 'तरकारी', 2),
  ('drinks', 'Beer', 'बियर', 1),
  ('gifts', 'Bouquets', 'गुच्छा', 1),
  ('gifts', 'Cakes', 'केक', 2)
) as c(slug, name, name_ne, sort_order) on c.slug = p.slug;

-- Items
insert into items (place_id, category_id, name, name_ne, price_npr, sort_order)
select p.id, cat.id, i.name, i.name_ne, i.price, i.sort_order
from (values
  ('olive-cafe', 'Momo', 'Chicken Momo', 'चिकेन मोमो', 250, 1),
  ('olive-cafe', 'Momo', 'Veg Momo', 'भेज मोमो', 200, 2),
  ('olive-cafe', 'Drinks', 'Cold Coffee', 'कोल्ड कफी', 180, 1),
  ('circle-cafe', 'Burgers', 'Chicken Burger', 'चिकेन बर्गर', 320, 1),
  ('siblings', 'Meals', 'Chicken Fried Rice', 'चिकेन फ्राइड राइस', 280, 1),
  ('grocery', 'Rice & Grains', 'Rice 5kg', 'चामल ५ केजी', 900, 1),
  ('grocery', 'Vegetables', 'Tomato 1kg', 'गोलभेडा १ केजी', 80, 1),
  ('drinks', 'Beer', 'Beer 650ml', 'बियर ६५० एमएल', 450, 1),
  ('gifts', 'Bouquets', 'Red Rose Bouquet', 'रातो गुलाफको गुच्छा', 1500, 1),
  ('gifts', 'Cakes', 'Chocolate Cake 1lb', 'चकलेट केक १ पाउन्ड', 1200, 1)
) as i(slug, cat_name, name, name_ne, price, sort_order)
join places p on p.slug = i.slug
join categories cat on cat.place_id = p.id and cat.name = i.cat_name;
