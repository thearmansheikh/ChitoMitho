-- Different opening hours on different days of the week.
-- Null means "same hours every day" (open_time and close_time). Otherwise an array of 7 objects,
-- index 0 = Sunday ... 6 = Saturday, each like {"open":"10:00","close":"22:00","closed":false}.
alter table settings add column weekday_hours jsonb;

alter table settings add constraint settings_weekday_hours_shape
  check (weekday_hours is null or (jsonb_typeof(weekday_hours) = 'array' and jsonb_array_length(weekday_hours) = 7));
