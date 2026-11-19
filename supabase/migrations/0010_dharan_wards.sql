-- Dharan Sub-Metropolitan City has 20 wards. Add Dharan-1 ... Dharan-20 to the delivery-area list
-- (after the well-known places already there). Safe to run again: a ward already present is skipped.
insert into areas (name, name_ne, area_group, is_active, sort_order)
select 'Dharan-' || n,
       'धरान-' || translate(n::text, '0123456789', '०१२३४५६७८९'),
       'dharan',
       true,
       100 + n
from generate_series(1, 20) as n
where not exists (select 1 from areas a where a.name = 'Dharan-' || n and a.area_group = 'dharan');
