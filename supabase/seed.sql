-- Seed data for local development (`supabase start` / `db reset`).
-- The same rows are inserted directly in the categories migration so the
-- remote dev/prod projects get them too via `db push` (which doesn't run
-- this file against remote databases).
insert into public.categories (name, icon, default_shelf_life_days, unit_family) values
  ('Latticini', 'nutrition-outline', 7, 'weight'),
  ('Verdura', 'leaf-outline', 5, 'weight'),
  ('Frutta', 'nutrition-outline', 10, 'weight'),
  ('Carne', 'restaurant-outline', 3, 'weight'),
  ('Pesce', 'fish-outline', 2, 'weight'),
  ('Uova', 'egg-outline', 21, 'count'),
  ('Pane e cereali', 'cafe-outline', 5, 'weight'),
  ('Bevande', 'water-outline', 30, 'volume'),
  ('Surgelati', 'snow-outline', 90, 'weight'),
  ('Dispensa', 'archive-outline', 180, 'weight'),
  ('Altro', 'help-circle-outline', null, 'count')
on conflict (name) do nothing;
