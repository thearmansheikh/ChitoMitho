-- Attaches drawn illustrations (public/images/menu/the-chicken-box/) to the sandwiches, wraps, drinks and mocktails.
-- Safe to run again.
update items i set image_url = '/images/menu/the-chicken-box/' || case
  when c.name = 'Sandwich' and i.name like '%Paneer%' then 'sandwich-paneer'
  when c.name = 'Sandwich' and i.name like '%Corn%' then 'sandwich-corn'
  when c.name = 'Sandwich' and i.name like '%Chicken%' then 'sandwich-chicken'
  when c.name = 'Sandwich' then 'sandwich-veg'
  when c.name = 'Mexican Wrap' and i.name like '%Paneer%' then 'wrap-paneer'
  when c.name = 'Mexican Wrap' and i.name like '%Chicken%' then 'wrap-chicken'
  when c.name = 'Mexican Wrap' then 'wrap-veg'
  when i.name = 'Virgin Mojito' then 'drink-virgin-mojito'
  when i.name = 'Green Apple Mojito' then 'drink-green-apple-mojito'
  when i.name = 'Blue Lemon Mojito' then 'drink-blue-lemon-mojito'
  when i.name = 'Watermelon Mojito' then 'drink-watermelon-mojito'
  when i.name = 'Coca-Cola' then 'drink-cola'
  when i.name = 'Masala Cola' then 'drink-masala-cola'
  when i.name = 'Sprite' then 'drink-sprite'
  when i.name = 'Masala Sprite' then 'drink-masala-sprite'
  when i.name = 'Xtreme' then 'drink-xtreme'
  when i.name = 'Green Apple Lemonade' then 'drink-green-apple-lemonade'
  when i.name = 'Watermelon Lemonade' then 'drink-watermelon-lemonade'
  when i.name = 'Blue Cupuco Lemonade' then 'drink-blue-lemonade'
end || '.webp'
from categories c, places p
where i.category_id = c.id and c.place_id = p.id and p.slug = 'the-chicken-box'
  and c.name in ('Sandwich', 'Mexican Wrap', 'Refreshing Drinks', 'Mocktails');
