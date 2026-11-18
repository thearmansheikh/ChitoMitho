-- Attaches drawn illustrations to the cutlet and chicken sausage masala items. Safe to run again.
update items i set image_url = '/images/menu/the-chicken-box/' || case
  when c.name = 'Cutlet' and i.name like '%Veg%' then 'cutlet-veg'
  when c.name = 'Cutlet' then 'cutlet-chicken'
  else 'sausage-masala'
end || '.webp'
from categories c, places p
where i.category_id = c.id and c.place_id = p.id and p.slug = 'the-chicken-box'
  and c.name in ('Cutlet', 'Chicken Sausage Masala');
