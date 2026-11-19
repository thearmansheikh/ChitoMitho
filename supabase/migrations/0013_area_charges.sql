-- A fixed delivery charge for one area (for example inside BPKIHS). Null means "depends on distance and order".
alter table areas add column delivery_charge_npr numeric(10, 2)
  check (delivery_charge_npr is null or delivery_charge_npr >= 0);

-- BPKIHS (B.P. Koirala Institute of Health Sciences, Dharan): delivery inside the campus is Rs. 50.
insert into areas (name, name_ne, area_group, is_active, sort_order, delivery_charge_npr)
select 'BPKIHS', 'बीपीकेआईएचएस', 'dharan', true, 5, 50
where not exists (select 1 from areas where name = 'BPKIHS' and area_group = 'dharan');
