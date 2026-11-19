-- OPTIONAL. The very first seed added five sample items with made-up prices. Run this to remove them so customers never see them.
-- Look first:  select p.slug, i.name, i.price_npr from items i join places p on p.id = i.place_id where p.type <> 'food';

delete from public.items i
using public.places p
where i.place_id = p.id
  and ((p.slug = 'grocery' and i.name in ('Rice', 'Tomato'))
    or (p.slug = 'drinks'  and i.name = 'Beer')
    or (p.slug = 'gifts'   and i.name in ('Red Rose Bouquet', 'Chocolate Cake')));
