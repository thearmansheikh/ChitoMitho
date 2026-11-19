-- The delivery charge starts from this amount (shown on the site and in the WhatsApp order). The exact charge
-- still depends on the location and the order and is confirmed on WhatsApp. Null means "do not mention an amount".
alter table settings add column delivery_from_npr numeric(10, 2)
  check (delivery_from_npr is null or delivery_from_npr >= 0);

update settings set delivery_from_npr = 50 where id = 1;
