create type public.unit_family as enum ('weight', 'volume', 'count');
create type public.inventory_status as enum ('fresh', 'expiring_soon', 'expired', 'consumed');
create type public.expiry_source as enum ('manual', 'category_estimate', 'none');
create type public.shopping_list_source as enum ('manual', 'auto_from_recipe');

-- categories: shared lookup table, no RLS (non-sensitive, same for every user).
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  icon text not null,
  default_shelf_life_days int,
  unit_family public.unit_family not null
);

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
  ('Altro', 'help-circle-outline', null, 'count');

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid references public.categories (id),
  name text not null,
  quantity numeric not null,
  unit_family public.unit_family not null,
  status public.inventory_status not null default 'fresh',
  expiry_date date,
  expiry_source public.expiry_source not null default 'none',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.inventory_items enable row level security;

create policy "inventory_items_select_own"
  on public.inventory_items for select
  using (user_id = auth.uid());

create policy "inventory_items_insert_own"
  on public.inventory_items for insert
  with check (user_id = auth.uid());

create policy "inventory_items_update_own"
  on public.inventory_items for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "inventory_items_delete_own"
  on public.inventory_items for delete
  using (user_id = auth.uid());

create trigger inventory_items_set_updated_at
  before update on public.inventory_items
  for each row
  execute function public.set_updated_at();

create table public.shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  quantity numeric,
  unit_family public.unit_family,
  is_checked boolean not null default false,
  source public.shopping_list_source not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.shopping_list_items enable row level security;

create policy "shopping_list_items_select_own"
  on public.shopping_list_items for select
  using (user_id = auth.uid());

create policy "shopping_list_items_insert_own"
  on public.shopping_list_items for insert
  with check (user_id = auth.uid());

create policy "shopping_list_items_update_own"
  on public.shopping_list_items for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "shopping_list_items_delete_own"
  on public.shopping_list_items for delete
  using (user_id = auth.uid());

create trigger shopping_list_items_set_updated_at
  before update on public.shopping_list_items
  for each row
  execute function public.set_updated_at();
