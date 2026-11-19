-- 1. A separate "unit / size" for items (Rice 5 kg, Beer 650 ml), so name, unit and price are shown apart.
alter table items add column unit text;

-- 2. Combo names read "Combo 4", not "Combo - 4" (which looked like a number run together with the next word).
update items set name = 'Combo ' || substring(name from '[0-9]+$') where name ~ '^Combo - [0-9]+$';

-- 3. Combo descriptions: normal capitals, one part per "+".
update items set description = case name
  when 'Combo 1'  then 'Veg Cheese Burger + Fries + Cold Drink + Mayo'
  when 'Combo 2'  then 'Chicken Patty Cheese Burger + Fries + Cold Drink + Mayo'
  when 'Combo 3'  then 'Cheese Zinger Burger + Fries + Cold Drink + Mayo'
  when 'Combo 4'  then '2 pc Crispy Chicken + Fries + Cold Drink + Mayo'
  when 'Combo 5'  then '4 pc Hot Wings + Fries + Cold Drink + Mayo'
  when 'Combo 6'  then '6 pc Boneless Strips + Large Popcorn + Fries + Cold Drink + 1 Dip'
  when 'Combo 7'  then '2 pc Chicken Patty Cheese Burger + 2 pc Crispy Legs + Fries + Cold Drink + Mayo'
  when 'Combo 8'  then '4 pc Hot & Crispy Legs + 4 pc Hot & Crispy Wings + Mayo'
  when 'Combo 9'  then '5 pc Hot Wings + 2 pc Signature Burger + Fries + Cold Drink + 1 Dip'
  when 'Combo 10' then '4 pc Crispy Fried Chicken + 4 pc Crispy Hot Wings + 6 pc Boneless Strips + 2 Dips + 2 Cold Drinks'
end
where name in ('Combo 1','Combo 2','Combo 3','Combo 4','Combo 5','Combo 6','Combo 7','Combo 8','Combo 9','Combo 10');

update items set description = '3 pc Hot & Crispy Legs + 3 pc Hot & Crispy Chest + 3 pc Hot & Crispy Wings + 8 pc Boneless Strips + Peri Peri Fries + 2 Cold Drinks + 2 Spicy Dips'
where name = 'TCB Special Bucket';

update items set description = 'No bun, all chicken pizza' where name = 'All New Chicken Chizza';

-- 4. The starter items that had the size inside the name.
update items set name = 'Rice',           unit = '5 kg'  where name = 'Rice 5kg';
update items set name = 'Tomato',         unit = '1 kg'  where name = 'Tomato 1kg';
update items set name = 'Beer',           unit = '650 ml' where name = 'Beer 650ml';
update items set name = 'Chocolate Cake', unit = '1 lb'  where name = 'Chocolate Cake 1lb';

-- 5. A proper grocery category name.
update categories set name = 'Rice, Dal & Grains' where name = 'Rice & Grains';
