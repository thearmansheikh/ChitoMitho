-- Fix spelling mistakes copied from the printed Chicken Box menu, in categories, item names and descriptions.
-- Safe to run again: once corrected, nothing matches.
do $$
declare
  r record;
begin
  for r in select * from (values
    ('Leg Pic',   'Leg Piece'),
    ('Maxican',   'Mexican'),
    ('Zinzer',    'Zinger'),
    ('Panner',    'Paneer'),
    ('Mayonise',  'Mayonnaise'),
    ('Chilly',    'Chilli'),
    ('Cocacola',  'Coca-Cola')
  ) as v(old_text, new_text) loop
    update categories set name = replace(name, r.old_text, r.new_text) where name like '%' || r.old_text || '%';
    update items set name = replace(name, r.old_text, r.new_text) where name like '%' || r.old_text || '%';
    update items set description = replace(description, r.old_text, r.new_text) where description like '%' || r.old_text || '%';
  end loop;

  -- A double space left in a name (for example "Tandoori  Zinzer Burger") becomes a single space.
  update categories set name = regexp_replace(btrim(name), '\s{2,}', ' ', 'g') where name ~ '\s{2,}';
  update items set name = regexp_replace(btrim(name), '\s{2,}', ' ', 'g') where name ~ '\s{2,}';
end $$;
