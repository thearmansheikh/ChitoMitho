-- Choices a customer can make on one item (size, extras...). Null means the item has no options.
-- An array of groups: [{"name":"Size","name_ne":null,"required":true,"multi":false,
--   "choices":[{"name":"Regular","name_ne":null,"price":0},{"name":"Large","name_ne":null,"price":50}]}]
alter table items add column options jsonb;

alter table items add constraint items_options_shape
  check (options is null or jsonb_typeof(options) = 'array');
