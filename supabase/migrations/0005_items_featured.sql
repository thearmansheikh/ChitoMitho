-- Items the team wants to show on the home page ("Today's picks"). Off for everything until someone switches it on.
alter table items add column is_featured boolean not null default false;
create index items_featured_idx on items (is_featured) where is_featured;
