-- Details shown on a café or shop page: where it is, a map link, an optional cover photo and its own opening hours.
alter table places
  add column address text,
  add column maps_url text,
  add column cover_url text,
  add column opens_at time,
  add column closes_at time;

-- Only web links, so a stored value can never be a script.
alter table places add constraint places_maps_url_web check (maps_url is null or maps_url ~* '^https?://');
-- Opening and closing times are set together or not at all (empty means "same as the shop").
alter table places add constraint places_hours_pair check ((opens_at is null) = (closes_at is null));
